# `amazon_s3` — Amazon S3

15 resources: 13 ACTION, 2 TRIGGER. 21 connections on UAT.

## Files

| Action | Note |
|---|---|
| `amazon_s3_upload_file` | |
| `amazon_s3_download_file_content` · `amazon_s3_get_raw_file` | content vs raw bytes |
| `amazon_s3_read_file_content` | read without materialising a file |
| `amazon_s3_copy_file` · `amazon_s3_delete_file` | |
| `amazon_s3_list_files_in_bucket_batch` | paged listing |
| `amazon_s3_get_head_file` | metadata only — size, type, existence check |
| `amazon_s3_get_file_acl` | |
| `amazon_s3_generate_presigned_url` | hand a file to a user or an external system without credentials |

## Buckets

`amazon_s3_create_bucket` · `amazon_s3_fetch_bucket_names` · `amazon_s3_get_bucket_region`

## Triggers

- `amazon_s3_on_new_file_realtime` — event-driven, needs S3 notifications configured
- `amazon_s3_on_new_file_polling` — polls a prefix

## Gotchas

- `generate_presigned_url` creates a URL that grants access to anyone holding it. Treat it as
  publishing: short expiry, and never post one into a channel or email without the user asking.
- Use `get_head_file` for existence checks — downloading a large object just to see whether it
  exists is a common and expensive mistake.

## Related storage connectors

`azure_blob` (10) · `azure_datalake_storage` · `gcloud_storage` (13) · `sftp` (13) · `ftp` ·
`smbj` (Windows shares) · `dropbox` (20) · `box` (28) · `microsoft_onedrive` (53) ·
`microsoft_sharepoint` (62) · `gdrive` (30), plus the platform's own
`storage_by_unifyapps` and `files_by_unifyapps`.
