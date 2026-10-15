# Theme, navigation, hosting and publishing

✅ = done over REST for the sample `cgb-pulse` (`examples/cgb-pulse/`) on orbit.uat, 2026-09-23.

## Theme (`e_theme`) ✅ — the sample's theme (`examples/cgb-pulse/`)

```json
{ "entityType": "e_theme", "properties": { "name": "CGB Pulse — maroon & gold", "standard": false,
  "defaultScheme": "light",
  "cssVars": { "--palette-brand-25": "#fcf7f8", …, "--palette-brand-600": "#8a1538", …, "--palette-brand-950": "#2f0713",
               "--palette-brand-600-seed": "#8A1538",
               "--palette-brand-secondary-…": "…",
               "dark": { …same keys for the dark scheme… } },
  "styleOverrides": {} } }
```

- `cfg.createTheme({name, brand, secondary, scheme})` derives the 25…950 scale from one seed colour.
  Buttons, focus rings, nav selection and the app's **login page** pick it up immediately ✅ (the
  login button rendered maroon).
- Point the app at it: `e_interface.properties.theme.defaultThemeId` ✅. Real apps also carry
  `theme.customColors` (swatches for the builder's colour picker) and `theme.output` (compiled CSS) 👁.
- Other palettes in use: `--palette-gray-*`, `--palette-alpha-brand-*`, `--palette-error|warning|success-*`.
  Reference them in CSS and chart colours: `var(--palette-brand-500)`.
- Per-subtree scheme: `appearance.theme:'dark'` on any Stack/Card ✅ (see `components.md`).

## Navigation ✅

`cfg.registerPages(appId, [{pageId, slug, name, icon, nav:false?}])` writes:

- `navigation.primary: [{id:'nav_<slug>', name, icon, type:'PAGE', pageId, slug}]` — the rail items.
- `navigation.appearance.{SM,MD,LG,XL}.primary: [{id, hiddenInOverflow:false}]` — per-breakpoint order.
- `navigation.defaultPageId` — the home page.
- `entityDetailsMap`, `interfacePageIdVsSlugMap`, `paths.f_root.children`.

Breakpoint defaults (what the builder writes): SM = `BottomTabsNavigator` at the bottom; MD/LG/XL =
`Standard` side rail, 56 px, `labelVariant:'expandable'` on XL. `navigatorType:'None'` hides the rail
(for apps with their own header) 👁. `secondary: [{type:'USER_MENU'}]` adds the profile menu.

Icon names must exist (`Home02 Cube02 MessageSmileSquare Settings04 Stars02` …) — an unknown name
renders an empty slot with no error ✅.

## Hosting ✅

`POST /api/domain-mapping/interface {domain:'<appId>-orbit.matrix-uat.unifyapps.com', module:'INTERFACE', applicationId}` → 204.
The host pattern differs per tenant (`<tenant>.matrix-<env>`); code apps live on `…tensor-uat…`.

## Publish ✅

`POST /api/entity/e_interface/<appId>/deploy {deploymentNotes}` → the app with
`deploymentState.version` incremented. Publishes pages and data sources together.

- **Publish after every new data source**, or the running app answers `forbidden datasource: not found`.
- Versions: `POST /api/aggregation?entityType=EntitySnapshot&group=STANDARD` with
  `additional:{entityType:'e_interface', entityId}` 👁. Deployed copies: `e_interface_deployed`,
  `e_component_deployed` 👁.

## Viewing it

| Where | What you see |
|---|---|
| `/p/0/interfaces/<appId>/builder/<slug>` | the builder canvas (Design, Data, Dev Tools → Pulse / Console / Network / **State**) |
| `/p/0/interfaces/<appId>/preview/<slug>` | **the app with live data in your Orbit session** — use this to verify ✅ |
| `https://<appId>-orbit.matrix-uat.unifyapps.com/` | the published app. `security.type:'PRIVATE'` → the app's own login page; the user signs in (never Claude) ✅ |

## Security and access 👁

`e_interface.properties.security {type:'PRIVATE'|…, cspData:{frameAncestors:[…]}, cspDetails:{enforceCSP}}`;
pages carry `publicAccess`; `pagePermissions` and block `permissions` restrict by role. Per-app identity
providers (SSO) are configured under *Settings → Security → Privacy* — see the `unifyapps-apps` skill
(§ SSO) and never change the tenant's IdPs.

## Verified 2026-09-25 (a PoC-tracking command-centre build, API-SPEC §51)

- `e_theme.cssVars` accepts **`--palette-success/warning/error-25…950` (+ `-600-seed`) overrides** and the
  runtime applies them: error Tag text computed to the custom `-700`, on a dark band the custom `-300` ✅.
  Pass them as `extra` to `cfg.createTheme`, or POST the entity with `tags:['SC_NATIVE']` (kept).
- Spacing tokens measured on the preview: `gap-xs 4 · gap-sm 6 · gap-md 8 · gap-lg 12 · gap-xl 16 · p-md 8 ·
  p-lg 12 · p-xl 16 · p-3xl 24 px`. Raw px render exactly: `styles.gap.all:'24px'`,
  `styles.padding.custom:{t,b,l,r}` — use them when the design scale is 8-pt.
- A Google Fonts `@import` in the root block's customCSS (`rootCss`) loads under the tenant CSP ✅.
- The platform focus ring on a dark subtree is `rgba(255,255,255,.56)` 3 px (visible on `#0F2805`).
- Publish after every data-source edit — the app went v1 → v9 across the build; the preview reads drafts.
