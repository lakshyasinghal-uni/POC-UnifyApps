# `gsheets` — Google Sheets

28 resources: 26 ACTION, 2 TRIGGER. 392 connections on UAT. OAuth.

## Rows — the ones you will actually use

| Action | Note |
|---|---|
| `gsheets_add_row` · `gsheets_add_row_v2` | prefer `_v2` |
| `gsheets_add_multiple_row` | one call for many rows — use it inside a loop's *place*, not inside the loop |
| `gsheets_get_rows_batch` · `gsheets_search_rows_batch` | read many |
| `gsheets_update_row` · `gsheets_update_rows_batch` | |
| `gsheets_delete_row` · `gsheets_clear_rows` | delete removes the row, clear empties it and keeps the position |
| `gsheets_run_query` | query the sheet like a table — the cheapest way to filter server-side |

## Spreadsheets and sheets

`gsheets_create_spreadsheet` · `gsheets_update_spreadsheet` · `gsheets_list_spreadsheets` ·
`gsheets_get_spreadsheets_from_drive` · `gsheets_get_spreadsheet_metadata` ·
`gsheets_get_spreadsheet_value` · `gsheets_get_spreadsheet_grid_data` · `gsheets_create_sheet` ·
`gsheets_copy_sheet` · `gsheets_list_sheets` · `gsheets_get_sheet_details` · `gsheets_get_metadata` ·
`gsheets_create_spreadsheet_column` · `gsheets_get_pivot_table_data` · `gsheets_download_sheet` ·
`gsheets_list_file_permission`

## Triggers

- `gsheet_on_new_row_polling` — note the **singular** `gsheet_` prefix
- `gsheet_on_new_row_polling_team_drive` — the same for a shared drive

## Gotchas

- The trigger prefix (`gsheet_`) differs from the action prefix (`gsheets_`). Copying a name by
  pattern will fail; take it from `/resources`.
- A sheet is not a database. Past a few thousand rows, use an Object
  (`storage_by_unifyapps`) or a real database and keep the sheet as a view.
- `gsheets_run_query` beats pulling all rows and filtering in a Code step, both for time and for
  the run's memory footprint.
