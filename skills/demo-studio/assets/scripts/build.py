"""Mix the narration into each recorded act, then join the acts into one MP4 + SRT.

    python scripts/build.py

Reads build/timeline.json (when each step started inside its act), build/audio/*.mp3 and
build/durations.json. Writes out/<slug>.mp4 and out/<slug>.srt.

With "motion" on (the default) it first runs scripts/motion.mjs, which renders the title cards as animated
HyperFrames clips, and dissolves each card into its act: the opening and act card before an act's first screen,
the closing card after the last one.
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
# "Powered and built by UnifyApps" is burned into every frame of the film (never into the app). On by default;
# "badge": false turns it off, {"text", "position"} restyle it. See references/config.md.
BADGE = config.get("badge", {})
# the title cards: rendered by scripts/motion.mjs and dissolved into the acts over this long
MOTION = config.get("motion", {}) is not False
XFADE_MS = 600
if BADGE is not False:
    BADGE = {"text": "Powered and built by", "position": "bottom-right", "logo": "brand/unifyapps-logo.png", **(BADGE or {})}


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


def video_size(path: Path) -> tuple[int, int]:
    probe = subprocess.run([FFMPEG, "-i", str(path)], capture_output=True, text=True).stderr
    w, h = re.search(r"Video:.*?(\d{3,5})x(\d{3,5})", probe).groups()
    return int(w), int(h)


def make_badge(height: int) -> tuple[Path, int]:
    """The badge as a PNG sized for a frame `height` pixels tall, and its margin. A cream pill with the words and
    the UnifyApps logo, readable on light app screens and on the dark title cards alike."""
    from PIL import Image, ImageDraw, ImageFilter, ImageFont

    k = 4                                        # drawn at 4x and scaled down, so the small text stays sharp
    pill_h = max(26, round(height * 0.036)) * k
    pad = pill_h // 2
    logo = Image.open(ROOT / BADGE["logo"]).convert("RGBA")
    logo_h = round(pill_h * 0.6)
    logo = logo.resize((round(logo.width * logo_h / logo.height), logo_h), Image.LANCZOS)
    font = None
    for name in ("segoeuisb.ttf", "seguisb.ttf", "segoeui.ttf", "Poppins-Medium.ttf", "DejaVuSans.ttf", "Arial.ttf"):
        try:
            font = ImageFont.truetype(name, round(pill_h * 0.36))
            break
        except OSError:
            continue
    font = font or ImageFont.load_default()
    text = BADGE["text"]
    tw = round(ImageDraw.Draw(Image.new("RGBA", (1, 1))).textlength(text, font=font))
    gap = round(pill_h * 0.22)
    shadow = pill_h // 5
    w, h = pad + tw + gap + logo.width + pad, pill_h
    img = Image.new("RGBA", (w + 2 * shadow, h + 2 * shadow), (0, 0, 0, 0))
    shade = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shade).rounded_rectangle((shadow, shadow + k, shadow + w, shadow + h + k), h // 2, fill=(0, 0, 0, 70))
    img.alpha_composite(shade.filter(ImageFilter.GaussianBlur(shadow / 2)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((shadow, shadow, shadow + w, shadow + h), h // 2, fill=(252, 250, 245, 240), outline=(221, 210, 190, 255), width=k)
    d.text((shadow + pad, shadow + h / 2), text, font=font, fill=(64, 64, 64, 255), anchor="lm")
    img.alpha_composite(logo, (shadow + pad + tw + gap, shadow + (h - logo.height) // 2))
    img = img.resize((round(img.width / k), round(img.height / k)), Image.LANCZOS)
    out = BUILD / "badge.png"
    img.save(out)
    return out, max(8, round(height * 0.012))


def badge_xy(margin: int) -> str:
    """ffmpeg overlay coordinates for the configured corner."""
    pos = BADGE["position"]
    x = f"{margin}" if "left" in pos else ("(W-w)/2" if "center" in pos else f"W-w-{margin}")
    y = f"{margin}" if pos.startswith("top") else f"H-h-{margin}"
    return f"{x}:{y}"


# ---- framed acts: a phone-sized act scaled into the film frame, its captions in the side panels ----------------
# config "frame": {"width", "height"} (default: the main viewport). A persona with "framed": true is filmed at its own
# (phone) viewport; here it is scaled to the frame's height, centred on the brand ink, and its caption (act + headline
# on one side, the spoken line on the other) is burned in with libass, which shapes Arabic and other scripts correctly.
FRAME = {**config.get("viewport", {"width": 1440, "height": 900}), **(config.get("frame") or {})}


def ass_colour(hexstr: str, alpha: int = 0) -> str:
    h = hexstr.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


def ass_time(ms: int) -> str:
    ms = max(0, ms)
    return f"{ms // 3600000}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000 // 10:02d}"


def ass_text(t: str) -> str:
    return re.sub(r"<[^>]+>", "", t).replace("\\", "/").replace("{", "(").replace("}", ")").replace(chr(10), " ")


def write_side_ass(path: Path, inner_w: int, act_label: str, act_title: str, scenes: list) -> None:
    W, H = FRAME["width"], FRAME["height"]
    side = (W - inner_w) // 2
    brand = config.get("brand", {})
    ink, accent, muted = brand.get("ink", "#0d1a33"), brand.get("accent", "#d6a04a"), brand.get("muted", "#9fb0c9")
    font = (config.get("captions") or {}).get("assFont", "Segoe UI")
    m_out, m_in = 56, W - side + 36   # left panel: x 56 .. side-36; right panel: x W-side+36 .. W-56
    rtl = (config.get("captions") or {}).get("rtl", False)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kicker,{font},20,{ass_colour(accent)},&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,{0 if rtl else 2},0,1,0,0,{9 if rtl else 7},{m_out},{m_in},150,1
Style: Act,{font},40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,{9 if rtl else 7},{m_out},{m_in},190,1
Style: Head,{font},34,{ass_colour(accent)},&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,{9 if rtl else 7},{m_in},{m_out},150,1
Style: Line,{font},25,&H00F2F2F2,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,{9 if rtl else 7},{m_in},{m_out},{150 + 34 * 3},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    end_all = max((e for _, e, _, _ in scenes), default=0) + 2000
    rows = [f"Dialogue: 0,{ass_time(0)},{ass_time(end_all)},Kicker,,0,0,0,,{ass_text(act_label)}",
            f"Dialogue: 0,{ass_time(0)},{ass_time(end_all)},Act,,0,0,0,,{ass_text(act_title)}"]
    for start, end, headline, line in scenes:
        rows.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Head,,0,0,0,,{ass_text(headline)}")
        rows.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Line,,0,0,0,,{ass_text(line)}")
    path.write_text(head + chr(10).join(rows) + chr(10), encoding="utf-8")


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


def act_window(seg: dict) -> dict:
    """Where an act sits in its raw recording, and how long its picture runs once the silent stretches are cut."""
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
    # silent stretches the recorder logged (an action that outlasted its line) are cut out;
    # every later scene, its voice and its subtitle move up by what was cut before it
    cuts = sorted((e["cut"][0] - act_rel, e["cut"][1] - act_rel) for e in seg["steps"] if e.get("cut"))
    cut_total = sum(b - a for a, b in cuts)
    main_ms = (length_ms if length_ms else (seg.get("activeMs") or raw_ms) - act_rel) - cut_total
    return {"raw_ms": raw_ms, "act_rel": act_rel, "start_ms": start_ms, "length_ms": length_ms, "cuts": cuts,
            "cut_total": cut_total, "main_ms": main_ms}


def extract_frames(seg: dict, win: dict, persona: dict) -> None:
    """The act's first and last frame, for the cards to hand over to and from (scripts/motion.mjs)."""
    if persona.get("framed"):
        return   # a phone act is composed in the film frame by ffmpeg; its cards dissolve instead
    frames = BUILD / "motion" / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    first = win["start_ms"] + 40
    last = win["start_ms"] + win["main_ms"] + win["cut_total"] - 120
    for name, at in (("first", first), ("last", last)):
        subprocess.run([FFMPEG, "-y", "-v", "error", "-ss", f"{at / 1000:.3f}", "-i", seg["video"], "-frames:v", "1",
                        str(frames / f"{seg['segment']}_{name}.png")], check=True)


