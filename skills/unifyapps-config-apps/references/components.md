# Components cookbook

How to use the building blocks, with the `ua_cfg.js` helper for each. Real JSON for ~130 component
types is in `component-catalogue.md`. ✅ = rendered and exercised in CGB Pulse (the sample in `examples/cgb-pulse/`; preview, 2026-09-23).

## The palette the builder offers (orbit.uat, 2026-09-23)

287 components: **100 built-in**, 143 template components (tenant-shared, `TemplateComponent`
blocks) and 44 custom components. Built-in, by builder category:

- **Layout** Grid (`Container`), Stack, Slot
- **Basic** Audio Player, Audio Recorder, Barcode, Lottie Animation, Divider, Filters, Icon, Image,
  Image Grid, Link, Loader, Media, Message Input, Progress, Tag, Timer, Text (`Typography`), Video, Iframe
- **Button** Button, Button Group, Icon Button
- **Rich** Alert, Artifact Preview, Avatar, Avatar Group, Business Hours, Calendar, Date Picker,
  Camera, Card, Chart, Chat, Code Editor, Comments, Contextual Dialog, Drawer, Routine Runs, Kanban,
  Key Value, Modal, Multi Stats Card, Nested Table, Org Chart, Timeline, PDF, Stat Card, Stepped
  Container, Sheet Preview, Data Table (`Table`), Group Table, Tabs, Audit, Traces, Scanner, JSON
  Schema Editor, QR Code, Module, Dictation, Signature, JSON Explorer, Stepper
- **Form** Checkbox, Cascader, File Upload, Form, Connection form modal, Phone Number, Password, Pin
  Input, Text Input, Toggle, Radio Button, Rich Text, Single Select, Slider, Text Area, Rating
- **Repeatables** Carousel, Marquee, Menu, Repeatable, Repeatable List, Repeatable Grid, Tree View
- **Navigation** Navigation, Navigation Container · **Commerce** Category Filter
- **Copilot** Copilot, Copilot Voice, Voice Mode Transcripts, Copilot Video, Copilot Input, Meeting,
  Copilot Response, Copilot Thread, Copilot History

Usage in real apps (blocks): Stack 108k · Typography 80k · Button 9.7k · Card 9.4k · Icon 9k ·
IconButton 3.6k · Image 3.2k · Tag 3.1k · SingleSelect 2.6k · Repeatable 2.6k · TextInput 2.5k ·
Form 1.6k · Modal 1.2k · Table 1.1k · Module 1.1k · Chart 865 · Drawer 806 · StatCard 541 · Copilot 117.

## Style tokens

`appearance.styles` takes the platform's Tailwind-like tokens, or `{custom:'<css>'}`:

| Key | Values seen |
|---|---|
| `width` / `height` | `w-full`, `w-auto`, `h-full`, `h-auto`, `h-fit`, `{custom:'42%'}`, `{custom:'460px'}` |
| `gap` | `{all:'gap-xs|sm|md|lg|xl|2xl|3xl'}` |
| `padding` / `margin` | `{all:'p-lg'}`, `{custom:{l:'16px', r:'16px'}}`, `{t:'pt-lg'}` |
| `backgroundColor` | `bg-primary`, `bg-secondary`, `bg-workspace`, `bg-transparent`, `bg-inherit` |
| `borderRadius` / `borderWidth` / `borderColor` | `{all:'rounded-xl'}`, `{all:'border'}`, `border-secondary` |
| `layout` | `flex-shrink-0`, `flex-grow` |
| text colours (Typography `color`) | `text-primary|secondary|tertiary|quaternary`, `text-brand-primary`, `text-white` |
| Typography `variant` | `text-xs|sm|md|lg|xl`, `display-xs|sm|md|lg` · `weight` `regular|medium|semi-bold|bold` |

Anything tokens can't express goes in `additional.customCSS`, scoped by `[data-block-id='b_x']`
(`css:` in the helpers, where `&` becomes that selector) ✅ — gradients, glass effects, fonts
(`font-family: Spectral, Georgia, serif`), letter-spacing.

**Theme per subtree:** `appearance.theme: 'dark' | 'light' | 'inherit'` on a Stack switches every
descendant to that scheme's tokens ✅ — how the dark hero and the dark page bands are built while the
app stays light.

