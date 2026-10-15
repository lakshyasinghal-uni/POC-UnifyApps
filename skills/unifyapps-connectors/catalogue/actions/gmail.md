# `gmail` — Gmail

33 resources: 25 ACTION, 8 TRIGGER. **965 connections on UAT** — the most-connected third-party
connector, almost all of them per-user. OAuth; connection inputs are just `name` and `authType`,
with a `scopes` multi-select at authorize time.

## Read

| Action | Note |
|---|---|
| `gmail_list_emails` | filters + paging |
| `gmail_find_email` | Gmail search syntax (`from:`, `has:attachment`, `newer_than:`) |
| `gmail_get_message` · `gmail_get_message_specifics` | one message; `_specifics` returns selected fields only |
| `gmail_get_thread` · `gmail_list_threads` | thread-level |
| `gmail_download_attachment` | |
| `gmail_list_signatures` | |
| `gmail_resolve_rfc822_message_id` | map an `Message-ID:` header to a Gmail id — the way to correlate with another mail system |

## Write

`gmail_send_email` · `gmail_reply_in_thread` · `gmail_forward_email` · `gmail_create_draft` ·
`gmail_create_draft_reply`

Prefer `gmail_reply_in_thread` over `gmail_send_email` when responding: it keeps the thread intact
for the recipient.

## Labels and cleanup

`gmail_create_label` · `gmail_add_labels` · `gmail_remove_labels` · `gmail_add_labels_bulk` ·
`gmail_remove_labels_bulk` · `gmail_delete_email` · `gmail_batch_delete_emails` ·
`gmail_delete_email_permanently`

⚠️ `gmail_delete_email_permanently` and `gmail_batch_delete_emails` are irreversible. Never wire
them into an automation without the user explicitly asking, and never as a cleanup step you thought
of yourself.

## History / sync

`gmail_watch_mailbox` · `gmail_get_current_history_id` · `gmail_list_mailbox_history`

The standard incremental-sync trio: watch, store the history id, then list what changed since it.
Cheaper and more reliable than repeatedly listing messages.

## Triggers (8)

| Trigger | Mechanism |
|---|---|
| `gmail_on_new_email_webhook` | push — near-instant |
| `gmail_on_new_email_polling` | poll |
| `gmail_on_new_thread_polling` | poll, thread-level |
| `gmail_on_new_email_matching_search` | poll, with a Gmail query |
| `gmail_on_new_reply_in_thread` | |
| `gmail_on_new_attachment` | |
| `gmail_on_new_starred_email_polling` | |
| `gmail_on_new_trash_email` | |

## Gotchas

- With 965 connections, "the Gmail connection" is meaningless — this is a per-user connector.
  In an agent, leave `connectionId` unset so each end user connects their own mailbox
  (`references/connections.md` §6). Never bind a shared workflow to one person's mailbox.
- Scopes are chosen at authorize time. A connection authorized for read-only will fail at send
  with a permission error, not a validation error.
