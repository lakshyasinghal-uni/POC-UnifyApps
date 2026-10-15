# Building a custom connector over REST (Connectors SDK) — verified recipe

Use this when the catalogue has no connector for an API (e.g. Amazon SP-API and Amazon Ads API are
absent on UAT). Everything here was built and run on `orbit.uat.unifyapps.com` on 2026-09-24
(connectors `Amazon Selling Partner API` `6ab5498d18ddf207e96d5561`, `Amazon Ads API`
`6ab54c3084c18c627a82da24`, and a template probe connector `6ab54b031ed6f941ecff5023`).
Reusable build script: the connectors tool (`upsertActions`, `buildAds`) of the storefront-optimization build —
see `unifyapps-solution-playbook/references/builds/mars-pedigree.md` for where it lives.

## 1. The sequence

```text
POST /api/connector-builder/definition/basic               {name, description, baseUrl, logo:"", categories:[]}  → definition.id (D)
POST /api/connector-builder/definition/{D}/auth?type=CUSTOM {}                                                    → adds the auth (version 1)
POST /api/connector-builder/definition/update/{D}/auth?type=CUSTOM&version=1
     {type:"CUSTOM", name, input:{type:"SCHEMA_AND_LAYOUT", dynamic:false, layout:{}, schema:{…connection form…}}}
POST /api/connector-builder/request/{D}/CUSTOM/auth         {…the login request…}   ⚠️ may answer 500 AFTER saving — GET it back
POST /api/connector-builder/request/update/{D}/CUSTOM/auth?version={v}   {…full object…}   (later edits)
POST /api/connector-builder/definition/{D}                  {name, description, type:"ACTION"} → action id (A)
POST /api/connector-builder/definition/{D}/update/{A}?version={v}  {…full action def, enabled:true, input, output…}
POST /api/connector-builder/request/{D}/{A}/action           {type:"ACTION", method, url, headers, queryParams, body, sslVerify, enableRetry}
POST /api/connector-builder/request/{D}/update/{A}/action?version={v}   (later edits — note where "update" sits)
POST /api/connector-builder/definition/{D}/publish?version={v}
GET  /api/workflow-builder/node/{D}/resources                → {D}:{A} with its resourceVersion for workflow nodes
```

The definition read carries no action list — **keep the action ids** (name → id) in your build script,
or a re-run creates duplicates.

## 2. Refreshable token auth (OAuth-style refresh token, e.g. Login with Amazon)

Saved auth-request fields that matter: `method`, `url`, `headers`, `body:{type:"JSON", formEncode:true,
payload:{grant_type:"refresh_token", refresh_token:"{{ rawPayload.refresh_token }}", client_id:…,
client_secret:…}}`, `output:{type:"SCHEMA", schema:{properties:{access_token, expires_in}}}`,
`actionAuthHeaders:{"x-amz-access-token":"{{ auth.access_token }}"}` (or `Authorization: Bearer {{ auth.access_token }}`),
`refreshable:true`, `defaultExpiry:3000`, `defaultExpiryUnit:"SECONDS"`, `expiryType:"RELATIVE"`
(or `ABSOLUTE`), `expiryTime:"3000"`, `expiryUnit:"SECONDS"`, and a `refreshCredentials` request object
(the UI shows no Body field for it; a `body` set over the API persists — make it the same token call).

Prove reachability without real secrets: `POST /api/connection/input/test?appName={D}` with obvious
placeholders returns the provider's own error (Amazon: `x-amzn-errortype: OA2InvalidClientException`,
401). Nothing is saved by a test.

## 3. Template semantics inside an action request (verified through httpbin)

| Template | Renders |
|---|---|
| `{{ rawPayload.x }}` | the action input `x` |
| `{{ input.auth.field }}` | a connection-form field — in URL, query, headers and body |
| `{{ auth.field }}` | an auth-request **output** — in `actionAuthHeaders` |
| `{{ rawPayload.field }}` inside `actionAuthHeaders` | **does not render** (header omitted) — put per-connection headers on each action via `input.auth.*` |
| whole-value `"{{ rawPayload.list }}"` | keeps its type: a JSON array stays an array, a number stays a number |
| `"{{ rawPayload.values.collect { [value: it] } }}"` | Groovy runs → array of objects |
| inline `"x-{{ rawPayload.t }}-y"` | string; an absent input renders `null` |
| query param whose input is **absent** | dropped from the URL entirely |
| query param whose input is `""` | sent as `key=` |

Workflow node for an action: `{type:"ACTION", context:{appName:D, resourceName:"D:A", resourceVersion,
type:"APPLICATION", connectionId}, inputs:{…}}`. On success the node output is the parsed body only.

## 4. Things that are not possible — design around them

- **`connectionId` must be a literal, existing connection** at save time; a template is a violation
  ("Connection is no longer available") and the workflow will not deploy. Generate connector-bound
  workflows once the customer has created the connection ("switch-on").
- **A failed connector call fails the run** — with `fallbackMode: CONTINUE` and also with `MANUAL` + an
  `error` edge (run through an app data source). Use one unit of work per run: record the attempt
  first, let a schedule retry, cap the attempts (the Amazon workflow tool of the same build,
  `unifyapps-solution-playbook/references/builds/mars-pedigree.md`).
- **Pre-signed download URLs** (S3) must be fetched without the connector — its auth headers
  (`x-amz-*`) would break the signature. A Groovy node can do it:
  `new java.net.URL(u).openConnection()` → `getInputStream()` → `java.util.zip.GZIPInputStream` for
  gzip documents, streaming large files instead of loading them.
