# Custom components

A custom component is your own UI (any framework, or none) that a config page embeds like a built-in
block. Verified 2026-09-23 on orbit.uat by uploading `assets/custom-components/pulse-map` as
*CGB Pulse Map* (`e_6ab37d11223be332a6b5e2ad`, type `PulseMap`; the map of the sample in `examples/cgb-pulse/`) and driving a page variable from it ✅.
UAT had 56 of them (maps, Gantt charts, leaderboards, stackers, PDF annotators).

## Runtime contract ✅ (from the platform bundle, confirmed by the example)

The host renders a **srcdoc iframe** per block:

```html
<body class="ua-variables" data-color-scheme="light|dark">
  <div id="ua-custom-block"></div>
  <script src="<manifest.main>"></script>   <link rel="stylesheet" href="<manifest.style>">
  <!-- posts {type: APP_READY, id} to the parent on DOMContentLoaded; with sizing 'auto' a
       ResizeObserver on body + #ua-custom-block posts {type: RESIZE, height} -->
</body>
```

On `APP_READY`, and again whenever the block's data changes, the host calls
**`window.renderComponent(props)`** with:

| prop | meaning |
|---|---|
| `data` | the block's `content.data` **evaluated** (`{{ }}` resolved — an object if the expression returns one) |
| `uncomputedData` | the raw `content.data` string |
| `emitOnChange(ctx, payload)` | fires the block's **onChange** event; `ctx`'s keys become expression scope in the handler (`{{ code }}`) ✅ |
| `emitOnClick(domEvent, ctx)` | fires **onClick** |
| `state` / `updateState(obj)` | per-block state, readable elsewhere as `{{ b_x['state'] }}` |
| `updateData(v)` | rewrite `content.data` |
| `mode` | `BUILDER` / `PREVIEW` / … |
| `permissions`, `getGlobalStoreContext()`, `getNoCodeComputedData()`, `getComputedFilters()`, `blockStateId` | advanced |

So the smallest valid component is:

```js
window.renderComponent = (props) => {
  const root = document.getElementById('ua-custom-block');
  const d = typeof props.data === 'string' ? JSON.parse(props.data || '{}') : (props.data || {});
  root.innerHTML = `<button>${d.label ?? 'Click'}</button>`;
  root.querySelector('button').onclick = () => props.emitOnChange?.({ clicked: true, label: d.label });
};
```

React components (most on UAT) bundle React into the ES module (~640 KB) and do
`createRoot(document.getElementById('ua-custom-block'))` then
`window.renderComponent = p => root.render(<C {...p}/>)`. A dependency-free component is ~7 KB.

Give the root an explicit height (the iframe follows `document.body`), and size the block from the page:
`[data-block-id='b_x'] { height: 460px } [data-block-id='b_x'] iframe { height: 100% !important }`.
The iframe is same-origin (srcdoc), so tests can reach it with `iframe.contentDocument` ✅.

## Package ✅

A ZIP with the files at its root:

```
out.json          ← the manifest. It MUST be called out.json (manifest.json failed every file check)
pulse-map.es.js
pulse-map.css
```

```json
{ "name": "Pulse Map", "type": "PulseMap", "main": "pulse-map.es.js", "style": "pulse-map.css",
  "icon": "https://assets.unifyapps.com/user-uploads/theme/unify.svg",
  "keywords": "map qatar municipality region bubble satisfaction pulse" }
```

`type` becomes the block's `componentType` — make it unique and PascalCase.

## Upload (Production mode) ✅

UI: `/p/0/interfaces/custom-components` → **Add Component** → name, **Production**, upload the ZIP,
tag (`v1`), release notes → **Add**. The dialog first runs file checks (manifest detected, component
type defined, UI code included, icon available) and only enables Add when all pass.

Behind it (captured):

1. Multipart upload to S3 via the Uppy companion API: `GET /api/uploads/s3/multipart/<token>` (signed
   URL) → `PUT` to `s3…/uat-uploads.unifyapps.com/user-uploads/<tenant>/<ts>/pulse-map.zip` →
   `POST /api/uploads/s3/multipart/<token>` `{parts:[{ETag, PartNumber}]}` → `{location, key, bucket}`.
2. `POST /api/workflow/execute/node?name=CustomComponentFileChecks` — unzips to
   `https://uat-uploads.unifyapps.com/<tenant>/workflow_uploads/<uuid>/` and returns
   `{allChecksPassed, manifestUrl, manifest:{name, type, main, style, icon, keywords}}` with absolute URLs.
3. `POST /api/entity {entityType:'e_custom_component', properties:{name, manifest}}`.
4. `POST /api/entity/e_custom_component/<id>/deploy {deploymentNotes, deploymentTag}` →
   `deploymentState.version`.

Automating it ✅ (all three sample components were uploaded this way, unattended):

1. **Open `/p/0/interfaces/custom-components/create` by URL.** Clicking *Add Component* navigates and
   kills a running script.
