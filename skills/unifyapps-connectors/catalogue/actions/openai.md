# `openai` — OpenAI

44 ACTION, no triggers. 92 connections on UAT. Token auth, **not** OAuth — creatable over the API.
Connection inputs: `name`, `authType` (`TOKEN` | `COMPLIANCE`), `domain`, `authToken`,
`requestTimeoutInSecs`. `domain` lets you point at an Azure-style or proxy endpoint.

## Text generation

| Action | Note |
|---|---|
| `openai_create_response` · `openai_create_response_streaming` | the Responses API — prefer these for new work |
| `openai_send_message` | chat-style convenience wrapper |
| `openai_create_completion` · `openai_create_streaming_completion` | older completion shape |
| `openai_create_flex_response` | flex-tier processing |
| `openai_list_chat_completions` · `openai_list_chat_completion_messages` | read back history |
| `openai_list_models_action` · `openai_list_assistants` | |

## Task-shaped helpers

`openai_summarize_text` · `openai_analyze_text` · `openai_categorize_text` · `openai_parse_text` ·
`openai_draft_email` · `openai_moderate_text` · `openai_generate_text_embedding`

These wrap a prompt for you. Convenient for a quick step; for anything you will tune, use
`openai_create_response` and own the prompt — or the platform's own
`conv_ai_by_unifyapps_call_llm_model_with_options`, which is model-agnostic.

## Audio, image, video

`openai_create_transcription` · `openai_create_transcription_v2` (prefer v2) ·
`openai_create_translation` · `openai_text_to_speech` · `openai_generate_image` ·
`openai_modify_image` · `openai_create_image_variation` · `openai_create_video` ·
`openai_get_video` · `openai_download_generated_video`

## Realtime

`openai_realtime_session` · `openai_realtime_send_message`

## Batch

`openai_batch_create` / `openai_create_batch` · `openai_batch_upload_input_file` ·
`openai_batch_get` · `openai_get_batch_status` · `openai_retrieve_batch` · `openai_list_batches` ·
`openai_batch_download_result_file` · `openai_cancel_batch`

For thousands of documents, batch is dramatically cheaper than a loop of single calls — build the
input file, submit, poll status, download results.

## Files and admin

`openai_upload_file` · `openai_list_users` · `openai_list_workspace_conversations` ·
`openai_list_compliance_logs_multiple_event_types` · `openai_list_compliance_log_files` ·
`openai_download_workspace_log_file`

The compliance/workspace actions need an org-level key with `authType: COMPLIANCE`.

## Gotchas

- Two names for batch creation (`openai_batch_create`, `openai_create_batch`) and two for
  transcription. Check `/resources` for which one the tenant currently exposes at the higher
  version, and prefer the `_v2` variant where one exists.
- Consider `conv_ai_by_unifyapps` instead when the choice of model should stay configurable —
  it fronts OpenAI, Anthropic, Gemini and Bedrock behind one node.
