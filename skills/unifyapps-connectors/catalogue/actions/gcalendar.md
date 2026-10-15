# `gcalendar` — Google Calendar

21 resources: 20 ACTION, 1 TRIGGER. 247 connections on UAT. OAuth, with a `scopes` multi-select at
authorize time.

## Events

| Action | Note |
|---|---|
| `gcalendar_create_event` · `gcalendar_create_all_day_event` | |
| `gcalendar_update_event` · `gcalendar_delete_event` | |
| `gcalendar_get_event_by_id` | |
| `gcalendar_list_events` · `gcalendar_search_events` | list by range, search by text |
| `gcalendar_list_recurring_event_instances` | expand a recurring series |
| `gcalendar_add_attendees_to_event` · `gcalendar_delete_attendees_from_event` | |
| `gcalendar_download_attachments` | |
| `gcalendar_list_meetings` | events that have conferencing attached |

## Calendars and availability

`gcalendar_list_calendars` · `gcalendar_get_calendar_by_id` · `gcalendar_create_calendar` ·
`gcalendar_get_calendar_permissions` · `gcalendar_freebusy_calendar` · `gcalendar_watch_events`

`gcalendar_freebusy_calendar` is the right call for "when is this person free" — it needs only
free/busy access, not read access to event contents.

## Tasks

`gcalendar_create_task` · `gcalendar_update_task`

## Trigger

- `gcalendar_on_event_changes` — created, updated or deleted

## Gotchas

- Creating an event with attendees **sends invitations**. That is an outward-facing action: confirm
  the attendee list with the user before the step runs for real.
- Times are timezone-sensitive and the API is unforgiving. Always send an explicit IANA timezone
  rather than relying on the calendar default.
- Per-user connector: in an agent, leave `connectionId` unset so each user's own calendar is used.
