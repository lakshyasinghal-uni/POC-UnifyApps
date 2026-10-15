# Documents — upload from the app, use in a workflow and in the agent

Verified end to end on orbit.uat, 2026-09-23 (CGB Pulse → *Documents*): a synthetic PDF
(`examples/cgb-pulse/make_test_document.py`) uploaded in the app, read by a workflow in ~39 s, stored
as a record, shown with its analysis and the PDF itself, turned into a tracked action, and discussed
with the agent. Three routes, pick by what you need:

| Route | Use when | Moving parts |
|---|---|---|
| **A. FileUpload → workflow → object** | the document must be analysed once, stored, listed, filtered, reused by other screens and by the agent | FileUpload block, automation data source, workflow (OCR/LLM + storage), object, table/detail UI |
| **B. Chat attachment** | a one-off question about a file | `cfg.copilot(…, {attachments:true})` — nothing else |
| **C. Both** | stored analysis *and* a conversation about it | A, plus an "Ask the analyst" button that sends the record's summary to the Copilot |

## A. FileUpload → workflow → object ✅

```
FileUpload b_upload ──(drop: S3 multipart upload, immediate)──► files[0] = {source, url, name, mimeType, size…}
Button "Analyse"  ──runDs──► ds_ingest_document (callables_call_automation → cgbp_ingest_document)
  n_in      inputs: title, entity_code, file_source (= files[0].source), file_name, mime_type, file_url, uploaded_by
  n_prep    Groovy: doc_code, the record payload (status ANALYSING), files = [{fileObject:{source, sourceType:'CLOUD_STORAGE', name, fileType}, mimeType}]
  n_create  storage create_record (rawPayload)                       → the row exists while the model reads
  n_ocr     CALL_INTERFACE_WORKFLOW __ua__call_ocr_extraction           → output (string), content[], status, errMsg
  n_parse   Groovy: parse the JSON (strip ``` fences), build SET updates or status FAILED + error
  n_upd     storage bulk_upsert_records_by_id
  n_out     {doc_code, status, summary}
onSuccess: notify · runDs(ds_documents) · setVar(var_doc, <this ds>['data']['doc_code'])
```

### 1. The upload block

```js
cfg.fileUpload('b_upload', { label: 'Click or drag a PDF or an image (max 20 MB)', types: ['.pdf', 'image/*'], maxMb: 20 })
```

The file uploads the moment it is dropped (`/api/uploads/s3/multipart/<token>`, the same Uppy chain
as custom components). The block's state then holds it:

```json
{ "id": "…", "name": "labour-q3-service-review.pdf", "source": "user-uploads/147/1790155…/labour-q3-service-review.pdf",
  "sourceType": "CLOUD_STORAGE", "url": "/api/file/download/…", "fileType": "pdf", "mimeType": "application/pdf",
  "size": 3329, "type": "FILE", "isUploaded": true, "progress": 100, "meta": {} }
```

⚠️ **`source` is the storage key. There is no `key`** — a button disabled on `!files[0].key` never
enabled. When a field is unknown, bind a Typography to `{{ JSON.stringify(b_upload['files']?.[0]) }}`
for one preview: that is how this was found. `url` is session-authenticated: good for PDFViewer and
links inside the app, not for a server outside it.

### 2. The automation data source

```js
const U = "b_upload['files']?.[0]";
cfg.ensureDs(cfg.dsAutomation, { appId, pageId, name: 'ds_ingest_document', automationId: WF_INGEST, run: 'manual',
  params: { file_source: `{{ ${U}?.['source'] || '' }}`, file_name: `{{ ${U}?.['name'] || '' }}`,
            mime_type: `{{ ${U}?.['mimeType'] || 'application/pdf' }}`, file_url: `{{ ${U}?.['url'] || '' }}`,
            title: "{{ b_docForm['data']?.['title'] || '' }}", entity_code: "{{ b_docForm['data']?.['entity_code'] || '' }}",
            uploaded_by: "{{ userContext['name'] }}" },
  onSuccess: [A.notify('Document analysed', 'success'), A.runDs(DOCS), A.setVar('var_doc', "{{ <this ds id>['data']?.['doc_code'] }}")],
  onError:   [A.notify('The document could not be analysed', 'error'), A.runDs(DOCS)] });
```

A callback that reads its **own** data source needs that id, which exists only after creation: create
with a placeholder (`e_INGEST`), then replace it in the saved entity and update (the builder does this).
Button: `loading: {{ ds['isLoading'] }}`, `disabled: {{ !files[0]?.source || b_upload['isUploading'] }}`.
Publish after creating the data source (golden rule 4).

### 3. The workflow's OCR step

Node `type:'CALL_INTERFACE_WORKFLOW'`, `context {appName:'conv_ai_by_unifyapps', resourceName:
'conv_ai_by_unifyapps_ocr_document_details_extraction'}`, inputs:

```json
{ "callableInterfaceId": "__ua__call_ocr_extraction",
  "parameters": { "files": "{{ n_prep.outputs.result.files }}", "modelId": "<TEXT_EXTRACTION model id>",
    "response_format": "json_object", "systemPrompt": "…Use only what the document says…", "prompt": "Return JSON with exactly these keys: …" } }
