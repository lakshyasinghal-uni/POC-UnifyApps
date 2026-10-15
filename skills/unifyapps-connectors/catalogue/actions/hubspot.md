# `hubspot` — HubSpot CRM

106 resources: 100 ACTION, 6 TRIGGER (1 tenant-local custom action `hubspot:69578b47…`). OAuth
(`refreshable: true`) — the user must click Authorize. Connection inputs: `name`, `authType`.
Docs: `https://www.unifyapps.com/docs/unify-integrations/hubspot`. Verified on UAT 2026-09-25
against the read-only connection `UnifyApps Prod (Read Only)` `6766cf092cf95248b9d66cbf`
(portal 143913151, EU). **That connection is read-only by policy — never wire a write action to it.**

## Read records — start here

| Action | Note |
|---|---|
| `hubspot_search_records_batch` | **the workhorse.** `object` (`deals` / `companies` / `contacts` / `meetings` …), `properties[]`, `filterGroups[{filters[{propertyName, operator, value | values | highValue}]}]`, `sorts[{propertyName, direction}]`, `limit` (≤ 100), `after`. Outputs `results[]`, `total`, `paging.next.after` (the offset as a string). Filters in one group AND; groups OR. Operators: EQ NEQ LT LTE GT GTE CONTAINS_TOKEN NOT_CONTAINS HAS_PROPERTY NOT_HAS_PROPERTY BETWEEN IN NOT_IN (`CONTAINS` is rejected). `hs_object_id IN [...]` reads a batch by id. |
| `hubspot_get_deal` · `hubspot_get_company` · `hubspot_get_contact` · `hubspot_get_ticket` · `hubspot_get_product` · `hubspot_get_line_item` | one record; `get_deal` takes `properties[]` and `propertiesWithHistory[]` (value/timestamp/sourceType per change — works for custom single-selects) |
| `hubspot_list_deals` · `hubspot_list_companies` · `hubspot_list_contacts` · `hubspot_list_tickets` · `hubspot_list_notes` · `hubspot_list_tasks` · `hubspot_list_calls` · `hubspot_list_meetings` · `hubspot_list_emails` | unfiltered paging; prefer `search_records_batch` |
| `hubspot_get_contact_by_email` · `hubspot_search_companies_by_domain` · `hubspot_fetch_companies_lookup` · `hubspot_get_company_contacts` · `hubspot_get_contacts_in_contacts_list` · `hubspot_get_list_contacts` | lookups |

**No "list properties" action exists.** Discover a custom property by requesting it by name: a
property with a value comes back, a null-valued property is **dropped from `properties`**, an
unknown name is ignored silently. Absence ≠ nonexistence — probe records known to carry values.

## Pipelines, owners, users

| Action | Note |
|---|---|
| `hubspot_get_pipelines` | `{objectType:'deals'}` → `results[] {id,label,stages[{id,label,displayOrder,metadata.isClosed}]}`; `isClosed` is the **string** `"true"`. Resolve at runtime — stage ids in a portal can be renamed and recycled. |
| `hubspot_get_pipeline_stage_details` · `hubspot_search_pipeline_stages` | one stage |
| `hubspot_get_owners` | `{}` → `results[] {id,firstName,lastName,email,teams[],userId}` — **active owners only** (schema says `owners`, payload says `results`) |
| `hubspot_get_owner_by_id` | `{ownerId:int}`. A deactivated owner answers HTTP 404 (`x-hubspot-notfound`) and **fails the node and the run** — do not use it to resolve historical ids; keep the raw id instead |
| `hubspot_get_owner_by_email` · `hubspot_fetch_owners` (v1) | |
| `hubspot_get_user` · `hubspot_read_user` · `hubspot_list_users` · `hubspot_list_account_users` · `hubspot_get_account_details` · `hubspot_get_resource_permissions` · `hubspot_get_daily_api_usage` | account |

## Associations

| Action | Note |
|---|---|
| `hubspot_get_association_batch` | `{fromObjectType:'deals', toObjectType:'companies', inputs:[{id}]}` → `results[{from:{id}, to:[{toObjectId}]}]`. Send at least one id (`['0']` when the list is empty). |
| `hubspot_get_associations` | v3 single |
| `hubspot_association_records` · `hubspot_association_records_label` · `hubspot_delete_batch_associations` | **writes** |

## Writes (forbidden on a read-only connection; none may ever touch `6766cf092cf95248b9d66cbf`)

`hubspot_create_deal` · `_deal_batch` · `_company` · `_company_batch` · `_contact` · `_contact_batch` ·
`_ticket` · `_ticket_batch` · `_product` · `_line_item` · `_line_items_batch` · `_engagement` ·
`_form` · `_form_submission` · `_folder` · `hubspot_update_deal` · `_deal_batch` · `_company` ·
`_company_batch` · `_contact` · `_contact_batch` · `_ticket` · `_ticket_batch` · `_product` ·
`_product_batch` · `_line_item` · `_line_item_batch` · `hubspot_delete_contact` ·
`hubspot_add_contact_to_list` · `hubspot_remove_contact_from_list` · `hubspot_add_contact_to_workflow` ·
`hubspot_remove_email_subscription` · `hubspot_single_send_email_template`. A builder script should
refuse `/create|update|delete|archive|merge|associat|upsert|remove|add_|send/` on the read-only connection.

## Engagements, conversations, marketing, files, analytics

`hubspot_list_deal_meetings` · `hubspot_get_meeting_details` · `hubspot_get_email` ·
`hubspot_get_specific_email` · `hubspot_list_marketing_emails` · `hubspot_get_events` ·
`hubspot_get_event_by_id` · `hubspot_list_inboxes` · `hubspot_list_channels` · `hubspot_get_channel` ·
`hubspot_list_channel_accounts` · `hubspot_get_channel_account` · `hubspot_list_threads` ·
`hubspot_get_thread` · `hubspot_list_thread_messages` · `hubspot_get_thread_message` ·
`hubspot_get_file` · `hubspot_get_file_public_url` · `hubspot_search_file` · `hubspot_get_folder` ·
`hubspot_search_folder` · `hubspot_export_data_file` · `hubspot_get_data_for_hosted_content` ·
`hubspot_get_all_analytics_views` · `hubspot_get_analytics_data_for_specific_objects`.

## Triggers (6)

`hubspot_on_event` (connector subscription) · `hubspot_on_new_record_polling` ·
`hubspot_new_contact_polling` · `hubspot_new_contact_in_contact_list_polling` ·
`hubspot_new_form_submission_polling` · `hubspot_get_marketing_emails_polling`. There is no
"record updated" trigger — poll `hs_lastmodifieddate` with a search.

## Gotchas

- **Dates are asymmetric**: filter with epoch-millisecond **strings** (`closedate BETWEEN value/highValue`);
  results come back as ISO strings.
- **Empty properties are omitted** from `results[].properties`; a `""` is rarely stored.
- `paging.next.after` is the offset as a string (`"100"`); absent on the last page.
- Rate limit headers on every response: `x-hubspot-ratelimit-max: 190` per
  `x-hubspot-ratelimit-interval-milliseconds: 10000`, `x-hubspot-ratelimit-daily: 1000000`. Batch
  reads (search with `IN`, `get_association_batch`) instead of per-record loops.
- Portal-specific rules (stage map, fiscal quarters, SC fields `sc_on_this_deal`, `poc`,
  `technical_win`, `technical_win_notes`, `use_case`, `uc_template`) live in the platform skill
  `hubspot-crm-operator-sc` (`e_skill_ai_agent` `e_6aaa4c0b992160713aebb310`) — read it from the
  tenant, not from a copy.
