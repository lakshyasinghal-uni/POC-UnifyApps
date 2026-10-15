# Contributing to POC Studio

## Install

```
claude plugin marketplace add lakshyasinghal-uni/POC-UnifyApps
claude plugin install poc-studio@poc-unifyapps
```

To get the latest version after a change is merged:

```
claude plugin marketplace update poc-unifyapps
claude plugin update poc-studio@poc-unifyapps
```

Then restart Claude Code.

## How a change gets in

1. Create a branch from `main`: `skill/<name>` for a new skill, `fix/<name>` for a fix.
2. Make the change. Skills live in `skills/<name>/SKILL.md`, agents in `agents/<name>.md`.
3. Bump the version in `.claude-plugin/plugin.json` and add a line to `CHANGELOG.md`.
4. Open a pull request. It needs one approval before merging.
5. Nobody pushes straight to `main`.

## Feedback on a skill

Skill feedback comes from POC runs. Anyone who saw a skill go wrong on a POC says so in the
chat or a gate thread; POC Studio records it as an Orbit feedback ticket with category
`skill`. The skill's owner reviews those tickets and adds each fix as a new scenario or rule
in the skill, with a CHANGELOG entry and a version bump, so the same case is handled next time.

## Taking updates from Demo Studio

This plugin started from Gourav Mahunta's Demo Studio. To bring in his later changes:

```
git remote add upstream https://github.com/gouravUnifyapps/DemoStudio-UnifyApps
git fetch upstream
git checkout -b sync/demo-studio
git merge upstream/main
```

The rename means `demo-studio:` references in his new files need changing to
`poc-studio:` before the pull request is merged.
