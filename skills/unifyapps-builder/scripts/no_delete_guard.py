#!/usr/bin/env python3
"""
no-delete-guard: Claude Code PreToolUse hook.

Blocks any tool call that would DELETE a resource: UnifyApps delete endpoints and
storage delete nodes, HTTP DELETE, soft-delete flags, SQL DELETE/DROP/TRUNCATE,
Oracle EBS DELETE_* APIs, and git/GitHub branch or repo deletion.

Why: the UnifyApps skills run against shared tenants. Nothing they build may ever
remove a resource, not even one the skill created. Soft-delete (a status/archived
flag) or leave it and tell the user.

How it is wired (settings.json):
  "hooks": { "PreToolUse": [ { "matcher": "Bash|PowerShell|mcp__.*javascript_tool|mcp__.*browser_batch",
              "hooks": [ { "type": "command", "command": "python \"<path>/no-delete-guard.py\"" } ] } ] }

Protocol: stdin = {"tool_name", "tool_input", ...}. Exit 0 = allow. Exit 2 = block;
stderr is shown to the model as the reason. Any internal error fails CLOSED (blocks),
because a guard that silently allows on error is not a guard.

Author: Maher. Ships with every UnifyApps skill (scripts/no_delete_guard.py) and lives
in ${CLAUDE_PLUGIN_ROOT}/hooks/. Keep the copies identical.
"""
import json
import os
import re
import sys

# Each entry: (compiled regex, human label). Case-insensitive throughout.
PATTERNS = [
    # --- HTTP DELETE, in any client ---
    (r"""\bmethod\s*[:=]\s*['"`]?\s*DELETE\b""", "HTTP DELETE method"),
    (r"""\bua\s*\(\s*['"`]DELETE['"`]""", "HTTP DELETE via the ua() helper"),
    (r"""\bfetch\s*\([^)]*['"`]DELETE['"`]""", "HTTP DELETE via fetch()"),
    (r"""(?:^|\s)(?:-X|--request)\s*['"]?DELETE\b""", "curl -X DELETE"),
    (r"""-Method\s*['"]?Delete\b""", "Invoke-RestMethod -Method Delete"),
    (r"""\brequests\.delete\s*\(""", "requests.delete()"),
    (r"""\b(?:axios|http|client|session|api)\.delete\s*\(""", "client.delete()"),
    (r"""\bgh\s+api\b[^\n]*(?:-X|--method)\s*DELETE\b""", "gh api DELETE"),
    # --- UnifyApps delete endpoints (platform is POST-heavy; deletes are POST .../delete/...) ---
    (r"""/api/[^\s'"`]*?/delete(?:/|\b)""", "UnifyApps /delete endpoint"),
    (r"""/api/entity/action/delete\b""", "entity action delete"),
    (r"""\brequestType\s*[:=]\s*['"`]DELETED['"`]""", "hierarchical entity requestType DELETED"),
    (r"""/agent-api/sessions/[^\s'"`]+/branches/[^\s'"`]+""", "code-app session branch endpoint (only DELETE exists on this path)"),
    # --- Soft-delete flag ---
    (r"""['"`]?\bdeleted\b['"`]?\s*[:=]\s*true\b""", "deleted: true (irreversible soft delete)"),
    # --- Storage / connector delete actions used in workflows, data sources, agent tools ---
    (r"""\b\w*_delete_(?:records?|record_by_id|rows?|rows_in_batch|record_by_ids?)\b""", "storage/connector delete action"),
    (r"""\bdelete_records?\b""", "delete_record(s) action"),
    (r"""\bnumberOfRecordsToDelete\b""", "delete_records payload"),
    (r"""\b\w+_(?:delete|remove|purge|destroy)_\w+\b""", "connector delete/remove action"),
    # --- SQL ---
    (r"""\bDELETE\s+FROM\b""", "SQL DELETE"),
    (r"""\bDROP\s+(?:TABLE|SCHEMA|DATABASE|INDEX|VIEW|SEQUENCE|USER|PROCEDURE|PACKAGE|FUNCTION|TRIGGER)\b""", "SQL DROP"),
    (r"""\bTRUNCATE\s+TABLE\b""", "SQL TRUNCATE"),
    # --- Oracle EBS seeded delete APIs ---
    (r"""\b[A-Z0-9_]+_API\.DELETE_[A-Z0-9_]+\b""", "Oracle EBS DELETE_* API"),
    (r"""\bDELETE_(?:PERSON_ABSENCE|CONTACT_RELATIONSHIP|POSITION|ELEMENT_ENTRY|PHONE|PERSON_ADDRESS|EMPLOYEE|ASSIGNMENT|VENDOR)\b""", "Oracle EBS DELETE_* API"),
    # --- git / GitHub destruction ---
    (r"""\bgit\s+branch\s+(?:-[a-zA-Z]*[dD]|--delete)\b""", "git branch delete"),
    (r"""\bgit\s+push\b[^\n]*(?:--delete|\s:[A-Za-z0-9_./-]+)""", "git push delete"),
    (r"""\bgh\s+(?:repo|release|pr|issue)\s+delete\b""", "gh delete"),
]
COMPILED = [(re.compile(p, re.IGNORECASE | re.MULTILINE), label) for p, label in PATTERNS]

