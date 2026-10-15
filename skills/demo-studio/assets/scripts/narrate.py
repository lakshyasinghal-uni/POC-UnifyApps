"""Generate one neural-voice narration clip per step and record each clip's duration.

    python scripts/narrate.py            every step
    python scripts/narrate.py a3 b1      re-voice named steps only

Writes build/audio/<id>.mp3 and build/durations.json, which the recorder reads to know
how long to hold each scene and build.py reads to time the subtitles, and build/words.json —
when each word is spoken — which lets a step's `at` cue fire a highlight on the word itself.
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
AUDIO = BUILD / "audio"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

config = json.loads((ROOT / "demo.config.json").read_text(encoding="utf-8"))
voice = {"name": "en-GB-SoniaNeural", "rate": "-4%", **config.get("voice", {})}


def duration_seconds(path: Path) -> float:
    probe = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", probe.stderr)
    if not match:
        raise RuntimeError(f"Could not read the duration of {path}")
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


async def main() -> None:
    steps = json.loads((ROOT / "steps.json").read_text(encoding="utf-8"))
    only = set(sys.argv[1:])
    AUDIO.mkdir(parents=True, exist_ok=True)

    durations_file = BUILD / "durations.json"
    durations = json.loads(durations_file.read_text(encoding="utf-8")) if durations_file.exists() else {}
    words_file = BUILD / "words.json"
    words = json.loads(words_file.read_text(encoding="utf-8")) if words_file.exists() else {}

    total = 0.0
    for step in steps:
        target = AUDIO / f"{step['id']}.mp3"
        if only and step["id"] not in only:
            # Keep the existing timing for steps this run is not re-voicing.
            if target.exists() and step["id"] in durations:
                total += durations[step["id"]]
            continue
        # Word boundaries come in the same stream as the audio, offset from the clip's first
        # sample in 100 ns ticks. The recorder reads them to glow an element on its word.
        audio, spoken = bytearray(), []
        speech = edge_tts.Communicate(step["narration"], voice["name"], rate=voice["rate"], boundary="WordBoundary")
        async for chunk in speech.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] // 10_000
                spoken.append([start, start + chunk["duration"] // 10_000, chunk["text"]])
        target.write_bytes(bytes(audio))
        words[step["id"]] = spoken
        durations[step["id"]] = round(duration_seconds(target), 2)
        total += durations[step["id"]]
        print(f"{step['id']:>4}  {durations[step['id']]:>6.2f}s  {step['caption']}")

    # Drop timings for steps that no longer exist, so a deleted step cannot haunt the build.
    live = {s["id"] for s in steps}
    durations = {k: v for k, v in durations.items() if k in live}
    words = {k: v for k, v in words.items() if k in live}

    durations_file.write_text(json.dumps(durations, indent=2), encoding="utf-8")
    words_file.write_text(json.dumps(words), encoding="utf-8")
    print(f"\nNarration total: {total:.0f}s  ({total / 60:.1f} min) across {len(steps)} steps")
    print("The video runs longer — each step also holds for the on-screen action.")


asyncio.run(main())
