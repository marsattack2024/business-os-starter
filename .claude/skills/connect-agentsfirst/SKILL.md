---
name: connect-agentsfirst
description: Use when an owner wants to connect their Agents First accountability account to Codex or another MCP client.
---

# Connect Agents First

Connect one owner's own accountability account. Read
`connections/agentsfirst.md` first.

Use only:

```bash
codex mcp add agentsfirst --url https://app.agentsfirst.ai/api/external-agent/mcp
codex mcp login agentsfirst
```

The owner completes OAuth in their browser. Never request, read, store, or
commit a token, key, workspace ID, or customer ID. Do not substitute another
MCP endpoint.

After the owner confirms authorization, inspect the live tool list and use
only the tools and schemas actually returned for that owner. Record a short
status note in `content/YYYY-MM-DD-agentsfirst-connection.md` without secrets:
connected, needs authorization, or unavailable.

If authorization fails or is canceled, stop after that attempt. Do not loop,
poll, or keep reopening the browser. Explain the single next action and let
the owner ask to resume.

## Done when

- The owner has completed OAuth for their workspace.
- Live tool discovery succeeded, or the exact blocker is recorded.
- No credentials or identifiers were copied into this repository.
