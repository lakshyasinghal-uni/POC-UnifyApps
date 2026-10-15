# Orbit records: where every POC document, decision and piece of feedback lives

Everything a POC produces lives in Orbit (orbit.uat.unifyapps.com), in three objects whose
definitions are in [orbit-objects.json](orbit-objects.json):

| Object | One row per | Key |
|---|---|---|
| `poc_studio_poc` | POC | `POC-<client-slug>-<yyyymmdd>` |
| `poc_studio_document` | document version | `<poc_id>__<stage>__<file-slug>__v<n>` |
| `poc_studio_feedback` | piece of feedback | auto ticket `FB-_1001`, `FB-_1002`, … |

Nothing is ever deleted. A new version of a document supersedes the previous one by status.

## Two ways to reach Orbit

**1. Direct API, no browser (preferred).** `node "${CLAUDE_PLUGIN_ROOT}/scripts/orbit-api.mjs"`
with the session in environment secrets: `ORBIT_COOKIE`, or `ORBIT_USERNAME` and
`ORBIT_PASSWORD` for a local account. Never ask for these in the chat and never print them.
Every command prints one JSON line. Exit 0 is done, 1 is an error, 3 is "not reached Orbit,
queued", and `reconnect: true` means the session itself has gone.

| Command | Use |
|---|---|
| `check` | Who is signed in; whether the three objects exist; `userMismatch` when it is not the user setup recorded |
| `ensure-objects` | Create any missing object from orbit-objects.json; an existing one is never altered |
| `schema <object>` | The live object definition (to refresh orbit-objects.json) |
| `get <object> <id>` · `find <object> --field f --value v --limit n` | Read |
| `create <object> <json or @file>` | New row. Pass anything holding a person's words (feedback, gate replies) as `@file`, so the words never sit in a shell command |
| `update <object> <id> <json or @file>` | Read the row, merge the given properties, write the full record with its version |
| `upload <path>` | Upload a file; returns the File-field value |
| `save-doc --poc --stage --slug --title --type --file [--status] [--gate] [--by]` | Upload the full file, create the next version (text also in `content` up to ~1 MB), mark the previous one `superseded`, update the POC's document count |
| `readback --poc <id>` | Every latest document: file uploaded, version, status; `ok` only when all are there and nothing is queued |
| `sync-counts --poc <id>` | Recompute the POC row's document and open-feedback counts from the records |
| `flush` | Replay queued writes in order; stops at the first that still fails |

**2. A signed-in Orbit tab.** When no secret is set, use a browser tab already signed in to
Orbit (the built-in browser first, then Claude in Chrome) and run the same calls same-origin
with the browser's JavaScript tool. The cookie rides along and nothing enters the chat. Paste
these two helpers once per tab:

```js
// ps: one call to Orbit from a signed-in tab. ps('GET', '/api/user-context')
window.ps = async (method, path, body, headers = {}) => {
  const r = await fetch(path, { method, credentials: 'include',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (r.status === 401 || (r.headers.get('content-type') || '').includes('text/html')) throw new Error('Orbit session expired');
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};

// psUpload: upload a File or Blob the way the Orbit UI does; returns the File-field value.
window.psUpload = async (file, name = file.name, mime = file.type || 'application/octet-stream') => {
  const ctx = await ps('GET', '/api/user-context?includeRoles=true');
  const h = { 'x-ua-uppy-upload': JSON.stringify({ useExternalApi: false,
    bucketDetails: { directory: `user-uploads/${ctx.customer.id}`, bucket: 'uat-uploads.unifyapps.com' },
    isPublicUpload: false, isBuilderAsset: false }) };
  const { uploadId, key } = await ps('POST', '/api/uploads/s3/multipart', { filename: name, type: mime, metadata: { name, type: mime } }, h);
  const PART = 8 * 1024 * 1024, parts = [];
  for (let n = 1, off = 0; off < file.size || n === 1; n++, off += PART) {
    const { url } = await ps('GET', `/api/uploads/s3/multipart/${uploadId}/${n}?key=${encodeURIComponent(key)}`, null, h);
    const put = await fetch(url, { method: 'PUT', body: file.slice(off, off + PART) });
    parts.push({ PartNumber: n, ETag: put.headers.get('etag') });
    if (off + PART >= file.size) break;
  }
  const done = await ps('POST', `/api/uploads/s3/multipart/${uploadId}/complete?key=${encodeURIComponent(key)}`, { parts }, h);
  const source = done?.key || key;
  const fileDetails = { fileType: mime, name, size: file.size, source, sourceType: 'CLOUD_STORAGE', 'ua:type': 'FILE' };
  const { url } = await ps('POST', '/api/file/signed-url?preview=true&expiryTime=1', { fileDetails });
  return { name, source, sourceType: 'CLOUD_STORAGE', mimeType: mime, fileType: mime, size: file.size, type: 'FILE', url };
};
```

A document saved from a tab follows `save-doc`'s steps by hand: find the latest version for
the POC and slug, `psUpload` the file, `ps('POST', '/api/entity', {entityType:
'poc_studio_document', properties})`, set the previous version's status to `superseded`
(`ps('POST', '/api/entity/update', …)` with the full properties and its `version`), then update
the POC row's `document_count`. A file made in the workspace reaches the tab through the
browser's file upload, never by pasting its bytes into the chat.

## The write-back check (before every human step)

Before any gate is sent, and before any other question reaches a person:

1. `flush`.
2. Save every document made since the last check with `save-doc`.
3. `readback --poc <id>` and confirm each document this POC has made so far is there: full
   file uploaded, latest version, status as expected.
4. Update the POC row: stage, status, current gate, counts, `updated_at`.

When any step does not reach Orbit (exit 3, `reconnect: true`, a missing document, or a
`userMismatch`), stop. Tell the user in one line what did not save and how to reconnect: sign
in to Orbit again, set `ORBIT_COOKIE` again, or open Orbit in the browser for them to sign in.
Mark the POC `waiting_on_reconnect` if the row can be written. Do not send the gate or start
the next step until the check passes. After a gate answer, write the decision (a
`gate_decision` document and the POC row's gate status) and run the check again before the
next phase starts.

## Feedback tickets

Every piece of feedback, in the chat or in a gate thread, at any time, becomes a
`poc_studio_feedback` row: the exact words, who gave it and their role, where, the stage and
gate, a category and severity, the document it is about. Acknowledge it with its ticket
number. Close it with `status: done` (or `wont_do`) and one line in `resolution` saying what
was done. The POC row's `open_feedback_count` follows.
