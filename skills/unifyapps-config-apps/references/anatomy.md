# Anatomy of a config app

Verified on orbit.uat 2026-09-23 by building the sample `cgb-pulse` (`examples/cgb-pulse/`) over REST, and cross-checked against 2,203
real pages (see the `*-catalogue.md` files). ✅ executed · 👁 observed in real apps · 📦 bundle only.

## The entities

| Entity | Id | Created by | Notes |
|---|---|---|---|
| `e_interface` | the app slug (`cgb-pulse`) | `POST /api/entity/create-update-or-delete/hierarchical` `requestType:"CREATED"` ✅ | `navigation.defaultPageId` is **required on create** — point it at `e_global_<appId>` until real pages exist ✅ |
| `e_component` PAGE | `e_<24 hex>` (server) or chosen (`e_global_<appId>`) | `POST /api/entity {entityType:'e_component', properties}` ✅ or hierarchical with `parentEntities:[{type:'e_interface', id}]` ✅ | update: hierarchical `UPDATED` with the full entity ✅ |
| global page | `e_global_<appId>`, name/slug `global-page-of-<appId>` | hierarchical `CREATED` with that id ✅ | holds app-wide data sources; not in navigation |
| `e_data_source` | `e_<24 hex>` | `POST /api/entity` ✅ | `interfacePageId` = the page (or the global page, then `target:'app'`) |
| `e_theme` | `e_<24 hex>` | `POST /api/entity` ✅ | referenced by `e_interface.properties.theme.defaultThemeId` |
| `e_custom_component` | `e_<24 hex>` | the Custom Components UI, or `POST /api/entity` + `…/deploy` ✅ | see `custom-components.md` |
| MODULE / TEMPLATE_COMPONENTS | `e_component` with that `componentType` | 👁 | reusable fragments; placed with a `Module` / `TemplateComponent` block |

Search needs filters: `POST /api/entity/e_component {filter:{op:'AND', values:[{field:'properties.interfaceId', op:'EQUAL', values:[appId]}]}}` ✅;
`POST /api/entity/e_data_source` **requires** a `properties.interfacePageId` filter (5011 otherwise) ✅.
Paging `POST /api/entity/e_interface {page:{limit, offset}}` — offset paging works; the returned
`cursor` repeated the same page ✅.

## The app (`e_interface.properties`)

```
type:'application', name, description, manifest:{type:'WEB', mode:'config'}, deviceDetails:{base:'desktop'},
locale:{defaultLocale:'en-US'}, theme:{defaultThemeId}, metadata:{logo:{small,large,favicon}, _counter:{…}},
navigation:{ primary:[{id:'nav_x', name, icon, type:'PAGE', pageId, slug}], secondary:[{type:'USER_MENU', name:'Profile', id:'userMenu'}],
             defaultPageId, appearance:{SM,MD,LG,XL: {navigationBar, navigationItem, styles, primary:[{id, hiddenInOverflow}]}} },
entityDetailsMap:{ <pageId>:{slug, isPublic, type:'PAGE', name} }, interfacePageIdVsSlugMap:{ <pageId>: slug },
paths:{ f_root:{id:'f_root', segment:'', path:'/', children:[pageIds]} },
security:{type:'PRIVATE', cspData, cspDetails}, customCode, integrations, mqttTopics, realtimeEvents, publicPageIds, pagePermissions
```

`cfg.registerPages()` writes `entityDetailsMap`, `interfacePageIdVsSlugMap`, `paths`, `navigation.primary`
and the per-breakpoint `appearance.*.primary` in one update ✅. A page left out of `navigation.primary`
(`nav:false`) is still routable — `entity?entity_code=LABOUR` in the sample ✅.

## A page (`e_component.properties`)

```
componentType:'PAGE', interfaceId, interfaceType:'application', name, slug, publicAccess, documentTitle,
layout:{header:'header_id', body:'root_id', footer:'footer_id'},
blocks:{ root_id, header_id, footer_id, … },          // flat map
pageVariables:{ var_x:{id, name, type:'string'|'number'|'boolean'|'object'|'array', initialValue?} },
pageFunctions:{ func_x:{id, name, functionBody, runBehaviour:'manual', dataSourceIds, dpOn} },
inputSchema:{type:'SCHEMA_AND_LAYOUT', dynamic:false, schema:{type:'object', properties:{x:{type,title}}}, layout:{'ui:order'}},
interactions:{ events:[{id, eventType:'onPageLoad', action}] },
events:[{eventType:'p_evt_x', label, payload:<JSON schema>}],   // page events (emitPageEvent)
inboundEvents:[{eventType, label}],                               // events a MODULE accepts from its host
customBlocksVersionsMap:{ <blockId>:{entityId, version:-1} },      // one per custom-component block
flags:{shouldUseBuiltDependencies:true}, metadata:{_version:2, _blockCounter:{…}}, dataSources:{} (always empty)
devices:{mobile:{diffs:{blocks:{…}}}}                              // per-device overrides (👁)
```

