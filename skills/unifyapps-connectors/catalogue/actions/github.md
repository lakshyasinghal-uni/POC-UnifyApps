# `github` — GitHub

58 resources: **44 ACTION, 12 TRIGGER, 2 AGENT_TOOL** — the only connector on UAT that ships
agent tools. 73 connections. OAuth (`refreshable: true`); connection inputs `name`,
`connectionType`, `authType`, `hostname` (set `hostname` for GitHub Enterprise).

## Repository content

| Action | Note |
|---|---|
| `github_get_file_content` · `github_get_raw_file_content` | decoded vs raw bytes |
| `github_get_directory_content` | |
| `github_create_file_in_repository` · `github_update_file_in_repository` | the simple path: one file, one commit |
| `github_iterate_repo_files_loop` · `github_iterate_all_files` (TRIGGER) | walk a repo |
| `github_list_repositories` · `github_fetch_repositories` · `github_get_repository` · `github_create_repository` | |
| `github_list_branches` | |

## Git data API — multi-file commits

`github_get_reference` → `github_create_blob` → `github_create_tree` → `github_create_commit` →
`github_update_reference`, plus `github_create_reference` and `github_delete_reference`.

This is the sequence for committing several files atomically; the single-file actions above cannot
do it. `github_get_reference` takes a ref like `heads/main`. The connector's `owner` input is the
plain login (`mmaheranwar`), not `username:token`.

## Commits and comparison

`github_list_commits` · `github_get_commit` · `github_get_commit_diff` · `github_compare_commits` ·
`github_list_commit_statuses_for_ref` · `github_get_tree`

## Pull requests

`github_create_pull_request` · `github_get_pull_request` · `github_list_pull_requests` ·
`github_list_pr_commits` · `github_list_pull_request_files` ·
`github_create_pull_request_review_comment`

## Issues

`github_create_issue` · `github_update_issue` · `github_get_issue` · `github_create_issue_comment` ·
`github_search_issues_and_pull_requests` · `github_fetch_labels` · `github_fetch_milestones`

## Actions / CI

`github_trigger_workflow` · `github_list_workflow_runs` · `github_get_workflow_run`

## People

`github_get_user` · `github_fetch_organizations` · `github_list_repository_collaborators` ·
`github_list_collaborators_with_emails`

## Agent tools

- `github_tools_get_file_modified_details` **AGENT_TOOL**
- `github_tools_list_collaborators` **AGENT_TOOL**

Use these directly in an agent instead of wrapping an ACTION in a workflow — they are already
shaped for a model to call.

## Triggers (12)

`github_on_new_or_updated_pr` · `github_on_new_pr_polling` · `github_on_new_commits_pushed` ·
`github_on_new_or_updated_issue` · `github_on_new_issue_polling` · `github_on_closed_issue_polling` ·
`github_on_new_or_updated_comment` · `github_on_new_or_updated_pull_request_review` ·
`github_on_new_or_updated_pull_request_review_comment` ·
`github_on_new_or_updated_pull_request_review_thread` · `github_new_or_updated_milestone` ·
`github_iterate_all_files`

## Gotchas

- Writing to a repo from a UnifyApps **app page** does not work directly — the browser has no
  GitHub credentials. Call a callable workflow that uses this connector instead.
- Creating a PR, an issue or a comment is outward-facing and visible to a whole team. Confirm
  before the first real run.
