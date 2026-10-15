# `gdrive` — Google Drive

30 resources: 26 ACTION, 4 TRIGGER. 285 connections on UAT. OAuth; Drive defaults to the **full
`drive` scope** — for enforced read-only, build a custom OAUTH connector with `*.readonly` scopes.

## Files

| Action | Note |
|---|---|
| `gdrive_list_files` · `gdrive_search_file` | list takes filters, search takes a query |
| `gdrive_get_file` · `gdrive_get_file_details` | metadata |
| `gdrive_upload_files` · `gdrive_replace_file` | upload is create-new; replace keeps the file id and version history |
| `gdrive_download_file` · `gdrive_download_file_using_link` | by id, or by a share link |
| `gdrive_get_file_base64` · `gdrive_download_file_base64_using_link` | inline bytes for a later step |
| `gdrive_copy_file` · `gdrive_move_file` · `gdrive_rename_file` · `gdrive_delete_file` | |
| `gdrive_create_folder` | |
| `gdrive_export_file` | Google-native → PDF, DOCX, CSV |
| `gdrive_export_html_to_google_doc` | HTML → a real Google Doc |

## Permissions

`gdrive_create_file_permission` · `gdrive_get_file_permission` · `gdrive_list_file_permission` ·
`gdrive_update_permission` · `gdrive_remove_permission`

Sharing a file changes who can see it. Treat every permission write as an outward-facing action —
confirm the recipient with the user first.

## Drives and change tracking

`gdrive_list_drives` · `gdrive_get_drive_details` · `gdrive_get_changes_start_page_token` ·
`gdrive_list_changes`

The change-token pair is the correct way to sync a large Drive: take a start token once, then poll
`list_changes`. Listing all files repeatedly does not scale.

## Triggers

- `gdrive_on_create_file`
- `gdrive_on_new_uploaded_file_polling`
- `gdrive_on_uploaded_or_modified_file_polling`
- `gdrive_on_changes`

## Gotchas

- Google-native files (Docs, Sheets, Slides) have no bytes to download — use `gdrive_export_file`
  with a target MIME type, or the `gdocs` / `gsheets` connectors.
- Shared-drive files need the connection's account to be a member of that shared drive; a personal
  OAuth connection silently sees nothing rather than erroring.