SCRIPT_EXT = (".py", ".js", ".mjs", ".cjs", ".ts", ".ps1", ".sh", ".sql", ".groovy")
RUNNERS = re.compile(r"""\b(?:python3?|node|bun|deno|pwsh|powershell|bash|sh|sqlplus|sql)\b""", re.IGNORECASE)


def collect_text(obj):
    """Flatten every string in tool_input into one blob."""
    out = []
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            out.extend(collect_text(v))
    elif isinstance(obj, list):
        for v in obj:
            out.extend(collect_text(v))
    return out


def referenced_script_files(command):
    """If a shell command runs a script file, return its contents so the guard can scan
    what will actually execute; a delete hidden in a .py/.js file is still a delete."""
    texts = []
    if not RUNNERS.search(command):
        return texts
    for token in re.findall(r"""["']?([^\s"'|;&<>]+)["']?""", command):
        if token.lower().endswith(SCRIPT_EXT) and os.path.isfile(token):
            try:
                with open(token, "r", encoding="utf-8", errors="replace") as fh:
                    content = fh.read(2_000_000)
                if "no-delete-guard: Claude Code PreToolUse hook" in content:
                    continue  # the guard's own source lists every pattern; running it is not a delete
                texts.append(content)
            except OSError:
                pass
    return texts


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except Exception as exc:  # fail closed
        sys.stderr.write(f"no-delete-guard: could not parse hook input ({exc}); blocking.\n")
        return 2

    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})
    texts = collect_text(tool_input)
    if tool in ("Bash", "PowerShell"):
        cmd = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
        texts.extend(referenced_script_files(cmd))
    blob = "\n".join(texts)
    # The guard's own name must not trip the connector *_delete_* pattern.
    blob = re.sub(r"no[-_]delete[-_]guard", "guard", blob, flags=re.IGNORECASE)

    hits = []
    for rx, label in COMPILED:
        m = rx.search(blob)
        if m:
            snippet = (blob[max(0, m.start() - 40): m.end() + 40].replace("\n", " ")
                       .encode("ascii", "replace").decode())
            hits.append(f"  - {label}: ...{snippet}...")

    if hits:
        sys.stderr.write(
            "BLOCKED by no-delete-guard: deleting resources is forbidden for users of these skills.\n"
            f"Tool: {tool}\nMatched:\n" + "\n".join(hits) + "\n"
            "Do not retry or rephrase this call. Soft-delete instead (status / archived / enabled=false),\n"
            "or leave the resource in place and tell the user exactly what would need removing so they\n"
            "can do it themselves in the console.\n"
        )
        return 2
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # fail closed
        sys.stderr.write(f"no-delete-guard: internal error ({exc}); blocking.\n")
        sys.exit(2)
