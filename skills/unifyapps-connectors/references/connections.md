# Connections — finding, creating, testing, and the safety rules

A **connection** is one authenticated instance of a connector. It holds the secrets, and workflow
steps, agent tools and app data sources reference it by 24-hex `id` in `context.connectionId`.

Verified on `orbit.uat.unifyapps.com` unless noted.

---

## 1. Find one before you create one

```json
POST /api/aggregation?entityType=Connection&group=STANDARD
{ "entityType": "Connection", "group": "STANDARD", "includeTotalHits": true,
  "filter": { "op": "AND", "values": [
      { "field": "appName", "op": "EQUAL", "values": ["oracledb"] },
      { "field": "active",  "op": "EQUAL", "values": [true] } ] },
  "projections": [{"name":"id"},{"name":"name"},{"name":"appName"},{"name":"oUId"},{"name":"cTm"}],
  "sorts": [{"field":"cTm","order":"DESC"}], "page": { "limit": 50, "offset": 0 } }
```

Rows come back as `{ objects: [ { columns: { id, name, appName, oUId } } ] }`. No secrets.

Then pick:

1. **Prefer a connection the user owns** (`oUId` = their user id from
   `GET /api/user-context?includeRoles=true`), or one they were explicitly told to use.
2. **Names are not unique** — three different connections on UAT are all called
   `RDQA-OracleDB-PRY`. Confirm the choice with the user rather than matching on name.
3. **Never touch a connection whose name contains `DND` or `DONT TOUCH`**, and never edit one
   belonging to someone else.
4. If several look plausible and the user cannot say, the host/service inside `userInput`
   distinguishes them — read it, use it to decide, and **do not print it**.

## 2. The connection form

```http
GET /api/applications/{appName}?fields=authSpec,iconUrl,displayName,name,refreshable,includeOptions
```

`authSpec.input` is a `SCHEMA_AND_LAYOUT` JSON Schema: `schema.required` tells you the minimum,
`schema.properties` the full form, `layout` the UI order. `authSpec.externalDocUrl` links the
public docs page. `refreshable: true` ≈ OAuth with refresh — see §5.

`authType` options usually come from a lookup rather than an inline enum:

```json
POST /api/lookup?ByQuery=CUSTOMER_AUTH
{ "options": { "appName": "github", "auths": [ { "type": "", "label": "" } ] } }
```

⚠️ Some app names return **200 with an empty body** (`custom_http_endpoint`, which is an internal
node with no connection form). Guard the JSON parse.

## 3. Test, then create

```http
POST /api/connection/input/test?appName={appName}     → 204 means the inputs work
POST /api/connection/input?appName={appName}          → 200 with the created connection
```

Both take the same body. A verified Custom HTTP example (created `6ab0ea7a5459f4370f0c1f3f` on
UAT, 2026-09-21):

```json
{ "name": "maher_scratch_http (Claude API learning)", "authType": "CUSTOM",
  "inputs": { "name": "maher_scratch_http (Claude API learning)", "requestType": "HTTP",
              "authType": "CUSTOM", "baseUrl": "https://jsonplaceholder.typicode.com",
              "headersList": [], "sslVerify": true, "requestTimeoutInSecs": -1,
              "connectionType": "DIRECT", "tags": [],
              "rateLimitConfig": {"enabled": false}, "circuitBreakerConfig": {"enabled": false} },
  "options": { "rateLimitConfig": {"enabled": false}, "circuitBreakerConfig": {"enabled": false} },
  "tags": [] }
```

`inputs` must follow that app's `authSpec`. Always test first — a failed create leaves a broken
connection in a shared tenant.

`POST /api/connection` (bare) exists but is not the path for ordinary connectors: creating an
`mdm_by_unifyapps` connection by hand fails with
`No Value found in filter with field: sourceConnectionId` — a context graph creates its own.

## 4. What Claude must never do

1. **Never type a password, token, API key or card number into a form or a request body on the
   user's behalf**, and never complete an SSO or OAuth consent prompt for them. The user enters
   their own secrets, in their own browser.
2. **Never ask for a password in chat**, never put one in a command line, a file, an env var you
   write, or a commit.
3. **Never print `connection.userInput`.** `GET /api/connection/{id}` returns `password` and
   `authToken` **in clear**. Read it only when you must check a host or service name, and redact
   before showing or saving anything.
4. **Never create a connection that needs a secret you do not legitimately have.** Ask the user to
   create it in the Connections Manager (`/p/0/connections/all` → New connection), then find it by
   aggregation.

Connections that need **no** secret — a public Custom HTTP endpoint, for example — are fine to
create over the API.

## 5. OAuth connectors need a human

`refreshable: true` (Slack, GitHub, HubSpot, Google, Microsoft, most SaaS) means the connection is
completed by clicking **Authorize** in the UI, which opens the provider's consent screen. There is
no API path around it and you must not script one.

The flow that works:

1. You create nothing. Ask the user to open `/p/0/connections/create/{appName}`, name the
   connection, and click Authorize.
2. They tell you the name; you find the `id` with the aggregation in §1.
3. You wire that `id` into the step.

**Google scopes**: Gmail and Calendar expose a `scopes` multi-select at connection time; Drive
defaults to full `drive`. For an enforced read-only Google connection, build a custom OAUTH
connector with fixed `*.readonly` scopes (Connectors SDK, `API-SPEC.md` §25).

## 6. Per-user runtime connections (agents)

An agent tool can use **the signed-in end user's own** connection instead of a fixed one. Define
the tool's `context` with `{appName, resourceName}` and **no** `connectionId`; the chat then shows
a "Connectors that could help → Connect" card once per user, and the platform remembers that
user's connection afterwards.

- Never bind a personal connector (Gmail, Drive, Calendar, Fireflies) to a fixed `connectionId` —
  that makes every user act as whoever owns it.
- Built-in connectors render the Connect card correctly. **Custom SDK connectors render it blank**
  on UAT (2026-09-22), though the Connect button still opens the auth popup.
- The "Runtime user connections" automation setting is not exposed on UAT, so a *workflow* (as
  opposed to an agent tool) cannot use per-user connections there.

## 7. Connection health and scale

- `active: true` is the field to filter on; inactive connections still exist and will fail at run
  time with an auth error rather than a clear message.
- Tenants accumulate connections fast — 7,775+ on UAT, 3,296 of them Ontology. Expect duplicates,
  abandoned test connections and personal ones. The aggregation query with `oUId` is the way to cut
  through it.
- `captureFailures`, `rateLimitConfig` and `circuitBreakerConfig` are per-connection reliability
  settings, visible in the create body above. Leave them at their defaults unless the user asks.
