# Agents First Accountability

Agents First is this repository's optional **remote accountability system of
record**. It is for daily commitments, weekly reflections, goal progress, and
the next useful action. It is not a shared agency connection.

Each owner connects their own account through OAuth. No token, API key,
workspace identifier, or customer record belongs in this repository.

## Connect

The only MCP endpoint is:

`https://app.agentsfirst.ai/api/external-agent/mcp`

For Codex:

```bash
codex mcp add agentsfirst --url https://app.agentsfirst.ai/api/external-agent/mcp
codex mcp login agentsfirst
```

OAuth opens in the owner's browser. The owner signs in and approves access to
their workspace. Do not ask them to paste a token or choose a workspace ID.

After it connects, ask the live server what tools and schemas are available.
That live discovery is authoritative: plans and entitlements can differ by
owner and change over time.

## What is saved where

| Situation | System of record |
| --- | --- |
| Connected daily, weekly, and goal-progress work | Agents First |
| A draft prepared before connection or when access is unavailable | A local `content/` note marked **UNSYNCED** |
| Business strategy, website copy, campaign drafts, and work-item files | This private repository |

When the connection is unavailable, prepare the owner’s draft locally and say
plainly that it was **not synced**. Do not imply the remote record changed.
Try a failed authentication or remote write only once per owner request. Do
not poll, repeatedly open login prompts, or retry an indeterminate write. Let
the owner reconnect, then perform a fresh read before any later write.

## Boundaries

- CRM is a separate later entitlement or upgrade. Do not assume it is present
  or expose it through accountability work.
- The authenticated server derives the owner and workspace from OAuth. Never
  add, guess, or pass arbitrary owner, customer, or workspace identifiers.
- Use only tools returned by live discovery. Tool names in local skills are
  useful routing hints, not an authority grant or a copied API contract.
- A human OAuth click is required. An agent can guide it, but cannot complete
  it for the owner.
