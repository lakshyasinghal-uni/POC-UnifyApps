AccessLint skills installed 2026-09-24 from https://github.com/AccessLint/skills (plugins/accesslint, MIT, v0.10.3):
accessibility-audit, accessibility-diff, accessibility-fix, accessibility-inspect, accessibility-scan + this `shared/` folder
(methodology.md, referenced as ../shared/ by each skill — keep the folder name). scan/diff shell out to `npx @accesslint/cli`;
fix (and audit/inspect rule metadata) need the MCP server: {"mcpServers":{"accesslint":{"command":"npx","args":["-y","@accesslint/mcp@latest"]}}}.
