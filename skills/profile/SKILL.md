---
name: profile
description: >
  This skill should be used when the user asks to "create a demo profile", "set up a client
  profile for <client>", "update the profile for <client>", "remember this about <client>'s
  demos", or types /poc-studio:profile followed by a client name and details. It writes or
  edits the one file the build skill reads so that later demos for that client need no
  clarifying questions.
metadata:
  version: "0.1.0"
---

# Demo Studio: profile

Write or update `studio/profiles/<client-slug>.md` in the working folder, in the shape of the
build skill's [profile template](../build/references/profile-template.md). The profile is the
Stand-in's memory of the client: every line it holds is a question the build never has to ask.

## Steps

1. Read the template at `${CLAUDE_PLUGIN_ROOT}/skills/build/references/profile-template.md`.
2. Slug the client name (lowercase, hyphens). If `studio/profiles/<slug>.md` exists, read it;
   this is an edit, and lines the request does not mention stay as they are.
3. Fill every line the request gives. For a new profile, fill the rest from the template's
   defaults table and set `status: drafted by Studio on <date>`; when the person gave every
   line that matters (client, audience, show off, tenant), set `status: confirmed`.
4. When a runbook exists for this client in the working folder, read its
   `Decisions taken for you` list and add each suggested line the request does not contradict,
   so the next build has fewer decisions to take.
5. Write the file. Say in three lines or fewer what the profile now holds and which lines are
   still defaults. Do not ask for the missing lines: a default is a line too, and the build
   skill shows which defaults it used.

## Rules

- Never store a password, a cookie or an API key in a profile. A credential line names where
  one lives, never its value.
- The `tenant` line never names a production host; Nebula blocks production in code and a
  profile does not change that.
- One client, one file. A second product line for the same client is a `notes` line, not a
  second profile.