## Layout

- `cfg.stack({gap, p, dir, align, justify, theme, css, styles}, children)` — column by default ✅.
- `cfg.row(o, children)` — `dir:'row', align:'center'` ✅. Widths in a row: give children
  `styles:{width:{custom:'42%'}}` ✅. `justify:'space-between'` for header rows ✅.
- `Container` (Grid) uses `appearance.variant:'1_1_1'`-style column splits 👁.
- Page root: `rootStyles` (e.g. `{gap:{all:'gap-xl'}}`) and `rootCss`.

## Display

| Helper | Component | Notes |
|---|---|---|
| `cfg.text(v, {variant, weight, color, css})` / `cfg.md()` | Typography | `content.type:'PLAIN_TEXT'|'MARKDOWN'` ✅ |
| `cfg.stat(label, value, {kind, dp, description, css})` | StatCard | `type:'NUMBER'|'PERCENT'|'CURRENCY'|'STRING'`, `decimalPlaces`; shows `-` while the value is undefined ✅ |
| `cfg.tag(label, {color, dot, variant})` | Tag | `color` string, or conditional (below) ✅ |
| `cfg.chart(data, {type, x, series, height, yDomain, stacked})` | Chart | the v1 helper (LINE, BAR). **Prefer `cfg.chartX`** — every chart type, next section ✅ |
| `cfg.progress(v, {circle})` | ProgressBar | ✅ (per-row in a Repeatable) |
| `cfg.kv(fields)` | KeyValue | ✅ (heatmap cell detail, document metadata) |
| `cfg.alert(md, {variant})` | Alert | ✅ (one per document risk, `variant:'warning'`) |
| `cfg.rating(value, {max, color, editable})` | Rating | read-only stars ✅ |
| `cfg.avatarGroup(data, field, {max})` / `cfg.avatar(text)` | AvatarGroup / Avatar | initials from a row field (`type:'DYNAMIC'`, `mappedAvatars`) ✅ |
| `cfg.stepper(steps, {current, vertical})` | Stepper | see *Stepper* below ✅ |
| `cfg.link(label, url)` / `cfg.timer({mode, format})` | Link / Timer | 👁 shapes from real apps |
| `cfg.pdf(src, {height})` | PDFViewer | `content.data {type:'URL', src}`; the session-authenticated `/api/file/download/…` URL works ✅ |
| `cfg.image(src)` / `cfg.icon(name)` / `cfg.iframe(src)` | Image / Icon / Iframe | 👁 |
| `cfg.loader()` | Loader | pair with `visible: C.eq("{{ e_x['isLoading'] }}", 'true')` ✅ |
| `cfg.accordion(title, body, {open})` | Card, collapsible | `content.collapsible {enabled, isInitiallyExpanded}` ✅ |

Chart data is an array of row objects (`[{period:'2026-08', satisfaction:78.8, target:80}]`) — shape
it in the data source's transformer. Chart shows "No Data Available for Plotting" when the array is
empty or the binding path is wrong ✅.

## Charts — every `chartType` ✅

`cfg.chartX(data, {type, x, series:[{key, label, color}], height, legend, yDomain, yDp, labels})`.
Eleven of the twelve render with live data in CGB Pulse (`examples/cgb-pulse/`; orbit.uat, 2026-09-23): ten on *Performance
Studio*, BAR on Entities/Voices/Control. Full `PIE` is the DONUT block with `sliceWidth:'lg'` 👁.

