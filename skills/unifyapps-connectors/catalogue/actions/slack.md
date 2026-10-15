# `slack` — Slack

46 resources: 44 ACTION, 2 TRIGGER. 574 connections on UAT (third most used). OAuth
(`refreshable: true`) — the user must click Authorize. Connection inputs: `name`, `authType`,
`revokeTokenOnDelete`.

## Messages

| Action | Note |
|---|---|
| `slack_post_message_in_channel` | the workhorse |
| `slack_post_message_custom_block_kit` | rich layouts; pass Block Kit JSON |
| `slack_edit_message_in_channel` | needs the message `ts` |
| `slack_delete_message_in_channel` | |
| `slack_chat_get_permalink` | a stable URL to link from a ticket or email |
| `slack_send_file` · `slack_download_file` · `slack_get_file_details` | |
| `slack_reactions_add` · `slack_reactions_remove` | |
| `slack_pins_add` · `slack_pins_remove` · `slack_pins_list` | |

## Conversations and channels

`slack_list_conversations` · `slack_get_conversation` · `slack_list_conversation_history` ·
`slack_list_conversations_replies` · `slack_list_conversation_members` ·
`slack_list_user_conversations` · `slack_open_conversation` · `slack_conversations_create` ·
`slack_conversation_invite` · `slack_conversation_kick` · `slack_conversation_set_topic` ·
`slack_conversation_set_purpose` · `slack_archives_conversation` · `slack_conversation_unarchive` ·
`slack_list_canvases` · `slack_search_context`

## Users

`slack_list_users` · `slack_get_user_info` · `slack_get_user_info_by_email` ·
`slack_get_user_info_by_id` · `slack_get_user_info_by_name` · `slack_list_user_group_members` ·
`slack_create_user`

`slack_get_user_info_by_email` is the one that matters in practice: it maps a corporate email from
another system to a Slack user id so you can DM them.

## Interactivity

| Action | Note |
|---|---|
| `slack_open_view` | open a modal |
| `slack_on_button_click` **TRIGGER** | fires when someone clicks a Block Kit button |
| `slack_respond_to_button_click` | must run in the same flow to acknowledge, or Slack shows a timeout |

## Triggers

- `slack_on_new_message` — new message in a channel the app is in
- `slack_on_button_click` — interactive component clicked

## Gotchas

- Six resources on UAT are named `slack:<24-hex>` — custom actions added to this built-in
  connector with the Connectors SDK. They exist only on this tenant; do not reference one in a
  portable artefact.
- Posting to a private channel requires the app to be invited to it; the API returns a permission
  error, not an empty result.
- `slack_respond_to_button_click` is not optional if you triggered on a click — Slack expects an
  acknowledgement within seconds.
