"""Mix the narration into each recorded act, then join the acts into one MP4 + SRT.

    python scripts/build.py

Reads build/timeline.json (when each step started inside its act), build/audio/*.mp3 and
build/durations.json. Writes out/<slug>.mp4 and out/<slug>.srt.
"""
import json
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
OUT = ROOT / "out"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

config = json.loads((ROOT / "demo.config.json").read_text(encoding="utf-8"))
SLUG = config["slug"]
# the same default as config.mjs — the recorder starts each scene's clock this far before its line
pacing = {"narrationLeadMs": 300, **config.get("pacing", {})}
LEAD_MS = pacing["narrationLeadMs"]
SUBTITLE_WIDTH = config.get("subtitleWidth", 42)


def duration_ms(path: Path) -> int:
    probe = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True)
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", probe.stderr).groups()
    return int((int(h) * 3600 + int(m) * 60 + float(s)) * 1000)


def find_sync(video: str, near_ms: int) -> int | None:
    """Where the recorder's magenta sync flash starts in the raw footage, in ms, or None.

    The recorder paints one full-frame #ff00ff flash just before each act's clock starts
    (record-core.mjs syncMark). Its first frame carries the same screen-capture delay as
    every highlight after it, so starting the act from it keeps picture and voice together.
    Only a window around the length-based estimate is scanned: that estimate is off by
    seconds at most, and a whole sign-in recording is slow to decode.
    """
    start = max(0, near_ms - 6000)
    probe = subprocess.run(
        [FFMPEG, "-hide_banner", "-ss", f"{start / 1000:.3f}", "-t", "9", "-i", video, "-an",
         "-vf", "scale=64:36,signalstats,metadata=print", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    runs, t, u, hit = [], None, None, False
    for line in probe.splitlines():
        if m := re.search(r"pts_time:([\d.]+)", line):
            t = start + float(m.group(1)) * 1000
        elif m := re.search(r"signalstats\.UAVG=([\d.]+)", line):
            u = float(m.group(1))
        elif (m := re.search(r"signalstats\.VAVG=([\d.]+)", line)) and t is not None and u is not None:
            magenta = u > 175 and float(m.group(1)) > 185   # #ff00ff: U≈202, V≈222; no app screen gets near both
            if magenta and not hit:
                runs.append(t)
            hit = magenta
    return round(min(runs, key=lambda r: abs(r - near_ms))) if runs else None


def srt_time(ms: int) -> str:
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def wrap(text: str, width: int = SUBTITLE_WIDTH) -> str:
    """Two balanced lines read better on screen than one long one."""
    words, lines, line = text.split(), [], ""
    for w in words:
        if len(line) + len(w) + 1 > width and line:
            lines.append(line)
            line = w
        else:
            line = f"{line} {w}".strip()
    if line:
        lines.append(line)
    if len(lines) > 2:
        mid = len(words) // 2
        lines = [" ".join(words[:mid]), " ".join(words[mid:])]
    return "\n".join(lines)


def main() -> None:
    timeline = json.loads((BUILD / "timeline.json").read_text(encoding="utf-8"))["segments"]
    steps = {s["id"]: s for s in json.loads((ROOT / "steps.json").read_text(encoding="utf-8"))}
    durations = json.loads((BUILD / "durations.json").read_text(encoding="utf-8"))
    order = list(dict.fromkeys(s["segment"] for s in steps.values()))
    OUT.mkdir(parents=True, exist_ok=True)

    out_mp4 = OUT / f"{SLUG}.mp4"
    out_srt = OUT / f"{SLUG}.srt"
    parts, srt, offset, n = [], [], 0, 0

    for seg in sorted(timeline, key=lambda s: order.index(s["segment"]) if s["segment"] in order else 99):
        part = BUILD / f"act_{seg['segment']}.mp4"

        # Playwright starts filming when the page is created — before the session check,
        # the settle, and (in live-record.mjs) a human sign-in of unknown length. None of
        # that is in the timeline, so it has to come off the front or every narration line
        # plays early. `activeMs` is how long the acts actually ran, so the act begins at
        # duration - activeMs. `actStartMs`/`actEndMs` slice one recording that holds
        # several acts. `trimStartMs`/`trimMs` override both by hand when needed.
        raw_ms = duration_ms(Path(seg["video"]))
        file_start = max(0, raw_ms - seg["activeMs"]) if seg.get("activeMs") else 0
        act_rel = seg.get("actStartMs", 0)
        start_ms = file_start + act_rel
        # The length-based start is only an estimate: Playwright keeps filming for a variable
        # stretch after the act (closing the context, flushing the file), so it lands late and
        # the picture runs ahead of the voice. The sync flash puts the start on the frame.
        if seg.get("syncMs") is not None and "trimStartMs" not in seg:
            flash = find_sync(seg["video"], start_ms - seg["syncMs"])
            if flash is None:
                print(f"  act {seg['segment']}: no sync flash found; using the length estimate (can drift ~2 s)")
            else:
                synced = flash + seg["syncMs"]
                print(f"  act {seg['segment']}: synced on the flash ({(start_ms - synced) / 1000:+.2f}s against the estimate)")
                start_ms = synced
        start_ms = seg.get("trimStartMs", start_ms)
        length_ms = seg.get("trimMs")
        if length_ms is None and seg.get("actEndMs") is not None:
            length_ms = seg["actEndMs"] - act_rel

        trim = ["-ss", f"{start_ms / 1000:.3f}"] if start_ms else []
        if length_ms:
            trim += ["-t", f"{length_ms / 1000:.3f}"]
        cmd = [FFMPEG, "-y", *trim, "-i", seg["video"]]
        # silent stretches the recorder logged (an action that outlasted its line) are cut out;
        # every later scene, its voice and its subtitle move up by what was cut before it
        cuts = sorted((e["cut"][0] - act_rel, e["cut"][1] - act_rel) for e in seg["steps"] if e.get("cut"))

        def shifted(ms: int) -> int:
            return ms - sum(min(b, ms) - a for a, b in cuts if ms > a)

        filters, labels = [], []
        if cuts:
            keep = "+".join(f"between(t,{a / 1000:.3f},{b / 1000:.3f})" for a, b in cuts)
            filters.append(f"[0:v]fps=25,select='not({keep})',setpts=N/25/TB[vout]")
        for i, entry in enumerate(seg["steps"], start=1):
            cmd += ["-i", str(BUILD / "audio" / f"{entry['id']}.mp3")]
            delay = max(0, shifted(entry["startMs"] - act_rel) + LEAD_MS)
            filters.append(f"[{i}:a]adelay={delay}|{delay}[a{i}]")
            labels.append(f"[a{i}]")
        filters.append(
            f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,apad[aout]"
        )
        out_len = []
        if cuts:
            cut_total = sum(b - a for a, b in cuts)
            print(f"  act {seg['segment']}: cutting {len(cuts)} silent stretch(es), {cut_total / 1000:.1f}s")
            # -shortest never ends when the video comes out of a filter graph and the audio is
            # padded, so a cut act gets an explicit length instead
            base = length_ms if length_ms else (seg.get("activeMs") or duration_ms(Path(seg["video"]))) - act_rel
            out_len = ["-t", f"{max(1000, base - cut_total) / 1000:.3f}"]
        cmd += [
            "-filter_complex", ";".join(filters),
            "-map", "[vout]" if cuts else "0:v", "-map", "[aout]", *(out_len or ["-shortest"]),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "25",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            str(part),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode:
            print(result.stderr[-2500:])
            raise SystemExit(f"ffmpeg failed on act {seg['segment']}")
        parts.append(part)
        print(f"  act {seg['segment']}: {duration_ms(part) / 1000:6.1f}s  ({len(seg['steps'])} scenes)")

        for entry in seg["steps"]:
            n += 1
            start = offset + max(0, shifted(entry["startMs"] - act_rel)) + LEAD_MS
            end = start + int(durations[entry["id"]] * 1000)
            srt += [str(n), f"{srt_time(start)} --> {srt_time(end)}", wrap(steps[entry["id"]]["narration"]), ""]
        offset += duration_ms(part)

    concat_list = BUILD / "acts.txt"
    concat_list.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    subprocess.run(
        [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
         "-c", "copy", "-movflags", "+faststart", str(out_mp4)],
        check=True, capture_output=True,
    )
    out_srt.write_text("\n".join(srt), encoding="utf-8")
    total = duration_ms(out_mp4) / 1000
    size = out_mp4.stat().st_size / 1024 / 1024
    print(f"\nWrote {out_mp4.relative_to(ROOT)}  —  {int(total // 60)}m {int(total % 60)}s, "
          f"{n} narrated scenes, {size:.0f} MB")
    print(f"Wrote {out_srt.relative_to(ROOT)}")


main()
