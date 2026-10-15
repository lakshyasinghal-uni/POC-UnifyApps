"""ua-mark.tsx: the brand build animation as an inline SVG (runs on the page's own animation clock).

An animated SVG used as an <img> can stay frozen on its first (invisible) frame when the image loads
while the page isn't painting, or when a cached copy is reused. Inline, the animation belongs to the
page and always completes. All class and keyframe names are prefixed `uam-` so nothing leaks.
"""
import json, math

dots = json.load(open('vec_dots.json'))
small = sorted(dots, key=lambda d: d[2])[:60]
CX = sum(d[0] for d in small) / len(small)
CY = sum(d[1] for d in small) / len(small)
RMAX = max(math.hypot(d[0] - CX, d[1] - CY) for d in dots)
BUCKETS = 48
BUILD = 1.8
DOT = max(0.22, BUILD * 0.22)
SPAN = BUILD - DOT


def key(d):
    r = math.hypot(d[0] - CX, d[1] - CY) / RMAX
    a = (math.atan2(d[1] - CY, d[0] - CX) + math.pi) / (2 * math.pi)
    return min(1.0, 0.82 * math.sqrt(r) + 0.18 * a)


css = [
    f'.uam-g{{transform-box:view-box;transform-origin:{CX:.2f}px {CY:.2f}px;animation:uam-turn {BUILD}s cubic-bezier(.2,.75,.25,1) both}}',
    f'.uam-g circle{{transform-box:fill-box;transform-origin:center;animation:uam-pop {DOT:.2f}s cubic-bezier(.3,1.4,.5,1) both}}',
    '@keyframes uam-turn{0%{transform:rotate(-140deg) scale(.35)}100%{transform:none}}',
    '@keyframes uam-pop{0%{opacity:0;transform:scale(0)}100%{opacity:var(--o);transform:none}}',
]
for i in range(BUCKETS):
    css.append(f'.uam-g .uam-b{i}{{animation-delay:{SPAN * i / (BUCKETS - 1):.3f}s}}')
css.append('@media (prefers-reduced-motion:reduce){.uam-g,.uam-g circle{animation:none!important}.uam-g circle{opacity:var(--o)}}')

circles = []
for d in sorted(dots, key=key):
    k = min(BUCKETS - 1, int(key(d) * BUCKETS))
    circles.append(f'<circle class="uam-b{k}" style="--o:{round(d[3], 2)}" cx="{d[0]:.2f}" cy="{d[1]:.2f}" r="{max(d[2], 0.02):.3f}"/>')

markup = f'<style>{"".join(css)}</style><g class="uam-g" fill="currentColor">{"".join(circles)}</g>'

tsx = f"""import {{ cn }} from '@/lib/utils'

/*
 * The UnifyApps mark, built dot by dot the way the brand animation does: the dots appear along the
 * spiral from the core outward while the mark turns into place (official vector dots of
 * brand-logo-sm-3-comp.svg). Inline on purpose: an animated SVG <img> can stay frozen on its first,
 * invisible frame; inline, the animation runs on the page's clock and always completes. Generated —
 * do not edit by hand (unifyapps-apps/assets/brand-mark/make_inline.py). Colour follows `color` (bronze by default).
 */
const MARKUP = {json.dumps(markup)}

export function UaMark({{ className, title = 'UnifyApps' }}: {{ className?: string; title?: string }}) {{
  return (
    <svg
      aria-label={{title}}
      className={{cn('shrink-0 overflow-visible text-[#847347]', className)}}
      dangerouslySetInnerHTML={{{{ __html: MARKUP }}}}
      role="img"
      viewBox="0 0 33 32"
    />
  )
}}
"""
open('ua-mark.tsx', 'w', encoding='utf8', newline='\n').write(tsx)
print('ua-mark.tsx', len(tsx))
