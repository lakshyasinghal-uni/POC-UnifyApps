# Studio app kit

The code a UnifyApps Studio code app is made of, before its plan-specific files. The Studio's build
engine (`sc-native-studio/app/public/tools/studio-build.js`, `buildCodeAppRepo`) commits these files
to the app's own GitHub repo, next to the files it generates from the approved plan. The Maher
Methodology flow: starter app over the API, then a private GitHub repo, then commits, then publish
from `main`. The Code Builder agent never writes the app.

Paths here are the paths in the app repo.

| File | What it is |
|---|---|
| `app/src/App.tsx` | the template's auth routes + `KitRoutes` for every other path |
| `app/src/kit/KitApp.tsx` | shell (nav rail from the plan's pages, brand mark, signed-in user), routes, the docked agent |
| `app/src/kit/Dashboard.tsx` | a secondary overview (never a screen of the architecture): dark band, live thesis, glass KPI tiles, `ChartBlock` charts, attention list, insights |
| `app/src/kit/Queue.tsx` | queue (list + detail split, filter chips, search, actions) and list pages |
| `app/src/kit/Pages.tsx` | form, upload (USER-scope file to its workflow), assistant (full-size agent with its suggestions) |
| `app/src/kit/Insights.tsx` | live AI insights per screen through the solution's `scc_<x>_live_insights` workflow |
| `app/src/kit/AgentDock.tsx` | the agent docked beside every screen; questions posted into the framed copilot island |
| `app/src/kit/actions.tsx` | plan actions as buttons (`row.<field>`, `notes`, `user`, confirm), the signed-in user's real name |
| `app/src/kit/records.ts` | one read per object, where/KPI/chart maths (same rules as the config apps), formatting, masking |
| `app/src/kit/ui.tsx` | Ask button (talk to the data), status pill, loading/empty/error states, page header, KPI tile |
| `app/src/kit/types.ts` | the `AppSpec` the Studio writes to `app/src/data/app-spec.ts` |
| `app/src/components/charts/*` | the house chart module (`ua-chart`), recoloured per app by the engine |
| `app/src/lib/agent-dock.ts` | the dock store (`useAskAgent`) |

Generated per app by the engine (not in the kit): `app/src/data/app-spec.ts`, `app/src/data/solution.ts`
(workflows, agents, `islandSrc`), `app/src/data/bindings.ts` (the two object-agnostic storage reads),
`app/src/kit/brand.css` (the palette, app-owned because the Code Builder regenerates `index.css`),
`app/package.json` (+ `chart.js`, `exceljs`), `theme.json`, `PRODUCT.md`, `DESIGN.md`, `docs/SOLUTION.md`.

Rules the kit keeps: every number from a live object or workflow; no invented fallback values or people;
every tile, chart, row and AI result can be asked about; every state designed (loading, empty, error);
Motion follows the app's own setting — on | auto | off, default on, resolved before first paint and published as `data-still` on `<html>`, with a Motion switch in the masthead; `auto` honours `prefers-reduced-motion`; purposeful only, none on tables or charts; AI loading states keep their opacity pulse when still.