| `type` | Stored as | Data / options |
|---|---|---|
| `LINE`, `AREA` | `LINE` (+ `fillUnderLine:'gradient'`) | rows; `series` = y keys |
| `COLUMN` (vertical), `BAR` (horizontal) | same | rows; `colourByX:true` + `colors:{label:colour}` colours each bar |
| `STACKED_COLUMN` | `COLUMN` + `appearance.stacked:true` | one series per stack segment |
| `PIE`, `DONUT` | `PIE` + `sliceWidth:'lg'|'sm'` | `x` = slice label, `value:{key}`; colours `colourBy:'X_AXIS_VALUES'` keyed by label |
| `DUAL_AXES` | `yAxis.visualisation:'COLUMN'` + `yAxisRight {series, visualisation:'LINE'}` | `series` left, `rightSeries` right |
| `RADAR` | `RADAR` | `x` = spoke; one series per polygon; `yDomain` fixes the scale |
| `WATERFALL` | `WATERFALL` + `series[].barType` | ⚠️ every bar is **relative** (each starts where the last ended) — plot deltas (e.g. points vs target per entity), not a running total |
| `BUBBLE` | `BUBBLE` + `yAxis.series[].bubbleSize` | `x` numeric (scale `linear`), `y:{key}`, `size:{key}` |
| `HEATMAP` | `chartLayout:'TABULAR'`, `rows{dataFormat:'NESTED', category, data, value}`, `columns{category}` | ⚠️ **NESTED data is grouped by column**: `[{month:'26-08', data:[{entity:'Labour', value:64}]}]` with `col:'month', row:'entity', cells:'data'`. Grouped by row, the grid collapsed into one tile. Colours `heatmapColors {colorBy:'CONTINUOUS', colors:{start, end}}` |

The platform's own heatmap default (`TABULAR_HEATMAP_DEFAULT_NESTED_DATA` in the bundle) is the
reference: outer `industry` → `columns.category`, nested `country` → `rows.category`.

## Collections

- **Table** — `cfg.table(data, [{key, label, type:'TEXT'|'NUMBER'|'TAG', width, grow, colors}], {id,
  select:'SINGLE', events:{onRowSelect: …}})`. The selected row: `{{ b_tbl['context']['currentRow']['field'] }}` ✅.
  Tag columns: `addOns.colorMapping {HIGH:'error'}` ✅. Row actions: `content.rowActions` 👁.
- **Repeatable** — `cfg.repeat('b_rep', data, itemTree, {grid:2, gap})`. Inside the item, **and inside
  its events**, `{{ b_rep['context']['item']['field'] }}` is that row ✅. Give it an explicit id.
- **Tabs** — `cfg.tabs([{id, label, body}], {id})` → `content.items[{id, value, label, blockId, visibility}]`,
  `tabType:'manual'`, `defaultValue` ✅. Active tab: `{{ b_tabs['activeTab']['value'] }}`; event `onChange`.
  ⚠️ Each manual panel is wrapped in the runtime's `DeferredRender`, which waits for the page to be
  **visible**: in a hidden or background tab (`document.visibilityState === 'hidden'`) the tab bar draws
  and every panel stays empty. Not a config error — check in a visible tab before debugging the JSON.
  Mapped tabs (`tabType:'mapped'`, `mappedTab {data, value, label}`) render one `slots.views` template 📦.
- **Kanban** — `cfg.kanban('b_kb', data, cardTree, {category, items, itemId})`: data
  `[{category:'OPEN', items:[…]}]`, `content {mode:'mapped', category.mapping, itemsConfig{mapping, id}}`,
  the card template in `content.blockId` ✅. In the card: `{{ b_kb['context']['item']['title'] }}` ✅;
  column scope `['context']['column']['category'|'itemCount']` (for a `columnHeader` slot) 📦.
- **Timeline** — `cfg.timeline('b_tl', data, itemTree, {time, title, groupByDay})` ✅. It needs
  `type:'custom'` **and** a `slots.timelineItem` template; ⛔ `type:'mapped'` without the slot
  renders at 0 px. Item scope `{{ b_tl['context']['item'] }}`.
- **Calendar** — `cfg.calendar('b_cal', {readOnly})`; the picked date is `{{ b_cal['selectedDate'] }}` ✅.
- **Filters** — the Filters block binds to data sources for no-code filter/sort 👁.

### Template slots (`slotTrees`) ✅

