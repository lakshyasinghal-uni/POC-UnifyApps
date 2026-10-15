"""Generate animated UnifyApps mark SVGs from the official vector dots (brand-logo-sm-3-comp.svg).

Motion follows the brand animation (UnifyApps-Logo-Animation-GreenGold.mp4): the dots appear one after
another along the spiral, from the core outward, while the whole mark turns and grows into place.
"""
import json, math, sys

dots = json.load(open('vec_dots.json'))  # [x, y, r, opacity] in a 33 x 32 viewBox

# the eye of the spiral: where the smallest dots cluster
small = sorted(dots, key=lambda d: d[2])[:60]
CX = sum(d[0] for d in small) / len(small)
CY = sum(d[1] for d in small) / len(small)
RMAX = max(math.hypot(d[0] - CX, d[1] - CY) for d in dots)


def order_key(d):
    """0..1: distance from the core first, then the angle so each ring sweeps round like the video."""
    r = math.hypot(d[0] - CX, d[1] - CY) / RMAX
    a = (math.atan2(d[1] - CY, d[0] - CX) + math.pi) / (2 * math.pi)
    return min(1.0, 0.82 * math.sqrt(r) + 0.18 * a)


BUCKETS = 48  # dots share delay classes to keep the file small


def build(name, color, build_s, loop=False, hold_s=1.6, fade_s=0.5):
    total = build_s + hold_s + fade_s if loop else build_s
    dot_s = max(0.22, build_s * 0.22)  # each dot's own grow time
    span = build_s - dot_s  # delays run over the rest
    css = [
        f'svg{{overflow:visible}}',
        f'.g{{transform-box:view-box;transform-origin:{CX:.2f}px {CY:.2f}px;'
        f'animation:turn {total:.2f}s cubic-bezier(.2,.75,.25,1) {"infinite" if loop else "both"}}}',
        f'circle{{transform-box:fill-box;transform-origin:center;opacity:0;'
        f'animation:pop {total:.2f}s cubic-bezier(.3,1.4,.5,1) {"infinite" if loop else "both"}}}',
    ]
    # whole-mark turn and grow during the build (then still); in loop mode also a soft fade at the end
    b = build_s / total * 100
    if loop:
        f0 = (build_s + hold_s) / total * 100
        css.append(f'@keyframes turn{{0%{{transform:rotate(-140deg) scale(.35);opacity:1}}{b:.1f}%{{transform:none;opacity:1}}'
                   f'{f0:.1f}%{{transform:none;opacity:1}}100%{{transform:rotate(25deg) scale(.9);opacity:0}}}}')
    else:
        css.append(f'@keyframes turn{{0%{{transform:rotate(-140deg) scale(.35)}}100%{{transform:none}}}}')
    # per-bucket delay: a dot is invisible, then pops in over dot_s and stays at its own opacity (via --o)
    for i in range(BUCKETS):
        start = span * i / (BUCKETS - 1)
        s = start / total * 100
        e = (start + dot_s) / total * 100
        kf = f'p{i}'
        if loop:
            f0 = (build_s + hold_s) / total * 100
            css.append(f'@keyframes {kf}{{0%,{s:.2f}%{{opacity:0;transform:scale(0)}}{e:.2f}%,{f0:.2f}%{{opacity:var(--o);transform:none}}100%{{opacity:0;transform:none}}}}')
        else:
            css.append(f'@keyframes {kf}{{0%,{s:.2f}%{{opacity:0;transform:scale(0)}}100%{{opacity:var(--o);transform:none}}}}' if e >= 99.99 else
                       f'@keyframes {kf}{{0%,{s:.2f}%{{opacity:0;transform:scale(0)}}{e:.2f}%,100%{{opacity:var(--o);transform:none}}}}')
        css.append(f'.b{i}{{animation-name:{kf}}}')
    # reduced motion: the finished mark, no movement
    css.append('@media (prefers-reduced-motion:reduce){.g,circle{animation:none!important}circle{opacity:var(--o)!important}}')

    body = []
    for d in sorted(dots, key=order_key):
        k = min(BUCKETS - 1, int(order_key(d) * BUCKETS))
        o = round(d[3], 2)
        body.append(f'<circle class="b{k}" style="--o:{o}" cx="{d[0]:.2f}" cy="{d[1]:.2f}" r="{max(d[2], 0.02):.3f}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 32" width="33" height="32" role="img" aria-label="UnifyApps">'
           f'<style>{"".join(css)}</style><g class="g" fill="{color}">{"".join(body)}</g></svg>')
    open(name, 'w', encoding='utf8').write(svg)
    print(name, len(svg), 'bytes', f'core=({CX:.2f},{CY:.2f})')


BRONZE = '#847347'      # the official small logo colour (light surfaces)
CHAMPAGNE = '#C9B37C'   # the gold on the brand's dark green (video, presentation)
build('ua-mark-build.svg', BRONZE, 1.8)
build('ua-mark-loop.svg', BRONZE, 1.6, loop=True)
build('ua-mark-build-champagne.svg', CHAMPAGNE, 3.4)
build('ua-mark-loop-champagne.svg', CHAMPAGNE, 1.6, loop=True)