`root_id` is a column Stack (`additional.isRootBlock:true`) whose `content.blockIds` lists the body
blocks **and every Modal/Drawer** (overlays live in root) ✅; `header_id`/`footer_id` are row Stacks,
`visibility:false` when empty. Every container's `blockIds` ends with `"__PLACEHOLDER__"`.

## A block

```json
{ "id": "b_riskTbl", "displayName": "riskTbl", "parentId": "b_x9", "v": 0,
  "component": { "componentType": "Table", "content": {…}, "appearance": {…}, "slots": {…} },
  "visibility": { "value": true } | { "value": false } | { "value": "conditions", "conditions": {"type":"filter","payload":{"operator":"AND","filters":[…]}} },
  "events": [ {"id":"evt_…","eventType":"onRowSelect","action":{…}} ],
  "additional": { "customCSS": "[data-block-id='b_riskTbl'] { … }", "isCustomCSSValid": true },
  "dataSourceIds": ["e_…"], "dpOn": [{"id":"e_…","p":["e_…['data']['rows']"]}],
  "dP": [{"p":"content.data"}], "cP": [{"p":"visibility.conditions"}] }
```

- **Ids**: `b_` + anything readable (`b_riskTbl`, `b_cv_bar_chart` are accepted) ✅. Give an explicit
  id to every block an expression or action refers to.
- **Children**: containers (`Stack Container Pressable Scrollable`) → `content.blockIds`; slotted
  (`Card Modal Drawer ContextualDialog BottomSheet`) → `slots.body = {blockId, wrappedInLayout:true}`;
  `Repeatable` → `content.blockId` (the item template); `Tabs` → `content.items[].blockId`;
  `Copilot` → `slots.messageInputPanel / followUpPrompts / agentDetails`; `Form` → field slots.
- **Dependencies** — computed by `cfg.flatten` from every `{{ }}` in content, appearance and visibility:
  - `dP`: paths (relative to the block) that hold expressions — `content.value`,
    `appearance.color.conditionalValueFilters[0].conditions.payload.filters[0].property`.
  - `dpOn`: `[{id, p:[access paths]}]` per scope read (data source, `var_`, `b_`, `pageInputs`,
    `userContext`…), with `?.` removed and `["x"]` normalised to `['x']`.
  - `cP`: paths of condition objects (`visibility.conditions`, conditional colours).
  - `dataSourceIds`: data sources read.
  Events are **not** included (they evaluate when fired). Data sources and page functions carry
  `dP/dpOn` too (their `inputs` / `functionBody`).

## Variables, inputs, functions, page events

- `var_<name>` ids may be readable (`var_region`) ✅; set with `setPageVariable` (`operationDetails:
  {operation:'SET', value}`), read `{{ var_region['value'] }}`. Initial values are strings.
- Page inputs: declare in `inputSchema`; `navigateToPage {pageInputs:{k:v}}` → `?k=v` ✅; read
  `{{ pageInputs['k'] }}`. Deep links work (`/preview/entity?entity_code=LABOUR`) ✅.
- Page functions (`func_x.functionBody` is JavaScript with `{{ }}` inside, `return` a value): run with
  `triggerFunction`, read `{{ func_x['value'] }}` 👁.
- Page events: declare `events:[{eventType:'p_evt_x', label, payload}]`, fire `emitPageEvent` 👁.
- `executeScript` runs JS with expressions inlined; set a variable from a script with
  `{{ var_x['setValue'] }}(v)` 👁.

## Runtime endpoints the app itself calls ✅

| Call | When |
|---|---|
| `POST /api/workflow/execute/node?name=<dsName>&requestId=<id or req_*>` `{context, id, inputs, options}` | every data-source run in preview/published |
| `POST /api/workflow/execute/node/rungetschema?name=…` | builder canvas runs (also returns the schema) |
| `POST /api/workflow/execute/node?name=NoCodePageScore` | builder page-score widget |

The server compares every non-templated input with the stored data source ("forbidden datasource :
invalid input" if they differ) — you cannot change `automationId`, `object_type` etc. from a page.

## URLs

| What | URL |
|---|---|
| Builder | `/p/0/interfaces/<appId>/builder/<slug>` |
| Preview (live data, Orbit session) | `/p/0/interfaces/<appId>/preview/<slug>` ✅ |
| Published | `https://<appId>-orbit.matrix-uat.unifyapps.com/<slug>` (after domain mapping + publish) ✅ |
| Custom components | `/p/0/interfaces/custom-components` (+ `/create`) ✅ |
| Template components | `/p/0/interfaces/template-components` 📦 |
