---
name: connect-accounts
description: Connect an outside account so the employee can work in it directly — ads, email, YouTube, analytics. Use when the owner wants to connect something, or a skill said a connection was needed first.
---

# Connect an Account

> **Read this first.** Right now the employee writes things and the owner posts them. Connecting an account removes that step for one tool. It takes 10–30 minutes per tool and it's a one-time job.

## Read first

- The skill that sent the owner here, so you know exactly which capability is needed
- `docs/skills-connections-and-updates.md`

Never read a secret file, keychain, cookie store, or token value to discover
whether something is connected. Use live tool discovery and the service's
connection status instead.

## Steps

1. Ask what they're trying to stop doing by hand. Connect that one thing. Connecting everything on a Saturday is how people end up with five half-connected tools.

2. Prefer the provider's official OAuth or app connection. Tell them what the
   requested connection can read or change before they sign in. If a service
   genuinely requires a developer credential, use its secure local or hosted
   secret setup; never put the value in a tracked file or chat.

3. Walk them through it **one step at a time**. Wait for "done" before the next step. Never send a numbered list of eight steps — they'll get lost on step three and blame themselves.

4. Credentials:
   - The owner completes sign-in in the provider's own browser or secure prompt.
   - Never ask them to paste a password, token, cookie, or secret into chat.
   - Never inspect or repeat a secret value. Record only connection status and capability.
   - If a credential appears in chat or a tracked file, stop, revoke it, and replace it through the provider.

5. Test it before saying it's connected. Do the smallest real thing — read one number, list one campaign, load one video title. Show them the result. A connection nobody tested isn't a connection.

6. Write down what got connected in `context/business.md` under a **Connected tools** heading: the tool, the owner/account label they recognize, what it can now do, and the date. Never record a credential or opaque tenant identifier.

## Save it

`content/YYYY-MM-DD-connected-<tool>.md` — what was connected, what it can now do, and how to disconnect it if they change their mind.

## Done when

- One tool is connected and a real test came back with real data.
- No credential value was read, copied, or stored in the repository.
- `context/business.md` lists the tool under Connected tools.