2. In a separate call: set the React-controlled inputs with the native setter + an `input` event
   (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el, v);
   el.dispatchEvent(new Event('input',{bubbles:true}))`); click the **Production** radio (index 1).
3. Attach the ZIP to `<input type=file accept=".zip">` with a `DataTransfer` built from bytes
   (`scripts/pack_component.py` prints the base64 + snippet); fill tag and release notes.
4. Click **Add** → file checks run (four green ticks). Click **Add** again → the component is created,
   deployed, and the page navigates (the script ends there). Confirm with
   `POST /api/entity/e_custom_component` (filter by name) → `deploymentState.version: 1`.

(The file-check input payload was not captured; the dialog is the supported path.)

A new version = upload a new ZIP from the component's page; blocks use `content.version:'-1'` (latest
deployed) unless pinned.

## Development mode 👁

**Development** takes a **Manifest URL** instead of a ZIP — typically `http://localhost:5001/out.json`
served by your dev server — so the builder loads your live code. Entities created this way carry
`manifestUrl` and `main/style` pointing at localhost; they only work on the developer's machine.

## Using it on a page ✅

```js
cfg.custom('PulseMap', 'e_6ab37d11223be332a6b5e2ad',
  "{{ { ...(e_reg['data']?.['map'] || {}), selected: var_region['value'] || '' } }}",
  { id: 'b_pulseMap', height: '460px', events: { onChange: A.setVar('var_region', '{{ code }}') } })
```

Block: `{componentType:'PulseMap', content:{type:'CUSTOM_BLOCK_TYPE', entityId, version:'-1', data}}`
and the page gets `customBlocksVersionsMap: {b_pulseMap: {entityId, version:-1}}` (`cfg.page` adds it).
Only **deployed** components appear in the builder's Custom tab (`/api/entity/deployed/e_custom_component/search`).

## The three in `assets/custom-components/` ✅

Dependency-free (plain DOM/SVG, no React, no bundler), each ≤ 7 KB of code + CSS:

| Folder | `type` | `data` in | `emitOnChange(ctx)` out | Used for |
|---|---|---|---|---|
| `pulse-map` (v2) | PulseMap | `{title, regions:[{code,name,value,risk,note}], target, unit, selected}` — `code` ∈ DOHA RAYYAN WAKRAH DAAYEN UMMSALAL KHOR SHAMAL SHAHANIYA | `{code, name, value}` | choropleth of Qatar's real municipalities → region panel |
| `pulse-gauge` | PulseGauge | `{label, value, target, min, max, unit, previous, caption, theme}` | `{label, value, target, gap}` | KPI dial; click asks the agent about it |
| `pulse-heatmap` | PulseHeatmap | `{title, rows:[{key,label}], cols, cells:{row:{col:v}}, target, unit, selected}` | `{row, rowLabel, col, value}` (row label click: `col:''`) | entity × month grid → detail card |

**Real geography, baked in ✅** — PulseMap v2 draws the eight municipalities from geoBoundaries
(gbOpen QAT ADM1, CC BY 4.0; credited in the component). `pulse-map/build_geo.py` downloads the
GeoJSON (from `media.githubusercontent.com` — the raw URL is a Git-LFS pointer), projects it
(equirectangular, x × cos 25.3°), simplifies it (Douglas–Peucker split at the farthest point, because a
closed ring has no baseline and collapses to two points otherwise), maps geoBoundaries' spellings to
record codes (`Al Sheehaniya` → SHAHANIYA, `Umm Slal` → UMMSALAL, `Al Wakra` → WAKRAH) and writes
`const GEO` between markers in the `.es.js`: 1,084 points, 12 KB, no runtime fetch. Municipalities too
small for a label (Doha, Umm Salal, Al Daayen) get callouts in the sea with leader lines. v1 (a
hand-drawn outline with population bubbles at town coordinates) was replaced: five of eight towns sit
within ~0.3° of Doha, so the bubbles piled up and the outline did not read as Qatar.

**New version of an existing component ✅** — the component's side panel
(`/p/0/interfaces/custom-components/<id>/details`) → **New Version** opens the same dialog as Add
(Production radio, ZIP, `root.versionTag`, release notes; Add → checks → Add). `deploymentState.version`
goes to 2 and blocks on `version:'-1'` pick it up without republishing the app. Verify a pasted ZIP
by SHA-256 in the tab (`crypto.subtle.digest`) against the local file.

Patterns they prove:
- **Shape `data` in the data source transformer** (`heat: {rows, cols, cells…}`), bind the block to
  `{{ { ...ds['data']['heat'], selected: var_cellRow['value'] } }}` — the component stays generic.
- **Event → variables → prebuilt blocks**: heatmap `onChange: [A.setVar(V.cellRow, '{{ row }}'),
  A.setVar(V.cellCol, '{{ col }}')]` drives a KeyValue and a LINE chart ✅.
- **Event → agent**: gauge `onChange: askDock("{{ 'Explain the ' + label + ' reading of ' + value + …}}")` —
  the ctx keys are still in scope inside the *delayed* `submitMessage` action ✅.
- Draw the selection from `data.selected` (not internal state) so the page stays the source of truth
  and a reload restores it.

## Choosing: prebuilt or custom?

Reach for prebuilt first — Chart covers 12 types including HEATMAP, and every prebuilt block binds,
themes and emits events for free. Build a custom component when the visual has no prebuilt
equivalent (a map, a dial, a bespoke matrix with per-cell events) or needs an interaction a Chart
does not give you (CGB Pulse, `examples/cgb-pulse/`, needed a per-cell `{row, col, value}` event, so PulseHeatmap exists; Chart
click events were not tried). The Trends tab shows both side by side.

## CSP

The iframe loads `main`/`style` from their hosts; a blocked host shows a "CSP blocked" card in the
builder with an **Allow** action (adds it to the app's CSP). Uploaded files live on
`uat-uploads.unifyapps.com`, which is allowed by default.