Components that draw one template per row keep it in either `content.blockId` (Repeatable, Kanban,
Carousel, OrganizationChart, TreeView — `item:` in a `ua_cfg` node) or a named slot (Timeline's
`timelineItem`, Copilot's `messageInputPanel` — `slotTrees:{name: tree}`). `flatten` writes the slot as
`component.slots[name] = {blockId, wrappedInLayout:true}` and parents the template to the block.

### Stepper ✅

`content {type:'STATIC', defaultStepValue, steps:[{id, value, label, description, level:0,
subTreeDepth:0, path:'[i]', subSteps:[]}]}` + `appearance.stepDetails {label, description, clickable}`.
⛔ Steps without `level/subTreeDepth/path/subSteps` rendered nothing at all.

## Input

- **SingleSelect** — `cfg.select(['A', {value:'', label:'All'}], {id, events:{onChange:
  A.setVar(V.x, "{{ b_sel['value'] }}")}})` ✅. Dynamic options from a data source: `optionsType:'DYNAMIC'` 👁.
- **TextInput / TextArea** — `{{ b_in['value'] }}` in `onChange` ✅ (TextInput).
- **Form** — `cfg.form('b_form', [{key, title, type:'string'|'number'|'select'|'textarea', options,
  default, required, width}])` → `content.schema {schema (JSON Schema), layout ('ui:order', 'ua:fieldType', 'ui:widget')}`.
  Read values with `{{ b_form['data']['key'] }}` ✅; defaults from `schema.properties.x.default` ✅.
  Submit either with a button whose action runs the create data source (✅ — the sample does this), or
  with `submitForm` / `controlBlockMethod(form,'submitForm')` + the Form's `onSubmit` event 👁.
- **FileUpload** — `cfg.fileUpload('b_up', {label, types:['.pdf','image/*'], maxMb, multiple})` ✅.
  State: `{{ b_up['files'] }}`, `['isUploading']`. A file is `{id, name, source, sourceType:'CLOUD_STORAGE',
  url, mimeType, fileType, size, isUploaded, progress, meta}` — ⚠️ **the storage key is `source`**
  (`user-uploads/<tenant>/<ts>/<name>`); there is no `key`. `url` (`/api/file/download/…`) works in the
  session (PDFViewer, links). Upload runs through `/api/uploads/s3/multipart/<token>` as soon as a file
  is dropped. Hand `source` to a workflow — the whole pipeline is in `documents.md`.
- **ButtonGroup** — `cfg.buttonGroup('b_bg', [{id, label, icon}])` (segmented toggle). Value
  `{{ b_bg['selectedOptionId'] }}` / `['selectedOption']['label']`; event **`onClick`** ✅.
- **Toggle / Checkbox / RadioButton** — `cfg.toggle|checkbox|radio(id, label, {default})`; value
  `{{ b_x['value'] }}`; events Toggle `onChange`, **Checkbox `onCheckChange`** ✅ (Radio 👁).

### Block state keys and events (verified) ✅

| Component | Read with | Event that fires |
|---|---|---|
| SingleSelect, TextInput | `['value']` | `onChange` |
| ButtonGroup | `['selectedOptionId']`, `['selectedOption']['label']` | `onClick` |
| Toggle / Checkbox | `['value']` | `onChange` / `onCheckChange` |
| Tabs | `['activeTab']['value']` | `onChange` |
| Calendar | `['selectedDate']` | `onChange` 👁 |
| Table | `['context']['currentRow'][…]` | `onRowSelect` |
| Repeatable / Kanban / Timeline | `['context']['item'][…]` (inside the template) | template blocks' own events |
| Form | `['data'][key]` | `onSubmit` 👁 |
| FileUpload | `['files']`, `['isUploading']` | `onChange` 👁 |
| Copilot | `['isGeneratingResponse']`, `['chatId']` | `onMessageSent` 👁 |
| Custom component | the keys of `emitOnChange(ctx)` as bare names: `{{ code }}` | `onChange` |

## Overlays ✅

- **Modal** — `cfg.modal('b_m', bodyTree, {width})` in the page's `overlays`; open/close with
  `A.modal('b_m','show'|'hide')`. **Leave the block visible** (in a 7-app sample 250 of 309 modals carry no
  visibility at all). `visible:false` removed the block and `show` silently did nothing.
- **Drawer** — `cfg.drawer('b_d', bodyTree, {width, position})`, `A.drawer('b_d','show')`.
  **`content.variant:'card'`** for inline content (60 of 94 real drawers in a 7-app sample); `'page'` renders another
  page given `content.pageId` and showed an **empty** panel with a body slot.
- ContextualDialog / BottomSheet follow the same slot pattern 👁.

## Conditional visibility and colours ✅

```js
visible: C.eq("{{ !!var_region['value'] }}", 'true')          // boolean tests compare to the STRING 'true'
visible: C.eq("{{ e_x['isLoading'] }}", 'true')
appearance.color = { defaultValue: 'brand', conditionalValueFilters: [
  { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq("{{ b_rep['context']['item']['severity'] }}", 'critical')) } } ] }
```

Operators seen: `EQUAL NOT_EQUAL GT GTE LT LTE IN CONTAINS EXISTS MISSING`. ⚠️ `EXISTS` is **true for
an empty string** — the region panel showed "Satisfaction undefined%" with `var_region = ''`. Use
`!!value` compared to `'true'`/`'false'`.

## Agent chat — Copilot + CopilotInput ✅

```js
cfg.copilot(AGENT_ID, { id: 'b_dock', height: '78vh', welcome: 'Ask me…',
  context: "{{ 'The user is on the command centre; selected: ' + var_region['value'] }}" })
```

- `content`: `variant:'AI_AGENT'`, `aiAgentId`, `welcomeText`, `runtimeContext` (sent with every
  message — put the screen's state in it), `shouldPollInfinitely`, `maxPollDuration`, `addOns.responseActions`.
- The **input is a separate `CopilotInput` block** in `slots.messageInputPanel` (the helper adds it).
  Without it: header, no input box ⛔ → ✅.
- CopilotInput's send action: `events:[{eventType:'onClick', targetId:'messageInputAct_send', action:
  controlBlockMethod(copilotId, 'submitMessage', {message:"{{ b_in['value'] }}"})}]`.
- **Ask on the user's behalf from anywhere:** `A.method('b_dock','submitMessage',{message:'…'})` ✅.
  Chat-with-the-data pattern in the sample: a Drawer holding the Copilot +
  `A.then(A.drawer('b_askDrawer','show'), A.delay(A.method('b_dock','submitMessage',{message}), 1500))`
  on every insight card and on the map's region panel ✅. The analyst page auto-asks
  `pageInputs['question']` on load the same way ✅.
- **File attachments in the chat** — `cfg.copilot(AGENT, {…, attachments:true})` adds a paperclip
  (`CopilotInput` action `{action:'addAttachments'}`) and sends `attachments: {{ b_in['attachments'] }}`
  with `submitMessage`. The agent reads an attached PDF directly — no workflow needed ✅.
- Other block states read by expressions: `b_cp['isGeneratingResponse']`, `['chatId']`, `['isEmpty']`,
  `['aiAgent']['conversationPlaceholder']` 👁. Events: `onCitationClick`, `onInsertMessage`, `onMessageSent` 👁.

## Custom component block ✅

```js
cfg.custom('PulseMap', 'e_6ab37d11…', "{{ { ...(e_reg['data']?.['map'] || {}), selected: var_region['value'] || '' } }}",
  { id: 'b_pulseMap', height: '460px', events: { onChange: A.setVar(V.region, '{{ code }}') } })
