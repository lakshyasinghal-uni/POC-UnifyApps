// Pulse Gauge — a radial KPI gauge for UnifyApps config pages. No dependencies, no build step.
// data: { label, value, target, min=0, max=100, unit='%', previous?, caption?, theme: 'light'|'dark' }
// Clicking the gauge fires the block's onChange with { label, value, target, gap } — read them in the
// handler as {{ label }}, {{ value }}, {{ gap }}. Runtime contract: references/custom-components.md.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const parse = d => (typeof d === 'string' ? (() => { try { return JSON.parse(d); } catch { return {}; } })() : (d && typeof d === 'object' ? d : {}));
const num = v => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));

// Angles: the gauge spans 240 degrees, from -210 (bottom-left) to 30 (bottom-right).
const A0 = -210, A1 = 30;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
function arc(cx, cy, r, a, b) {
  const [x0, y0] = pt(cx, cy, r, a), [x1, y1] = pt(cx, cy, r, b);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}
const tone = (v, t) => (v === null ? '#8a8f98' : v >= t + 5 ? '#2f9e6b' : v >= t ? '#c9a227' : v >= t - 5 ? '#e08a2e' : '#d0454c');

let current = {};
function render(props) {
  current = props || {};
  const d = parse(current.data);
  const root = document.getElementById('ua-custom-block');
  if (!root) return;
  const min = num(d.min) ?? 0, max = num(d.max) ?? 100, value = num(d.value), target = num(d.target) ?? 80;
  const prev = num(d.previous), unit = d.unit ?? '%';
  const f = v => Math.max(0, Math.min(1, ((v ?? min) - min) / (max - min || 1)));
  const aVal = A0 + (A1 - A0) * f(value), aTgt = A0 + (A1 - A0) * f(target);
  const [tx0, ty0] = pt(100, 100, 62, aTgt), [tx1, ty1] = pt(100, 100, 90, aTgt);
  const delta = value !== null && prev !== null ? Math.round((value - prev) * 10) / 10 : null;
  const gap = value !== null ? Math.round((value - target) * 10) / 10 : null;
  const col = tone(value, target);
  root.innerHTML = `<div class="pg-root ${d.theme === 'dark' ? 'dark' : ''}" role="button" tabindex="0" aria-label="${esc(d.label)} ${esc(value)}${esc(unit)}">
    <svg viewBox="0 0 200 170" class="pg-svg">
      <path d="${arc(100, 100, 76, A0, A1)}" class="pg-track"/>
      ${value !== null ? `<path d="${arc(100, 100, 76, A0, aVal)}" class="pg-val" style="stroke:${col}"/>` : ''}
      <line x1="${tx0}" y1="${ty0}" x2="${tx1}" y2="${ty1}" class="pg-target"/>
      <text x="100" y="98" class="pg-num">${value === null ? '–' : esc(value)}<tspan class="pg-unit">${esc(unit)}</tspan></text>
      <text x="100" y="120" class="pg-sub">target ${esc(target)}${esc(unit)}</text>
      <text x="${pt(100, 100, 92, A0)[0]}" y="162" class="pg-scale">${esc(min)}</text>
      <text x="${pt(100, 100, 92, A1)[0]}" y="162" class="pg-scale">${esc(max)}</text>
    </svg>
    <div class="pg-label">${esc(d.label || '')}</div>
    <div class="pg-foot">${gap === null ? '' : `<span class="pg-chip" style="background:${col}22;color:${col}">${gap >= 0 ? '+' : ''}${gap} vs target</span>`}
      ${delta === null ? '' : `<span class="pg-delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} vs last</span>`}</div>
    ${d.caption ? `<div class="pg-cap">${esc(d.caption)}</div>` : ''}
  </div>`;
  const el = root.querySelector('.pg-root');
  const fire = () => current.emitOnChange?.({ label: d.label || '', value, target, gap }, { label: d.label || '' });
  el.addEventListener('click', fire);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
}

window.renderComponent = render;
export default render;