```

- `files[]` items: `{fileObject:{source, sourceType:'CLOUD_STORAGE', name, fileType}, mimeType}` — the
  FileUpload `source` goes straight in.
- `modelId` must be a model in the **TEXT_EXTRACTION** group: `POST /api/lookup?ByQuery=ENTITY_ID:ai_agent_llm_model`
  filtered `properties.modelGroup IN [textExtraction, TEXT_EXTRACTION]` (which one: the model notes below). The interface itself: `POST /api/lookup?ByKeys=CALLABLE_INTERFACE`.
- Outputs `{output (string), content[], status, errMsg}`. Ask for JSON, then parse defensively in
  Groovy (strip code fences, fall back to `status FAILED` + `error` with the raw text) — a failed parse
  must still leave the row readable.
- Same node pattern as the LLM step (`__ua__call_ai_agent_llm_model`, `unifyapps-builder` workflows reference):
  as `ACTION` it fails with a ConnectionService error.
- **Pick the model with one real document first** (UAT, ported 2026-09-28):
  - OpenAI GPT-4.1 mini `e_ai_agent_openai_gpt_4.1_mini` read an invoice PDF in **~5 s** (8/8 fields,
    2,505 tokens in, 135–174 out, 2026-09-24).
  - Its output is **capped by the model entity's `maxOutputTokens`, which is 436 on UAT**. That cut a six-line
    invoice (API-SPEC §47.28), and the node has no token input to raise it. It suits a few header fields;
    for line items, use a model with a larger cap or read the lines in a second LLM step.
  - Claude Sonnet 4.6 on Bedrock `e_69b41a443d6f1815768c245f` **hung until the platform's ~128 s sync
    limit** on the same file.
- The outputs also carry `inputTokens` / `outputTokens`, but **no cost**. For the evidence log, compute cost
  from a list-price map in the parse step (USD per million tokens, e.g. GPT-4.1 mini 0.40 / 1.60, GPT-4.1 2 / 8,
  GPT-5 1.25 / 10, Sonnet 4.6 3 / 15) and call it "list price". A model missing from the map leaves the cost
  unset (`unifyapps-builder` `references/workflows.md` "AI evidence and usage log").
- `status` is not a reliable success signal: a successful read did not return "SUCCESS". Success means parsed
  JSON with at least half the expected fields and an empty `errMsg`.
- Test through the **deployed** workflow's data source, not `initiate-test`. On UAT the test runner answered
  "No Response received within specified timeout" while the deployed path ran the same OCR step in 5 s.

The full definition is `examples/cgb-pulse/platform/workflow_ingest_document.json`; the object is
`cgbp_document` in `platform/objects.json` (JSON-in-string fields `*_json` for lists, `status`
ANALYSING → ANALYSED | FAILED).

### 4. The UI over the record

- `ds_documents` (storage fetch, sort `uploaded_at DESC`) with a transformer that `JSON.parse`s the
  `*_json` fields once, so blocks bind to arrays: `{{ ds['data']['rows'] }}`.
- Library Table (`onRowSelect` → `var_doc`), detail section visible on `{{ !!var_doc['value'] }}`.
- Tabs: **Analysis** (summary, KeyValue, key points Repeatable, one Alert per risk, metrics Table,
  recommendations Repeatable) · **Document** (`cfg.pdf("{{ doc.file_url }}")` — PDFViewer shows the
  uploaded file in the session ✅) · **Extracted text**.
- **Recommendation → action**: the row's button sets three page variables, then
  `A.delay(A.runDs(ds_doc_action), 300)` creates the `cgbp_action` record from them ✅
  (`ACT-1790155349879`). Setting variables and running a data source in the same click works when the
  run is delayed a moment.

## B. Chat attachment ✅

```js
cfg.copilot(AGENT_ID, { id: 'b_dock', attachments: true, … })
```

Adds `{action:'addAttachments'}` to the CopilotInput and sends `attachments: {{ b_in['attachments'] }}`
with `submitMessage`. The agent received the PDF, read it, and cross-checked it against `cgbp_action`
(the sample's object, `examples/cgb-pulse/platform/objects.json`) with its QueryData tool — no workflow involved. Tell the agent in its instructions that attached
files are readable and should be compared with the live data.

## C. Stored document + conversation ✅

Put the object in the agent's instructions (fields and what they mean), then give the detail view a
button that asks on the user's behalf:

```js
askDock(`{{ 'I uploaded "' + doc.title + '" (document ' + var_doc['value'] + ' in cgbp_document). Its summary: ' + doc.summary + ' — how does this compare with the live data?' }}`)
```

The agent made four QueryData calls and answered with the document's claims set against the live
objects.

## Traps

| Symptom | Cause |
|---|---|
| Analyse button never enables | bound to `files[0].key`; the field is `source` |
| Row stuck on ANALYSING | a step after `n_create` stopped the run (every node is `fallbackMode:'STOP'`). The parser already writes FAILED + `error` for unreadable output; an OCR node that errors outright still stops the run — handle it on the data source's `onError` (it refreshes the list) 👁 |
| Model returns prose or fenced JSON | `response_format:'json_object'` + strip ``` in the parser |
| The published app cannot call the new data source | publish again after creating it |
| `initiate-test` of the workflow cancels at ~26 s | OCR + LLM takes 20–60 s — execute through the data source (`cfg.runDs`) or the app |