```

`componentType` = the manifest `type`; `content {type:'CUSTOM_BLOCK_TYPE', entityId, version:'-1',
data}`; the page lists it in `customBlocksVersionsMap` (the helper does). Size it with CSS on the block
and its iframe. Full contract: `custom-components.md`. Three ship in `assets/custom-components/`:
PulseMap (SVG map), PulseGauge (radial KPI gauge) and PulseHeatmap (clickable grid) ✅.

## Where each component is used in CGB Pulse (`examples/cgb-pulse/`)

| Page | Prebuilt | Custom |
|---|---|---|
| Command Centre | Stack (dark hero), StatCard, Button, Chart LINE, Repeatable, Table, Tag, Card, Divider, Loader, Drawer, Copilot + CopilotInput, IconButton | PulseMap |
| Entities | Table, SingleSelect, Tag, Chart BAR | — |
| Entity | StatCard, Table, Chart AREA, Repeatable, Modal, Form, Tag, Button | — |
| Performance Studio | ButtonGroup, Tabs, Chart ×9 (COLUMN, STACKED_COLUMN, DONUT, DUAL_AXES, RADAR, WATERFALL, BUBBLE, AREA, HEATMAP), SingleSelect, KeyValue, Checkbox, Rating, ProgressBar, Repeatable, Stepper, AvatarGroup, Toggle, Kanban, Timeline, Calendar, Link, collapsible Card, Drawer + Copilot | PulseGauge ×4, PulseHeatmap |
| Documents | FileUpload, Form, Button, Table ×2, Tabs, KeyValue, Alert, Repeatable ×3, PDFViewer, Icon, Loader, Tag, Drawer + Copilot (attachments) | — |
| Citizen Voices | StatCard, SingleSelect, TextInput, Chart BAR, Repeatable, Tag | — |
| Control Room | StatCard, Tag, Chart BAR, Repeatable, Loader, Button | — |
| Analyst | Card, Button, Copilot + CopilotInput | — |

## Icons

Untitled-UI names. Seen working: `Home02 Home05 Cube02 Stars02 Zap List Settings01 Settings04
MessageSmileSquare MessageTextSquare02 Calendar Clock User01 Plus AlertTriangle BarChart10 Dataflow02
BriefCase02 XCircle RefreshCcw01 SvgSearchMd SvgUsers01 SvgFile02`. An unknown name renders nothing,
with no error ✅ (three nav items were invisible until renamed).

## Verified 2026-09-25 — a PoC-tracking command-centre build (API-SPEC §51)

- **Accessible names:** an IconButton's default name is its **icon name** (`"MessageSmileSquare"`), not
  `content.label`. `additional.htmlAttributes:[{key:'aria-label',value:…}]` fixes it ✅; the same key adds
  `role="heading"` + `aria-level` to a Typography block ✅ (`ua_cfg.js` `iconButton`/`text` take
  `label`/`htmlAttributes`). IconButton `sm` = 28 px, Button `md` = 32 px tall — `min-width/min-height: 44px`
  in customCSS gives the hit target.
- **Table row actions ✅:** `content.rowActions:[{id,label,visibility:'VISIBLE',buttonType:'button'|'icon-button',
  appearance}]` + `events:[{eventType:'onClick', targetId:'<rowActionId>', action}]`; the row is
  `{{ b_tbl['context']['currentRow'][…] }}` (navigate with page inputs, or setVar + open a drawer).
  `addOns.page {type:'PAGINATION', size:25}` paginates; `columnAddOns.tooltip {type:'overflow'}` accepted.
- **Re-initialising from a variable ✅:** Form `content.initialFormData` as an expression over `var_ms`
  refills the fields when the variable changes; ButtonGroup `initialSelectedItemId` as an expression selects it.
- **`controlBlockMethod setValue`:** clears a TextArea (`{value:''}`) ✅; **no effect on CopilotInput** ⛔ —
  prefill a copilot question with a chip whose click submits the literal text.
- **Drawer is always modal (OQ-U5):** `backdrop.showBackdrop:false` still leaves the backdrop element in
  front of the page; while a fixed Drawer is open the page behind is hidden. Body = `role="dialog"`.
  `backdropStyles.backgroundColor` accepts raw `rgba()`.
- **Copilot:** renders the agent's `description` and `conversationStarters` itself (a starter click sends
  it); chat id goes to the URL as `?<blockId>-chatId=…`; the only per-answer hook is `onCitationClick`
  (`{{ b_cp['events']['onCitationClick']['referenceUrl'] }}`).
- **Icons:** `XClose` is not in the set (console `Icon not found for XClose`) — use `XCircle`. `Copy01`,
  `ArrowLeft`, `RefreshCcw01`, `Stars02`, `AlertTriangle` render.
- **Dates:** the storage layer stores `yyyy-MM-dd` as UTC midnight; prefill date inputs with
  `toLocaleDateString('en-CA')` (local date), never `toISOString().slice(0,10)`.
- **Deep links:** `setURLParameters` with `history:'replace'` + `mergeWithExistingQueryParams:true`, read
  back via `pageInputs` in `onPageLoad`, gives shareable filters (`?q=…`, `?tab=notes`). Tab labels accept expressions.
- **QA round (API-SPEC §51.11):** `aria-label` expressions in `htmlAttributes` are not evaluated inside a Repeatable (use static
  text); row actions need `buttonType:'button'` + `label` to be named (icon-button = unnamed + duplicated id); `role="paragraph"` via
  `htmlAttributes` takes display-variant Typography out of the heading outline; Drawer `hideOnEscape` has no effect and its inner
  dialog name cannot be set; `htmlAttributes` on TextArea/Drawer land on the wrapper; Tables accept `overflow-x:auto` in customCSS.
