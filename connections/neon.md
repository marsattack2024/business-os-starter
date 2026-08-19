# Neon backend

Neon is Business OS's preferred backend when a proven application genuinely
needs structured relational runtime data or user accounts. Repository files
are already persistent private records; do not copy them into a database merely
for storage. Neon is not required for ordinary website edits, forms that can
stay local, or disposable prototypes.

Neon currently combines Postgres and Neon Auth on its Free plan. Other backend
primitives, including storage and functions, may be preview features or limited
by region. Recheck the current official documentation before selecting one.
Neon does not host the application's frontend.

Before using a free plan for regulated, confidential, health, financial, or
client data, verify its current security controls, recovery window, support,
availability, regional constraints, and contractual fit. Free is a price, not
a compliance or uptime guarantee.

## Connect safely

1. Start from the current [Neon CLI documentation](https://neon.com/cli). Do
   not copy a command from an old project or install an unreviewed global tool.
2. The owner completes the browser login and chooses their own account,
   organization, project, region, and plan.
3. Keep project linkage and environment files local and Git-ignored. Never ask
   the owner to paste a database URL, API key, cookie secret, or OAuth secret
   into chat, a skill, or a committed file.
4. Inspect or plan before applying. Creating a project or branch, provisioning
   Auth, changing a schema, applying a migration, or deleting a resource is a
   provider mutation and needs the owner's authorization for that named step.

## Prove the connection

Use the smallest read-only check that identifies the selected project and
branch without printing credentials. A live application is not proven until
its exact deployed revision can perform the intended data or authentication
journey and its rollback path is recorded.

Current source links:

- [Neon plans and Free limits](https://neon.com/pricing)
- [Neon Auth](https://neon.com/docs/auth/overview)
- [Neon CLI](https://neon.com/cli)
- [Neon agent guidance](https://neon.com/docs/ai/agent-skills)
