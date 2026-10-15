# Contributing to POC Studio

## Install

```
claude plugin marketplace add shubhankargarg-lang/POC-UnifyApps
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

Anyone who used a skill on a POC and saw it go wrong opens an issue with the
"Skill feedback" form. Each fix is a pull request that closes the issue and adds the
scenario to the skill, so the same case is handled next time.

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
