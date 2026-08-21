# Email draft — Maria Kazak Windows setup

To: Maria Kazak (mariakazak14@gmail.com)
From: Humberto
Status: draft — you send it
Goal: she finishes Windows pre-repo setup tonight, pastes this whole email into Codex, and replies with the READY FOR FRIDAY screenshot

---

Subject: Windows setup for Friday — paste this whole email into Codex

Maria — you're the Windows person in this cohort, so do not use the Mac commands from the other email. This is your version.

Friday is going to move fast. The people who finish this tonight will spend the workshop building instead of installing.

Plan on about 20 minutes of active attention. Downloads and account logins may take longer, so start now.

WATCH THE WALKTHROUGH FIRST

https://www.loom.com/share/f8a78222040642cf84721e70757e89f5

That video is on a Mac. Watch it for ChatGPT Pro checkout and the app settings. Ignore every Terminal command in the video. This email is the Windows version, and Codex will run the Windows commands.

IMPORTANT: AFTER YOU OPEN CODEX, COPY AND PASTE THIS ENTIRE EMAIL INTO IT. Do not copy the PowerShell commands one at a time. Codex should handle the command line, troubleshoot problems, maintain your checklist, and give you a final receipt. You only handle passwords, payment, account choices, browser sign-ins, OAuth, MFA, and any Windows “Allow” / User Account Control pop-ups.

YOUR FIRST FOUR STEPS

1. Download the newest ChatGPT desktop app for Windows and sign in with the account you will use Friday: https://chatgpt.com/download/

2. In ChatGPT, choose the $100 Pro option shown in the walkthrough. Complete checkout yourself. If that exact option is not available, do not buy a different plan; take a screenshot and send it to me.

3. Open Codex in the ChatGPT app. Create or select the empty folder C:\Users\<your-windows-username>\Documents\AI-Workspace. For this supervised setup, choose Full access and Never ask for approval. Keep automatic force-push off. Keep the agent on Windows native (not WSL) and the integrated terminal on PowerShell. Do not load a Git repository yet.

4. Copy and paste this entire email into Codex. From this point forward, Codex owns the technical setup below.

CODEX SETUP COMPANION — START HERE

You are the setup companion for a complete beginner on native Windows. Own PowerShell from start to finish: inspect, install, repair, verify, and continue without asking the participant to paste commands or approve each routine step. Keep explanations short and keep the live checklist current.

This is a Windows machine. Do not install, enable, or switch to WSL, WSL2, Git Bash as the agent environment, Homebrew, or macOS/Linux installers. Run in Windows PowerShell. After any PATH, nvm, or winget change, prove the result in a fresh PowerShell window.

The participant handles only passwords, purchases, account choices, browser sign-ins, OAuth, MFA, and Windows User Account Control / “Allow” prompts. When needed, give one exact action, wait, verify it, and resume. Continue independent items around any blocker. Never read, print, search for, or reuse secrets or credentials.

Keep this live checklist visible and update ⬜ to 🟨, ✅, or ❌ as you work:

⬜ 1. Windows version, architecture, PowerShell, winget, and ChatGPT settings checked
⬜ 2. winget working in a fresh PowerShell window
⬜ 3. Git, GitHub CLI, and ripgrep installed
⬜ 4. nvm-windows installed, Node v24.19.0, and npm 11.17.0 working
⬜ 5. Git identity and the participant's own GitHub login verified
⬜ 6. Official Codex CLI installed and signed into the same ChatGPT account
⬜ 7. Vercel and Neon CLIs installed; the participant's own accounts verified
⬜ 8. Agents First MCP added, authenticated, and tested with one read-only action
⬜ 9. Required ChatGPT connections authenticated and tested read-only
⬜ 10. READY FOR FRIDAY receipt produced

BOUNDARIES

This is pre-repository setup. Do not touch a repository or create, deploy, send, edit, or delete anything externally. Authentication and the named local setup changes are authorized. Do not install Docker, WSL, WSL2, Supabase, Wrangler, Claude, pnpm, Yarn, Bun, Python, .NET, Git Bash as the agent shell, or other unlisted tools.

STEP 1 — CHECK WINDOWS AND CHATGPT SETTINGS

Verify Windows 11 (recommended) or a fully updated Windows 10, 64-bit. Windows 10 older than version 1809 is not acceptable. Record CPU architecture (AMD64 or ARM64). Use native tools for that architecture. If this is Windows on ARM, do not silently install x86-only tools when an ARM64 build exists.

Confirm the default shell is PowerShell. Confirm `winget` works. If winget is missing, have the participant update “App Installer” from the Microsoft Store, then re-check.

If PowerShell blocks scripts (`npm.ps1 cannot be loaded` or running scripts is disabled), set this for the current user only:

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

Do not change the LocalMachine policy unless the current-user policy is blocked by IT.

Guide the participant through these ChatGPT app settings: prevent sleep on; Queue follow-ups; Standard speed; detailed progress; Pragmatic personality; memories and snapshots on; live web search, browser, and computer use on; agent = Windows native, not WSL; integrated terminal = PowerShell; Full access and Never ask for approval for this supervised setup; automatic force-push off.

Create C:\Users\<username>\Documents\AI-Workspace if it does not exist. Do not put a git repo in it yet.

STEP 2 — INSTALL AND REPAIR THE LOCAL TOOLCHAIN

