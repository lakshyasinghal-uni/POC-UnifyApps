---
name: connect
description: >
  This skill should be used when the user types /poc-studio:connect, asks to "connect POC Studio
  to Orbit", "set up my API key", "set up my token", "add my POC Studio token", "turn on Orbit
  write-back", or when setup or a build finds no working POC Studio API token. It sets up this
  computer once so every Claude session can write to the Orbit Studio objects through the Orbit
  Studio API: it checks for a token, tells the person how to get one and store it without
  pasting it into the chat, checks it against Orbit, and turns write-back on.
metadata:
  version: "0.5.0"
---

# POC Studio: connect to Orbit

POC Studio writes every POC, document, feedback ticket and event to Orbit through the **Orbit
Studio API**: automations hosted on Orbit and published in API Manager under the group
`orbit-studio`. Each person needs a token for it, set up once per computer. After that, every
Claude session on that computer uses it without asking.

All calls go through one script, which never prints the token:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/studio-api.mjs" <status | check | save | call>
```

Say one line at the start: `Connecting POC Studio to Orbit: checking for your API token.`

## The one rule

**The token never goes into the chat.** Never ask for it, never repeat it, never write it into
a file in the working folder, a memory, a commit, a Slack message or a document. The person
stores it themselves, in their own terminal, with the script's `save` command or an environment
variable.

If the person pastes a token into the chat anyway: do not repeat it, do not use it and do not
store it. Say in one line that it is now in this chat's history, so they should create a new
token (the steps below) and revoke this one, then carry on with step 2.

## 1. Is a token already set?

Run `status`, then `check`.

| Result | What to do |
|---|---|
| `check` ok | Say `Orbit write-back is on (token …<last 4>, from <source>).` Go to step 4. |
| `tokenSet: false` | Go to step 2. |
| `check` exit 2 (rejected) | Say the token from `<source>` was rejected by Orbit; it may have been revoked. Go to step 2. |
| `check` exit 3 (not reachable) | Say Orbit could not be reached from this session and give the error in one line. When this session runs in the cloud, say write-back needs Claude Code on their own computer (or the token set as an environment secret of the cloud environment), and stop. Otherwise ask them to check their network and run `/poc-studio:connect` again. |

## 2. Get a token

Ask one question, header `Token`: `Do you already have a POC Studio API token?`

- **Yes:** go to step 3.
- **No, someone gives them out:** say to ask whoever runs POC Studio for their team for a token
  for the **Orbit Studio API**, and to come back with `/poc-studio:connect`. Stop.
- **No, I can make one** (they have API Manager access on Orbit): give these steps, then go to
  step 3.
  1. In Orbit, open **API Manager → Clients → Orbit Studio · POC Studio plugin**.
  2. Click **New Access Profile**. Name it after yourself (for example `POC Studio · <your name>`),
     so each person's writes can be told apart and one token can be revoked on its own.
  3. Under **API Groups to include**, choose **Orbit Studio API**. Click **Next**.
  4. Authentication method **Auth Token**, token in header, key `api-token`, no prefix.
     Click **Create Access Profile**.
  5. Copy the token it shows. Keep it out of this chat.

## 3. Store the token on this computer

Give the person this command with the path filled in, and ask them to run it **in their own
terminal**, outside this chat:

```
node "<the full path of ${CLAUDE_PLUGIN_ROOT}>/scripts/studio-api.mjs" save
```

It asks for the token with the input hidden, checks it against Orbit, and only when Orbit accepts
it saves it to `~/.config/poc-studio/credentials.json`, readable only by them. Nothing is saved
when the check fails, and it says why.

Mention the other way in one line, for people who keep secrets in their shell: add
`export POC_STUDIO_API_TOKEN='<token>'` to `~/.zshrc` (or `~/.bashrc`) and open a new terminal
and Claude session. An environment variable wins over the saved file.

Then ask one question, header `Token`: `Done?` (`Saved it`, `I set the environment variable`,
`It failed`). On `It failed`, ask them to paste only the line the command printed (it never
contains the token), explain it, and help them try again.

## 4. Confirm and record

Run `check` again.

- **Ok:** write the settings without the token to `poc-studio.yml` in the working folder:
  ```yaml
  orbit:
    writeback: on
    api: <url from status>
    token_source: <environment | file>
    checked: <ISO date and time>
  ```
  Say: `Orbit write-back is on. Every Claude session on this computer will save your POCs to
  Orbit.`
- **Rejected or unreachable:** follow the table in step 1. Never set `writeback: on` without a
  passing `check`.

## For the skills that write

Any skill that writes to Orbit calls the API through the same script:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/studio-api.mjs" call <endpoint> @<file.json> [--debug]
```

Exit 0 is done (the endpoint's JSON is in `response`), 1 is an error from the endpoint, 2 means
no token or the token was rejected (run this skill), and 3 means Orbit was not reachable. With
`--debug` the request and response are printed, with the token hidden. Pass the body as a file
under the session's working folder, so a person's words never sit in a shell command.

Today the API has one endpoint, `log-activity`: it writes one `orbit_studio_activity` row
(`poc`, `type`, `actor_type`, `actor_name` and `message` required) and returns
`{ok, activity_id, poc}`.