def motion_clips(timeline: list, windows: dict, personas: dict, diagram_acts: list) -> dict:
    """The rendered motion by (act, role) — "head", "tail", "seat", "diagram" — and by (act, "callout") as a list."""
    film = [s for s in timeline if s.get("cards") == "film"]
    if diagram_acts and not MOTION:
        raise SystemExit(f"Act(s) {', '.join(diagram_acts)} are architecture diagrams, which HyperFrames draws: turn \"motion\" back on.")
    if not film and not diagram_acts:
        return {}
    if not MOTION:
        print(f"  acts {', '.join(s['segment'] for s in film)} were recorded for animated cards, but \"motion\" is now off: "
              "they get no cards. Turn it back on, or re-record them for the static cards.")
        return {}
    for seg in film:
        extract_frames(seg, windows[seg["segment"]], personas[seg["segment"]])
    print("  rendering the motion graphics (HyperFrames)...", flush=True)
    if subprocess.run(["node", str(ROOT / "scripts" / "motion.mjs")], cwd=ROOT).returncode:
        raise SystemExit("The motion graphics did not render; see build/motion.log.")
    manifest = json.loads((BUILD / "motion" / "cards.json").read_text(encoding="utf-8"))
    clips: dict = {}
    for c in manifest.values():
        if c["role"] == "callout":
            clips.setdefault((c["segment"], "callout"), []).append(c)
        else:
            clips[(c["segment"], c["role"])] = c
    return clips


