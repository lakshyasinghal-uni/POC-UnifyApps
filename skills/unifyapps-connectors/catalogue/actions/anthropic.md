# `anthropic` — Anthropic

20 ACTION, no triggers. 30 connections on UAT. Token auth — creatable over the API. A separate
`anthropic_enterprise` connector exists for enterprise-only surfaces.

## Messages

| Action | Note |
|---|---|
| `anthropic_create_message` | the main call |
| `anthropic_create_message_streaming` | token-by-token; use when a UI is waiting |
| `anthropic_list_models` | resolve a current model id rather than hardcoding one |

## Batch

`anthropic_create_message_batch` · `anthropic_retrieve_message_batch` ·
`anthropic_retrieve_message_batch_results`

Same economics as OpenAI batch: for bulk classification or extraction, batch instead of looping.

## Files

`anthropic_upload_file` · `anthropic_list_files` · `anthropic_get_file_metadata` ·
`anthropic_download_file` · `anthropic_delete_file`

## Agents and sessions

`anthropic_create_agent` · `anthropic_list_agents` · `anthropic_create_environment` ·
`anthropic_list_environments` · `anthropic_list_sessions` · `anthropic_retrieve_session` ·
`anthropic_list_session_events` · `anthropic_list_session_thread_events` ·
`anthropic_send_session_events`

This is the managed-agent surface: create an agent and environment, then drive it through session
events. Distinct from UnifyApps' own agents (`ai_agents_by_unifyapps`) — use the UnifyApps ones
when the agent should live in the platform with its own tasks, tools and knowledge.

## Gotchas

- Model ids move. Call `anthropic_list_models` or keep the id in a workflow variable rather than
  in twenty steps.
- Streaming actions return progressively; a downstream step that expects a single completed body
  must use the non-streaming variant.
