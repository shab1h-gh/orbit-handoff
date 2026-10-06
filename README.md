# Orbit Handoff

**Set up lean project continuity, then carry the important state from one coding session into the next.**

[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/shab1h-gh/orbit-handoff/actions/workflows/ci.yml/badge.svg)](https://github.com/shab1h-gh/orbit-handoff/actions/workflows/ci.yml)

Orbit Handoff is a small local workflow for Codex and Claude Code with two skills:

- **Orbit Setup** prepares a project with lightweight living documentation and token-efficient agent rules.
- **Orbit Handoff** keeps one short `HANDOFF-STATE.md` current so a fresh session can resume without carrying a huge chat history.

The repository, Git history and tracked project documentation stay authoritative. The handoff is current execution state, not a changelog.

## Why I built it

Long coding sessions eventually become expensive to carry forward. A giant progress file has the same problem: every new session still has to read the accumulated history.

Orbit Handoff uses a different model:

1. Keep durable product, design, architecture, security and roadmap truth in small living documents.
2. Update those documents **in place** when the current truth changes.
3. Keep temporary execution state in one concise `HANDOFF-STATE.md`.
4. Overwrite that handoff at meaningful checkpoints instead of appending history.
5. Start a fresh session from Git + the handoff + only the relevant living docs.

That makes `/clear`, a new Codex thread, or a usage-window reset much cheaper to recover from.

## Quick start

From the project you want to configure:

```sh
npx orbit-handoff install
npx orbit-handoff setup
```

Choose Codex, Claude Code or both when prompted.

You can also run non-interactively:

```sh
npx orbit-handoff install --agent both --scope project --yes
npx orbit-handoff setup --agent both --yes
```

Then use the skills directly:

| Agent | Setup | Handoff |
| --- | --- | --- |
| Codex standalone | `$orbit-setup` | `$handoff` |
| Claude Code standalone | `/orbit-setup` | `/handoff` |
| Claude plugin | `/orbit-handoff:orbit-setup` | `/orbit-handoff:handoff` |

## Orbit Setup

Run Orbit Setup **before the first substantial coding prompt**, or later to upgrade an existing project.

It creates only missing living-doc templates, preferring `docs/`:

```text
docs/
├── PRODUCT.md
├── DESIGN.md
├── ARCHITECTURE.md
├── SECURITY.md
└── ROADMAP.md
```

If an equivalent file already exists at the repository root or in `docs/`, Orbit preserves it instead of creating a duplicate.

It also manages a small Orbit block in:

- `AGENTS.md`
- `CLAUDE.md` when Claude is selected
- `.gitignore`

The managed rules tell the agent to:

- load only the project context relevant to the current task;
- treat living docs as current truth, not session history;
- update affected living docs in place as soon as completed work changes that truth;
- keep Git as history;
- default to no subagents, use at most two when genuinely useful, and never recurse;
- run the smallest relevant verification before claiming completion;
- run Orbit Handoff after meaningful verified milestones and after completed coding tasks that changed repository state or durable project truth;
- checkpoint before `/clear`, session end, or a usage/context stop when warning is available;
- recover from `HANDOFF-STATE.md` + Git + only the relevant living docs rather than reconstructing old conversation history.

Orbit Setup does **not** create `HANDOFF-STATE.md`. The handoff skill creates it on the first successful checkpoint.

### Existing project files are preserved

Orbit Setup does not replace an existing `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `SECURITY.md` or `ROADMAP.md` just to standardise layout.

The living docs it creates become ordinary project files. Orbit uninstall does not delete them.

## Orbit Handoff

Orbit Handoff writes one evidence-only `HANDOFF-STATE.md` at the project root.

It records only the current information the next session needs:

- current objective;
- meaningful completed milestones;
- in-progress work;
- current state;
- material decisions;
- open risks/blockers;
- immediate next steps;
- actual verification.

The file has a **hard cap of 50 lines** and is normally around 30.

Each successful checkpoint **overwrites** the previous one. It never appends a chronological session log.

The writer:

- rejects empty input;
- rejects more than 50 lines;
- rejects obvious secret-like content;
- writes atomically;
- preserves the previous valid handoff after failed validation;
- makes no network calls;
- does not stage, commit, amend or push Git.

## Automatic checkpoints

Version 1.1 removes the old explicit-only invocation restriction.

The canonical handoff skill no longer has Claude's `disable-model-invocation: true`, and OpenAI skill metadata allows implicit invocation.

When a project has been configured with Orbit Setup, the project rules ask the agent to run Handoff:

- after a completed coding task that changed repository state or durable project truth;
- after a meaningful, verified milestone in a longer task;
- before a deliberate context clear or session end;
- before a usage/context stop when the agent has warning.

This is intentionally **not** after every tiny edit or read-only question.

You can still invoke the handoff manually at any time.

## Installation

Requirements:

- Node.js 20+ for the npm installer/manager;
- Git for normal repository workflows;
- a POSIX shell and standard Unix utilities for the handoff writer.

macOS and Linux are supported. Native Windows is not currently supported; WSL is the expected route.

### Standalone Codex and Claude Code

```sh
npx orbit-handoff install
```

Project installs create both skills under the selected agent:

| Agent | Project location |
| --- | --- |
| Codex | `.agents/skills/handoff/` and `.agents/skills/orbit-setup/` |
| Claude Code | `.claude/skills/handoff/` and `.claude/skills/orbit-setup/` |

User/global installs use the corresponding `~/.agents/skills/` or `~/.claude/skills/` locations.

After installation, run:

```sh
npx orbit-handoff setup
```

`npx orbit-handoff init` remains a backwards-compatible alias for `setup`.

### Claude GitHub marketplace route

Inside Claude Code:

```text
/plugin marketplace add shab1h-gh/orbit-handoff
/plugin install orbit-handoff@orbit-handoff
```

Equivalent shell commands:

```sh
claude plugin marketplace add shab1h-gh/orbit-handoff
claude plugin install orbit-handoff@orbit-handoff
```

This GitHub marketplace route is separate from Anthropic's official/public directory. A plugin can install successfully from the GitHub marketplace without appearing in Claude's public Skills/Plugins marketplace.

The plugin exposes namespaced commands:

```text
/orbit-handoff:orbit-setup
/orbit-handoff:handoff
```

### OpenAI / ChatGPT / Codex plugin

The repository includes a portable skills-only Agent Plugin package with no MCP server or external account.

Public directory approval is separate from GitHub/npm distribution. If you have submitted Orbit Handoff to OpenAI, the **publisher dashboard is the authoritative place to check its review status**. A working npm/Codex installation does not prove that the ChatGPT Plugins Directory submission has been accepted.

See [docs/SUBMISSION.md](docs/SUBMISSION.md).

## Commands

| Command | What it does |
| --- | --- |
| `npx orbit-handoff install` | Install both Orbit skills for the selected agent(s). |
| `npx orbit-handoff setup` | Prepare/upgrade the current project workflow and living docs. |
| `npx orbit-handoff init` | Backwards-compatible alias for `setup`. |
| `npx orbit-handoff check` | Report installed skill state and project continuity status. |
| `npx orbit-handoff@latest update` | Upgrade unchanged managed skill files to the running package version. |
| `npx orbit-handoff uninstall` | Remove managed skills and managed instruction blocks while preserving user-owned docs/state. |

Options:

```text
--agent codex|claude|both
--scope project|user
--yes
```

## Updating an existing installation

For npm/standalone installations:

```sh
npx orbit-handoff@latest update --agent both --scope project --yes
npx orbit-handoff@latest setup --agent both --yes
```

The first command upgrades the installed skills. The second upgrades the project's managed Orbit rules and creates any missing living-doc templates.

Existing edited managed skill files are not force-overwritten.

For the Claude GitHub marketplace route:

```sh
claude plugin update orbit-handoff@orbit-handoff
```

Then run the updated setup skill in the project:

```text
/orbit-handoff:orbit-setup
```

## What a handoff looks like

```markdown
# Handoff State

Updated: 06-10-2026 22:40

## Current objective
- Finish account-security settings and browser verification.

## Completed milestones
- Added the settings route and account-security components.
- Connected password change and session revocation.

## In progress
- Passkey-management UI.

## Decisions
- Keep session management server-side.

## Open issues / risks
- Passkey removal still needs an end-to-end browser test.

## Immediate next steps
1. Finish passkey management.
2. Run the browser authentication suite.

## Verification
- Typecheck passed.
- Unit tests passed: 42/42.
```

Actual handoffs are generated only from current evidence.

## Security and privacy

Orbit Handoff is local-first.

The handoff writer has no network calls and does not mutate Git. Secret-pattern detection is a backstop, not a guarantee, so credentials and sensitive production data should never be placed in a handoff or project documentation.

The installer refuses to overwrite unmanaged skill directories or modified managed files. Setup preserves unrelated instructions and existing project docs.

There is no telemetry in Orbit Handoff itself. npm, GitHub, Claude and OpenAI still operate under their own service/privacy policies.

See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Uninstalling

Standalone:

```sh
npx orbit-handoff uninstall --agent both --scope project --yes
npx orbit-handoff uninstall --agent both --scope user --yes
```

Claude marketplace:

```sh
claude plugin uninstall orbit-handoff@orbit-handoff
```

Orbit uninstall removes its managed skills and managed instruction blocks. It does not delete the living project documentation created during setup or `HANDOFF-STATE.md`.

## Project layout

```text
orbit-handoff/
├── bin/                         npm CLI
├── lib/                         installer/update management
├── plugin/
│   ├── plugin.json              portable/OpenAI plugin metadata
│   ├── .claude-plugin/          Claude plugin manifest
│   ├── assets/
│   └── skills/
│       ├── orbit-setup/         project bootstrap + setup script
│       └── handoff/             checkpoint skill + writer
├── .claude-plugin/              GitHub-hosted Claude marketplace
├── scripts/                     validation, scanning and packaging
├── tests/
├── docs/
└── .github/workflows/
```

Both providers use the same canonical skill directories, avoiding divergent Codex/Claude implementations.

## Contributing

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE) — Shabih Anwar.