Inspect first and do not create duplicate installations.

If a system-wide Node.js already exists (winget, MSI, or “Node.js” in Apps), uninstall it before installing nvm-windows. A leftover Node fights nvm-windows for PATH.

Install or verify the essentials with winget. Accept agreements non-interactively. The participant only clicks User Account Control if Windows asks:

winget install --id Git.Git --accept-package-agreements --accept-source-agreements
winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
winget install --id BurntSushi.ripgrep.MSVC --accept-package-agreements --accept-source-agreements

Install nvm-windows. This is the Windows Node version manager. It is not the Mac nvm 0.40.6 project, and that version number will not match. Do not use Chocolatey, Scoop, fnm, or a direct Node.js MSI for this setup.

winget install --id CoreyButler.NVMforWindows --accept-package-agreements --accept-source-agreements

Open a fresh PowerShell after that install. If `nvm use` fails on a symlink, have the participant turn on Windows Developer Mode (Settings → System → For developers) or approve one elevated prompt, then retry. Then run:

nvm install 24.19.0
nvm use 24.19.0

There is no `nvm alias default` on nvm-windows. `nvm use 24.19.0` is the default. Verify Node v24.19.0 and npm 11.17.0 in a fresh PowerShell. `where.exe node` and `where.exe npm` must resolve through the nvm-windows symlink (usually C:\Program Files\nodejs), not an old MSI path. Never use an Administrator npm. Never use `sudo`.

Install or update the official standalone Codex CLI:

powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"

Make the official standalone `codex` command active without deleting unknown files. Then install the provider CLIs under Node 24:

npm install -g vercel@latest neon@latest

Verify every tool's version and path: git, gh, rg, nvm, node, npm, codex, vercel, neon. Node, npm, Vercel, and Neon must resolve through the active nvm-windows Node 24.19.0.

STEP 3 — CONFIGURE IDENTITY AND SIGN IN

Ask for the participant's real name and GitHub-verified email. Configure git user.name, git user.email, and init.defaultBranch main.

For GitHub, first run gh auth status. If the correct account is not authenticated, guide the participant through:

gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git --hostname github.com

Verify the GitHub username. Do not accept invitations or touch repositories yet.

Run codex login status. If needed, run codex login and use Sign in with ChatGPT. Do not use an API key.

Vercel: create a free account at https://vercel.com/signup with GitHub, then run vercel login, vercel whoami, and vercel teams list. Do not link or deploy.

Neon: create a direct free account at https://console.neon.tech, then run neon auth --keyring, neon me, and neon orgs list. --keyring stores the credential in Windows Credential Manager. Do not create a project, database, key, branch, or integration. If they already connected Neon through Vercel, they still need a direct Neon account for this workshop; do not work around that with an API key.

STEP 4 — CONNECT AGENTS FIRST AND CHATGPT CONNECTIONS

Confirm the participant can sign into their own Agents First account. Check whether the MCP already exists, and add it only if absent:

codex mcp get agentsfirst
codex mcp add agentsfirst --url https://app.agentsfirst.ai/api/external-agent/mcp
codex mcp login agentsfirst
codex mcp list

After browser OAuth, discover permitted operations and run one smallest read-only proof. Never borrow another person's credentials. If access is missing, report manager_action_needed and continue.

Connect Gmail, Google Drive, Google Calendar, and Slack with the participant's business accounts, then prove one smallest read-only action from each. Add other connections only for a named workshop need. Do not make external writes. GitHub, Vercel, and Neon plugins are optional because their CLIs were already proven.

STEP 5 — PRINT THE FINAL RECEIPT

Verify the evidence you can inspect, then print:

READY FOR FRIDAY

[✅/❌] ChatGPT account, Pro, and workshop settings
[✅/❌] Native Windows PowerShell and winget
[✅/❌] Git, GitHub CLI, ripgrep, identity, and GitHub login
[✅/❌] nvm-windows, Node v24.19.0, and npm 11.17.0
[✅/❌] Codex CLI and ChatGPT login
[✅/❌] Vercel CLI and account; no deployment created
[✅/❌] Neon CLI and direct account; no database created
[✅/❌] Agents First MCP read proof, or manager_action_needed
[✅/❌] Gmail, Drive, Calendar, and Slack read proofs, or exact blockers
[✅/❌] C:\Users\<username>\Documents\AI-Workspace exists

INSTALLATION LOG

Installed or updated:
Authenticated:
Problems fixed:
Remaining blocker and owner:

repo_loaded: NO
provider_resources_created: NO
external_writes_performed: NO
secrets_read_or_copied: NO
wsl_installed: NO

READY: YES or NO

If READY is NO, finish every unblocked item and give the smallest next action.

CODEX SETUP COMPANION — END

AFTER CODEX FINISHES

Take a screenshot of the READY FOR FRIDAY receipt and reply to this email with it. Also post it in #cohort-1 if you have already accepted the Slack invitation and can see that channel. If you cannot access the channel, the email reply is enough; tell me Slack is the blocker.

Friday morning, bring your laptop and charger. Know your ChatGPT, GitHub, Google, Vercel, Neon, Slack, and Agents First login methods and have your MFA device nearby.

Stuck anywhere? Reply with a screenshot of the exact step. Getting stuck is normal; staying stuck is optional. If a Windows pop-up or IT policy blocks you, I can jump on a short call.

See you Friday,
Humberto