def overlays_wanted(seat, callouts) -> bool:
    return bool(seat or callouts)


def main() -> None:
    steps = {s["id"]: s for s in json.loads((ROOT / "steps.json").read_text(encoding="utf-8"))}
    durations = json.loads((BUILD / "durations.json").read_text(encoding="utf-8"))
    order = list(dict.fromkeys(s["segment"] for s in steps.values()))
    # the architecture act is drawn by motion.mjs from diagram.json, never recorded
    diagram_acts = [seg for seg in order if any(s.get("diagram") for s in steps.values() if s["segment"] == seg)]
    timeline_file = BUILD / "timeline.json"
    timeline = json.loads(timeline_file.read_text(encoding="utf-8"))["segments"] if timeline_file.exists() else []
    timeline = [s for s in timeline if s["segment"] not in diagram_acts]
    OUT.mkdir(parents=True, exist_ok=True)

    ordered = sorted(timeline, key=lambda s: order.index(s["segment"]) if s["segment"] in order else 99)
    windows = {seg["segment"]: act_window(seg) for seg in ordered}
    personas = {seg["segment"]: config["personas"].get(next((steps[e["id"]]["persona"] for e in seg["steps"]), ""), {}) for seg in ordered}
    cards = motion_clips(ordered, windows, personas, diagram_acts)
    # each diagram act joins the film as if it had been recorded: its clip is the footage, its lines start where
    # motion.mjs placed them, and its cards (opening, act card) work exactly as for a recorded act
    for seg in diagram_acts:
        clip = cards.get((seg, "diagram"))
        if not clip:
            raise SystemExit(f"Act {seg}: the architecture diagram did not render; see build/motion.log.")
        synthetic = {"segment": seg, "video": clip["file"], "steps": clip["steps"], "cards": "film", "diagram": True}
        windows[seg] = act_window(synthetic)
        personas[seg] = {}
        ordered.append(synthetic)
    ordered.sort(key=lambda s: order.index(s["segment"]) if s["segment"] in order else 99)
    out_mp4 = OUT / f"{SLUG}.mp4"
    out_srt = OUT / f"{SLUG}.srt"
    parts, srt, offset, n = [], [], 0, 0

    for seg in ordered:
        part = BUILD / f"act_{seg['segment']}.mp4"
        win = windows[seg["segment"]]
        raw_ms, act_rel, start_ms, length_ms = win["raw_ms"], win["act_rel"], win["start_ms"], win["length_ms"]
        cuts, cut_total, main_ms = win["cuts"], win["cut_total"], win["main_ms"]

        trim = ["-ss", f"{start_ms / 1000:.3f}"] if start_ms else []
        if length_ms:
            trim += ["-t", f"{length_ms / 1000:.3f}"]
        cmd = [FFMPEG, "-y", *trim, "-i", seg["video"]]
        def shifted(ms: int) -> int:
            return ms - sum(min(b, ms) - a for a, b in cuts if ms > a)

        film_cards = seg.get("cards") == "film"
        head = cards.get((seg["segment"], "head")) if film_cards else None
        tail = cards.get((seg["segment"], "tail")) if film_cards else None
        seat = cards.get((seg["segment"], "seat")) if film_cards else None
        callouts = cards.get((seg["segment"], "callout"), []) if film_cards else []
        # a card that ends on the act's own first frame is joined with a cut; one rendered without it, with a dissolve
        head_cut = bool(head and head.get("join") == "cut")
        tail_cut = bool(tail and tail.get("join") == "cut")
        # everything in the act (voice, subtitles, overlays) starts this much later
        head_shift = (head["ms"] if head_cut else head["ms"] - XFADE_MS) if head else 0
        next_input = 1

        filters, labels = [], []
        video = "[0:v]"
        if cuts:
            keep = "+".join(f"between(t,{a / 1000:.3f},{b / 1000:.3f})" for a, b in cuts)
            filters.append(f"[0:v]fps=25,select='not({keep})',setpts=N/25/TB[vcut]")
            video = "[vcut]"
        for i, entry in enumerate(seg["steps"], start=1):
            cmd += ["-i", str(BUILD / "audio" / f"{entry['id']}.mp3")]
            next_input += 1
            delay = max(0, shifted(entry["startMs"] - act_rel) + LEAD_MS) + head_shift
            filters.append(f"[{i}:a]adelay={delay}|{delay}[a{i}]")
            labels.append(f"[a{i}]")
        # a framed (phone) act: scale it into the film frame and put its captions in the side panels
        persona = personas[seg["segment"]]
        vw, vh = video_size(Path(seg["video"]))
        if persona.get("framed") and (vw, vh) != (FRAME["width"], FRAME["height"]):
            inner_w = round(vw * FRAME["height"] / vh / 2) * 2
            ink = config.get("brand", {}).get("ink", "#0d1a33").lstrip("#")
            ass_path = BUILD / f"side_{seg['segment']}.ass"
            meta = (config.get("acts") or {}).get(seg["segment"], {})
            # the act number as the recorder's title card shows it (config.mjs actMeta): declared, or Roman by order
            order = list(dict.fromkeys(s["segment"] for s in steps.values()))
            roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
            idx = order.index(seg["segment"]) if seg["segment"] in order else 0
            act_n = meta.get("n") or (roman[idx] if idx < len(roman) else str(idx + 1))
            label = meta.get("kicker") or (config.get("actWord", "Act") + " " + str(act_n)).strip()
            scenes = []
            for k, entry in enumerate(seg["steps"]):
                s0 = max(0, shifted(entry["startMs"] - act_rel)) + LEAD_MS
                nxt = seg["steps"][k + 1] if k + 1 < len(seg["steps"]) else None
                s1 = max(0, shifted(nxt["startMs"] - act_rel)) + LEAD_MS if nxt else s0 + int(durations[entry["id"]] * 1000) + 1500
                st = steps[entry["id"]]
                scenes.append((s0, s1, st.get("caption", ""), st.get("narration", "")))
            write_side_ass(ass_path, inner_w, label, meta.get("title", ""), scenes)
            filters.append(f"{video}scale={inner_w}:{FRAME['height']},pad={FRAME['width']}:{FRAME['height']}:(ow-iw)/2:0:color=0x{ink},ass='{ass_path.name}'[vframe]")
            video = "[vframe]"
        if head or tail or overlays_wanted(seat, callouts):
            # the cards were rendered at the act's picture size; both sides of a dissolve need one size, rate and format,
            # and xfade needs a constant frame rate on each input, so fps comes after any trim
            ow, oh = (FRAME["width"], FRAME["height"]) if persona.get("framed") else (vw, vh)
            norm = f"fps=25,scale={ow}:{oh},format=yuv420p,setsar=1"
            filters.append(f"{video}trim=duration={main_ms / 1000:.3f},setpts=PTS-STARTPTS,{norm}[vmain]")
            video = "[vmain]"
            if head:
                cmd += ["-i", head["file"]]
                filters.append(f"[{next_input}:v]setpts=PTS-STARTPTS,{norm}[vhead]")
                if head_cut:   # the card's last frame IS the act's first: a cut is seamless
                    filters.append(f"[vhead]{video}concat=n=2:v=1:a=0[vxhead]")
                else:
                    filters.append(f"[vhead]{video}xfade=transition=fade:duration={XFADE_MS / 1000}:offset={head_shift / 1000:.3f}[vxhead]")
                video, next_input = "[vxhead]", next_input + 1
            if tail:
                cmd += ["-i", tail["file"]]
                filters.append(f"[{next_input}:v]setpts=PTS-STARTPTS,{norm}[vtail]")
                if tail_cut:
                    filters.append(f"{video}[vtail]concat=n=2:v=1:a=0[vxtail]")
                else:
                    filters.append(f"{video}[vtail]xfade=transition=fade:duration={XFADE_MS / 1000}:offset={(head_shift + main_ms - XFADE_MS) / 1000:.3f}[vxtail]")
                video, next_input = "[vxtail]", next_input + 1
        # transparent motion over the footage: the seat lower third as the act opens, stat callouts on their words
        overlays = []
        if seat:
            overlays.append((seat, head_shift + seat["atMs"], seat["ms"]))
        ids = [e["id"] for e in seg["steps"]]
        starts = {e["id"]: e["startMs"] for e in seg["steps"]}
        for c in callouts:
            if c["step"] not in starts:
                continue
            at_ms = head_shift + max(0, shifted(starts[c["step"]] - act_rel)) + LEAD_MS + c["atMs"]
            # a callout belongs to its scene: it is gone by the time the next one starts
            nxt = ids[ids.index(c["step"]) + 1] if ids.index(c["step"]) + 1 < len(ids) else None
            until = head_shift + max(0, shifted(starts[nxt] - act_rel)) if nxt else head_shift + main_ms
            overlays.append((c, at_ms, max(800, min(c["ms"], until - at_ms))))
        for k, (clip, at_ms, keep_ms) in enumerate(overlays):
            cmd += ["-i", clip["file"]]
            filters.append(f"[{next_input}:v]trim=duration={keep_ms / 1000:.3f},setpts=PTS-STARTPTS+{at_ms / 1000:.3f}/TB[ov{k}]")
            filters.append(f"{video}[ov{k}]overlay=0:0:eof_action=pass:format=auto[vov{k}]")
            video, next_input = f"[vov{k}]", next_input + 1
        if BADGE is not False:
            badge, margin = make_badge(FRAME["height"] if persona.get("framed") else video_size(Path(seg["video"]))[1])
            cmd += ["-i", str(badge)]
            filters.append(f"{video}[{next_input}:v]overlay={badge_xy(margin)}:format=auto[vbadge]")
            video, next_input = "[vbadge]", next_input + 1
        filters.append(
            f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,apad[aout]"
        )
        out_len = []
        if cuts:
            print(f"  act {seg['segment']}: cutting {len(cuts)} silent stretch(es), {cut_total / 1000:.1f}s")
        if video != "[0:v]":
            # -shortest never ends when the video comes out of a filter graph and the audio is
            # padded, so an act whose picture is filtered (cut, or badged) gets an explicit length
            total_ms = head_shift + main_ms + ((tail["ms"] if tail_cut else tail["ms"] - XFADE_MS) if tail else 0)
            out_len = ["-t", f"{max(1000, total_ms) / 1000:.3f}"]
        cmd += [
            "-filter_complex", ";".join(filters),
            "-map", video if video != "[0:v]" else "0:v", "-map", "[aout]", *(out_len or ["-shortest"]),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "25",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            str(part),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=BUILD)
        if result.returncode:
            print(result.stderr[-2500:])
            raise SystemExit(f"ffmpeg failed on act {seg['segment']}")
        parts.append(part)
        extra = [k for k, c in (("opening/act card", head), ("closing card", tail), ("seat lower third", seat)) if c]
        if callouts:
            extra.append(f"{len(callouts)} callout{'s' if len(callouts) > 1 else ''}")
        print(f"  act {seg['segment']}: {duration_ms(part) / 1000:6.1f}s  ({len(seg['steps'])} scenes{' + ' + ' and '.join(extra) if extra else ''})")

        for entry in seg["steps"]:
            n += 1
            start = offset + head_shift + max(0, shifted(entry["startMs"] - act_rel)) + LEAD_MS
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
