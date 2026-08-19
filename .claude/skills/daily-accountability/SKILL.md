---
name: daily-accountability
description: Use when an owner wants a daily accountability check-in, today’s commitments, or help recording what happened today.
---

# Daily Accountability

Read `connections/agentsfirst.md`. If the owner is connected, Agents First is
the source of record for the check-in.

1. Discover the live tools and schemas first.
2. If available, use `lookup_today` to understand the owner's current
   commitments; do not supply an owner, workspace, or client identifier.
3. Ask for the smallest honest update: what moved, what is blocked, and the
   one next commitment.
4. If the discovered contract permits it, record the update with
   `log_daily_entry`. Report the returned result, not an assumed save.

If the connection or write tool is unavailable, save the proposed entry as
`content/YYYY-MM-DD-daily-accountability.md` with `Status: UNSYNCED` at the
top. Tell the owner it is a local draft, not an Agents First update.

Keep CRM, sales records, and provider actions out of this check-in unless a
separately connected tool explicitly makes them available.
