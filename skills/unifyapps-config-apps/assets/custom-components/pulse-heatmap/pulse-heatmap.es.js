// Pulse Heatmap — an interactive row × column heat grid for UnifyApps config pages. No dependencies.
// data: { title?, rows: [{ key, label }], cols: [string], cells: { [rowKey]: { [col]: number } },
//         target=80, unit='%', selected?: { row, col } }
// Clicking a cell fires onChange with { row, rowLabel, col, value } — {{ row }}, {{ col }}, {{ value }}
// in the handler. Clicking a row label fires it with col = '' (the whole row).

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const parse = d => (typeof d === 'string' ? (() => { try { return JSON.parse(d); } catch { return {}; } })() : (d && typeof d === 'object' ? d : {}));

// Diverging scale around the target: red below, gold at target, green above.
function colour(v, target) {
  if (v === null || v === undefined || isNaN(v)) return '#f1ece4';
  const d = Math.max(-12, Math.min(12, v - target)) / 12;
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const red = [208, 69, 76], gold = [233, 205, 140], green = [47, 158, 107];
  const c = d < 0 ? mix(gold, red, -d) : mix(gold, green, d);
  return `rgb(${c.join(',')})`;
}

let current = {};
let sel = null;
function render(props) {
  current = props || {};
  const d = parse(current.data);
  const root = document.getElementById('ua-custom-block');
  if (!root) return;
  const rows = Array.isArray(d.rows) ? d.rows : [], cols = Array.isArray(d.cols) ? d.cols : [], cells = d.cells || {};
  const target = Number(d.target ?? 80), unit = d.unit ?? '%';
  if (d.selected !== undefined) sel = d.selected;
  if (!rows.length || !cols.length) { root.innerHTML = '<div class="hm-root hm-empty">Bind data.rows, data.cols and data.cells.</div>'; return; }
  const head = cols.map(c => `<th title="${esc(c)}">${esc(String(c).slice(2))}</th>`).join('');
  const body = rows.map(r => `<tr><th class="hm-row" data-row="${esc(r.key)}">${esc(r.label || r.key)}</th>${cols.map(c => {
    const v = cells[r.key]?.[c]; const on = sel && sel.row === r.key && sel.col === c;
    return `<td class="hm-cell${on ? ' on' : ''}" data-row="${esc(r.key)}" data-col="${esc(c)}" style="background:${colour(v, target)}" title="${esc(r.label)} · ${esc(c)} · ${v ?? '–'}${esc(unit)}">${v === undefined || v === null ? '' : Math.round(v)}</td>`;
  }).join('')}</tr>`).join('');
  root.innerHTML = `<div class="hm-root">${d.title ? `<div class="hm-title">${esc(d.title)}</div>` : ''}
    <div class="hm-wrap"><table class="hm"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <div class="hm-legend"><span style="background:${colour(target - 12, target)}"></span>≤${target - 12}<span style="background:${colour(target, target)}"></span>${target}${esc(unit)} target<span style="background:${colour(target + 12, target)}"></span>≥${target + 12}</div></div>`;
  const fire = (row, col) => {
    const r = rows.find(x => x.key === row) || {};
    sel = { row, col };
    current.emitOnChange?.({ row, rowLabel: r.label || row, col: col || '', value: col ? (cells[row]?.[col] ?? null) : null }, { row, col });
    current.updateState?.({ selected: sel });
    render(current);
  };
  root.querySelectorAll('.hm-cell').forEach(td => td.addEventListener('click', () => fire(td.dataset.row, td.dataset.col)));
  root.querySelectorAll('.hm-row').forEach(th => th.addEventListener('click', () => fire(th.dataset.row, '')));
}

window.renderComponent = render;
export default render;
