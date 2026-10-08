# Orbit Thread

**Keep coding agents aligned across long projects without carrying a huge conversation forever.**

[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/shab1h-gh/orbit-thread/actions/workflows/ci.yml/badge.svg)](https://github.com/shab1h-gh/orbit-thread/actions/workflows/ci.yml)

Orbit Thread is a small local continuity layer for Codex and Claude Code. It has two reusable skills:

- **Orbit Setup** prepares a project with lightweight living documentation and token-efficient agent rules.
- **Handoff** keeps one short `HANDOFF-STATE.md` current so a fresh session can resume from verified state instead of replaying a large chat history.

Tracked source, Git history and living project docs remain authoritative. The handoff is current execution state, not a changelog.

## Quick start

From the project you want to configure:

```sh
npx orbit-thread install
npx orbit-thread setup
```

Choose Codex, Claude Code or both when prompted.

Non-interactive:

```sh
npx orbit-thread install --agent both --scope project --yes
npx orbit-thread setup --agent both --yes
```

Then use the skills directly:

| Agent | Setup | Handoff |
| --- | --- | --- |
| Codex standalone | `$orbit-setup` | `$handoff` |
| Claude Code standalone | `/orbit-setup` | `/handoff` |
| Claude plugin | `/orbit-thread:orbit-setup` | `/orbit-thread:handoff` |

## What Orbit Setup creates

Orbit Setup is designed to run before the first substantial coding prompt, or later to upgrade an existing project.

If equivalent files do not already exist, it creates:

```text
project/
├── AGENTS.md
├── CLAUDE.md                 # when Claude is selected
├── .orbit-thread/
│   └── config.json           # tracked project preferences
└── docs/
    ├── PRODUCT.md
    ├── DESIGN.md
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    └── ROADMAP.md
```

At the first meaningful checkpoint, Handoff creates:

```text
HANDOFF-STATE.md              # local, Git-ignored, overwrite-only
```

Orbit Thread also keeps its small internal ownership state local and Git-ignored.

Existing product/design/architecture/security/roadmap files at either the repository root or under `docs/` are preserved instead of duplicated.

### Living-doc rules

The generated project instructions tell the agent to:

- load only the docs relevant to the current task;
- inspect only the source files it actually needs;
- keep `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `SECURITY.md` and `ROADMAP.md` as current truth;
- update affected sections **in place** after verified changes;
- never append session diaries or duplicate superseded sections;
- keep Git as history;
- never rewrite an applied migration;
- run the smallest relevant verification before claiming completion.

The document-routing rules are deliberately selective:

- product behaviour, copy or scope → `PRODUCT.md`
- UI/UX → `DESIGN.md`
- runtime, data flow, infrastructure or integrations → `ARCHITECTURE.md`
- auth, tenancy, secrets or other security-sensitive work → `SECURITY.md`
- future planning only → `ROADMAP.md`

This keeps routine tasks from loading every project document into context.

## Checkpoints and fresh-context recovery

Orbit Thread asks the coding agent to run Handoff:

- after a meaningful verified milestone that changed repository state or durable project truth;
- after a completed coding task with such changes, before the final reply;
- before `/clear`, session end, or a usage/context stop when the agent receives warning.

It intentionally skips read-only questions and trivial edits.

Each successful checkpoint **overwrites** the previous `HANDOFF-STATE.md`. It does not grow into a development diary.

After a fresh, cleared or recovered session, the generated project rules tell the agent to recover in this order:

1. read `HANDOFF-STATE.md` once if present;
2. inspect current branch/status/diff/recent Git log;
3. load only relevant living docs;
4. inspect only source needed for the recorded next action;
5. preserve valid uncommitted work and continue from the highest verified milestone.

## Handoff format

A handoff is normally about 30 lines and has a hard cap of 50:

```markdown
# Handoff State

Updated: 07-10-2026 00:30

## Current objective
- Finish account-security settings.

## Completed milestones
- Added the settings route.
- Connected password change and session revocation.

## In progress
- Passkey-management UI.

## Open issues / risks
- Passkey removal still needs a browser test.

## Immediate next steps
1. Finish passkey management.
2. Run the authentication suite.

## Verification
- Typecheck passed.
- Unit tests passed: 42/42.
```

The writer validates before replacing the previous handoff, rejects obvious secret-like content, writes atomically, makes no network calls and does not mutate Git.

## Subagent configuration

Orbit Thread defaults to **no subagents unless they genuinely help**, with a maximum of two and no recursive subagents.

Use `configure` to set the project-wide helper limit and optional per-agent model/reasoning preferences. Orbit Thread records these as project preferences; it does not spawn subagents itself.

You can save project-specific model/reasoning preferences without hand-editing `AGENTS.md`:

```sh
npx orbit-thread configure --agent claude \
  --model "Claude Sonnet 5.5" --effort low

npx orbit-thread configure --agent codex \
  --model "GPT-6.1 Sol" --reasoning high
```

Set the maximum number of subagents (0–2):

```sh
npx orbit-thread configure --max-subagents 2
```

Disable subagents:

```sh
npx orbit-thread configure --max-subagents 0
```

Show configuration:

```sh
npx orbit-thread configure --show
```

Reset saved subagent preferences:

```sh
npx orbit-thread configure --agent claude --reset-subagents
```

Preferences are stored in `.orbit-thread/config.json` and reflected in Orbit Thread's managed section of `AGENTS.md`. They are preferences rather than hard dependencies: an unavailable exact model setting should not block useful work.

## Project doctor

Run `doctor` after setup/update/configuration changes, on a fresh clone, or whenever Orbit Thread recovery/configuration looks inconsistent:

```sh
npx orbit-thread doctor --agent both --scope project
```

Use `--agent codex` or `--agent claude` when only one workflow is installed.

It checks the managed skill installation and project continuity setup, including living docs, config, managed agent blocks, Git-ignore rules, duplicate root/docs files and handoff size. A non-zero doctor result means Orbit Thread's continuity setup needs attention; it does **not** by itself mean your application or deployment is broken.

`npx orbit-thread check` remains the lightweight managed-skill installation check kept for Orbit Handoff compatibility; use `doctor` for the full project health check.

## Installation

Requirements:

- Node.js 20+
- Git for normal repository workflows
- a POSIX shell and standard Unix utilities for the handoff writer

macOS and Linux are supported. Native Windows is not currently supported; WSL is the expected route.

### npm / standalone Codex and Claude Code

```sh
npx orbit-thread install
```

Project installs use:

| Agent | Project location |
| --- | --- |
| Codex | `.agents/skills/handoff/` and `.agents/skills/orbit-setup/` |
| Claude Code | `.claude/skills/handoff/` and `.claude/skills/orbit-setup/` |

User/global installs use the equivalent `~/.agents/skills/` or `~/.claude/skills/` locations.

### Claude GitHub marketplace

Inside Claude Code:

```text
/plugin marketplace add shab1h-gh/orbit-thread
/plugin install orbit-thread@orbit-thread
```

Equivalent shell commands:

```sh
claude plugin marketplace add shab1h-gh/orbit-thread
claude plugin install orbit-thread@orbit-thread
```

The GitHub marketplace route is separate from Anthropic's official public directory.

## Commands

| Command | Purpose |
| --- | --- |
| `npx orbit-thread install` | Install both skills for selected agent(s). |
| `npx orbit-thread setup` | Prepare/upgrade the current project workflow and living docs. |
| `npx orbit-thread configure` | Configure project subagent preferences. |
| `npx orbit-thread doctor` | Check installation and project continuity health. |
| `npx orbit-thread@latest update` | Upgrade unchanged managed skill files. |
| `npx orbit-thread uninstall` | Remove managed skills/instruction blocks while preserving project-owned docs/config/state. |
| `npx orbit-thread init` | Backwards-compatible alias for `setup`. |
| `npx orbit-thread check` | Check managed skill installation (kept for Orbit Handoff compatibility). |

Common options:

```text
--agent codex|claude|both
--scope project|user
--yes
```

## Migrating from Orbit Handoff 1.0.x

Orbit Thread is the successor to **Orbit Handoff**.

Existing npm-managed users should install/update through the new package name:

```sh
npx orbit-thread@latest update --agent both --scope project --yes
npx orbit-thread@latest setup --agent both --yes
npx orbit-thread doctor --agent both --scope project
```

The v1.1 CLI recognises the managed Orbit Handoff installation/state and migrates it without intentionally overwriting local edits. The old `orbit-handoff` binary name remains an alias inside the Orbit Thread package for compatibility.

The historical `orbit-handoff` npm releases remain immutable.

For Claude GitHub-marketplace users, update/reinstall from the renamed repository and run:

```text
/orbit-thread:orbit-setup
```

## Updating Orbit Thread

```sh
npx orbit-thread@latest update --agent both --scope project --yes
npx orbit-thread@latest setup --agent both --yes
```

The first command updates unchanged managed skill files. The second updates the project-managed rules and creates only missing living docs.

Locally edited managed skill files are never force-overwritten.

## FAQ and troubleshooting

### Doctor says `AGENTS.md` or `CLAUDE.md` has a missing/edited managed block. Is my app broken?

Usually not. `doctor` checks Orbit Thread's local continuity/configuration files, not your application's runtime health. A formatter such as Prettier can change whitespace inside Orbit Thread's exact managed block and trigger the integrity check even when the instructions still look equivalent.

Inspect the change first:

```sh
git diff -- AGENTS.md CLAUDE.md
```

If the files contain only unintended formatter changes and no intentional edits, restore them, rerun setup, then verify:

```sh
git restore -- AGENTS.md CLAUDE.md
npx orbit-thread setup --agent both --yes
npx orbit-thread doctor --agent both --scope project
```

If those files also contain intentional edits, do **not** restore the whole file. Revert only the formatter-changed Orbit Thread hunk, for example with:

```sh
git restore -p -- AGENTS.md CLAUDE.md
```

Then rerun setup and doctor. If the drift is already committed, restore only the managed block from a known-good commit or the exact block recorded in local `.orbit-thread/state.json`, then rerun setup and doctor.

To prevent Markdown formatters from changing the canonical blocks, exclude the managed instruction files where appropriate. For Prettier, add:

```text
AGENTS.md
CLAUDE.md
```

to the project's `.prettierignore`.

### Setup refuses to overwrite an edited, duplicated or malformed managed block

This is intentional. Orbit Thread will not silently replace a block whose recorded contents no longer match, because doing so could destroy local instructions.

Inspect the diff/markers, repair only the Orbit Thread-managed block, then run:

```sh
npx orbit-thread setup --agent both --yes
npx orbit-thread doctor --agent both --scope project
```

Do not delete `.orbit-thread/state.json` or the managed markers just to bypass the check; that state is what lets Orbit Thread distinguish its own content from yours.

### When should I run Handoff?

Use Handoff after a meaningful verified milestone that changed repository state or durable project truth, and before clearing/ending a session when you need continuity. Skip read-only questions and trivial maintenance that does not change durable project state.

Each successful handoff overwrites the previous local `HANDOFF-STATE.md`; it is not a changelog. If a handoff is rejected, keep it under 50 lines and remove secrets, credentials, personal data or other sensitive values before retrying.

### What should a fresh Codex/Claude session load?

Do not replay the old conversation. Recover from `HANDOFF-STATE.md` once, then current Git branch/status/diff/recent log, then only the living docs and source files needed for the recorded next action. The generated project instructions encode this order.

### What if my configured subagent model is unavailable?

Subagent settings in `.orbit-thread/config.json` are preferences, not hard dependencies. Keep the configured limit and use the strongest suitable available alternative rather than blocking work or hand-editing Orbit Thread's managed blocks. Confirm the current project preference with:

```sh
npx orbit-thread configure --show
```

## Security and privacy

Orbit Thread is local-first.

The handoff writer makes no network calls and does not mutate Git. Secret detection is a backstop, not a data-loss-prevention system, so never place credentials, personal data or sensitive production information in handoffs or project docs.

The installer refuses unmanaged skill collisions and protects locally modified managed files. Setup preserves unrelated instructions and existing project docs.

There is no Orbit Thread telemetry. npm, GitHub, Claude and OpenAI still operate under their own service/privacy policies.

See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Provider directories

The repository includes a portable skills-only plugin ZIP suitable for OpenAI's plugin upload flow and a Claude plugin manifest suitable for Anthropic/GitHub distribution.

Public OpenAI and Anthropic directory approval is separate from npm/GitHub installation. See [docs/SUBMISSION.md](docs/SUBMISSION.md).

## Contributing

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE) — Shabih Anwar.
