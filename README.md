# Orbit Handoff

**Carry the important state from one coding session into the next.**

[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/shab1h-gh/orbit-handoff/actions/workflows/ci.yml/badge.svg)](https://github.com/shab1h-gh/orbit-handoff/actions/workflows/ci.yml)

Orbit Handoff gives Codex and Claude Code a small, reliable way to leave the next
session ready to work. Invoke `handoff`, and your agent saves the verified state of
the session to a local `HANDOFF-STATE.md` — with a hard limit of 50 lines.

## Why I built it

I kept running into the same problem: a productive coding session would end, and
the next one would spend too long working out where things stood. A transcript
was too much to read. A vague summary missed the details that mattered.

I wanted a handoff that answered a few practical questions. What are we trying to
finish? What actually changed? What did we test? What is blocked? What should
happen next?

Orbit Handoff makes the workflow I use publicly installable. It keeps the working
context small enough to read, and leaves the repository and its tracked
documentation in charge.

## How it works

1. Explicitly invoke the skill at the end of a coding session.
2. Your agent checks the current Git state and reconciles the previous handoff
   with evidence from the session.
3. It sends a concise Markdown handoff to the bundled shell writer.
4. The writer validates the content, then atomically replaces `HANDOFF-STATE.md`
   at the repository root. The agent confirms the line count and first next step.

The file is created on the first successful handoff. Each later handoff overwrites
it. Failed validation leaves the last valid handoff intact.

### Why 50 lines?

A handoff should help you resume work quickly. Fifty lines is a hard cap; around
30 is usually enough. The limit encourages useful decisions, real verification
and immediate next steps. It keeps resolved issues and repeated history out of
the next session.

Durable architecture, security and roadmap decisions still belong in tracked
project documentation. The handoff is local working context, not the only place
an important decision should live.

## Features

- One canonical skill for Codex, Claude Code and native plugin packaging.
- Evidence-only state: objective and phase, completed work, verification,
  decisions, blockers and concrete next steps.
- A 50-line limit, including a final line without a trailing newline.
- Empty-input and obvious-secret rejection, with line numbers rather than
  matched secret text in error messages.
- Same-directory atomic replacement and temporary-file cleanup.
- No network calls or Git mutations from the handoff writer.
- An interactive, dependency-free installer with project and user scopes.
- Ownership-aware updates and uninstall, plus optional continuity configuration.

## Installation

You need Node.js 20 or newer for the npm CLI, Git, and a POSIX shell with `awk`,
`grep`, `mktemp` and standard Unix utilities. macOS and Linux are supported.

```sh
npx orbit-handoff install
```

Choose **Codex**, **Claude Code** or **Both**, then choose **Current project** or
**User/global**. The installer shows the destinations and asks before writing.
For a project inside a Git repository, it installs at the repository root,
including when you run it from a subdirectory.

For unattended setup:

```sh
npx orbit-handoff install --agent both --scope project --yes
```

The v1.0.0 npm release is awaiting publisher authentication. Until it is published,
the registry command above is unavailable. Use the prepared CLI from the GitHub
checkout instead:

```sh
git clone https://github.com/shab1h-gh/orbit-handoff.git
cd orbit-handoff
npm link
```

Then run `orbit-handoff install` from the project you want to configure. There is
no postinstall script that silently changes a project.

### Project or user installation?

| Agent | Current project | User/global |
| --- | --- | --- |
| Codex | `.agents/skills/handoff/` | `~/.agents/skills/handoff/` |
| Claude Code | `.claude/skills/handoff/` | `~/.claude/skills/handoff/` |

A project install travels with that repository if you commit the skill files. A
user install makes the skill available across your local projects. These are the
locations documented by [Codex](https://learn.chatgpt.com/docs/build-skills) and
[Claude Code](https://code.claude.com/docs/en/skills). The installed skill files
are byte-identical for both agents.

Choose one route per agent where possible. Installing both a standalone skill
and a plugin can give you duplicate entries in the skill menu.

### Codex

```sh
npx orbit-handoff install --agent codex --scope project --yes
npx orbit-handoff init --agent codex --yes
```

At the end of a session, invoke:

```text
$handoff
```

The native skill metadata disables implicit invocation. If the skill does not
appear after installation, restart Codex.

### Claude Code standalone skill

```sh
npx orbit-handoff install --agent claude --scope project --yes
npx orbit-handoff init --agent claude --yes
```

Invoke:

```text
/handoff
```

The skill uses `disable-model-invocation: true`, so Claude does not decide to run
it on its own. Restart Claude Code or reload skills if needed.

### Claude marketplace plugin

Inside Claude Code:

```text
/plugin marketplace add shab1h-gh/orbit-handoff
/plugin install orbit-handoff@orbit-handoff
```

You can also discover Orbit Handoff through `/plugin` after adding the marketplace.
The equivalent shell commands are:

```sh
claude plugin marketplace add shab1h-gh/orbit-handoff
claude plugin install orbit-handoff@orbit-handoff
```

The plugin registers this namespaced skill command:

```text
/orbit-handoff:handoff
```

That registration was checked with Claude Code 2.1.289. The standalone skill is
`/handoff`; the plugin has the namespace shown above. Plugin installation does not
configure your repository's continuity instructions. Run `npx orbit-handoff init
--agent claude --yes` if you want those too.

### OpenAI / ChatGPT / Codex plugin

Orbit Handoff includes a skills-only portable Agent Plugin, with OpenAI listing
metadata and an icon. It needs no MCP server or external account.

**It has not been submitted to or approved for the public OpenAI Plugins
Directory.** Once a listing is approved and published, you will be able to find
Orbit Handoff in Plugins and install it on supported surfaces. Until then, use the
Codex standalone route. The validated submission ZIP is attached to the GitHub
release; [submission guidance](docs/SUBMISSION.md) explains the publisher steps.

The plugin needs a repository and shell access. Installing it in an ordinary
conversation without that environment cannot save a repository handoff.

## Configure continuity in a repository

Run this from your repository:

```sh
npx orbit-handoff init
```

`init` shows its proposed changes, then adds a delimited Orbit Handoff block to
`AGENTS.md`, `CLAUDE.md`, or both. It also adds the exact `HANDOFF-STATE.md` ignore
entry if neither that entry nor `/HANDOFF-STATE.md` is already present. Existing
content is preserved. Running it again makes no duplicate blocks.

The managed instructions tell the agent to read the handoff at session start,
inspect Git and relevant tracked documentation, and treat the repository and
tracked docs as authoritative. They only permit a handoff update when you
explicitly invoke the skill.

`init` requires a Git repository. It does not create `HANDOFF-STATE.md`. It records
the exact additions in `.orbit-handoff/state.json` so uninstall can distinguish
its changes from yours. Keep this ownership file alongside the instructions if
you commit them. An ignore rule does not remove an already tracked file from Git.

## Commands

| Command | What it does |
| --- | --- |
| `npx orbit-handoff install` | Choose agent and scope, then install the canonical skill. |
| `npx orbit-handoff init` | Configure continuity in the current repository. |
| `npx orbit-handoff check` | Report selected installations, continuity blocks and handoff ignore status. |
| `npx orbit-handoff@latest update` | Replace unchanged managed skill files with the running package version. |
| `npx orbit-handoff uninstall` | Remove unchanged owned files and project continuity blocks. |

Options: `--agent codex|claude|both`, `--scope project|user`, and `--yes` (`-y`).
Non-interactive commands default to both agents and project scope. `check` needs
no confirmation and exits with status 1 if a selected installation is missing,
modified or differs from the running package. Use `--scope user` to check or manage
user installs. `init` always configures the current repository.

## What a handoff looks like

This is a generic example. Actual handoffs are generated from the evidence in
your current session; they do not inherit these claims or test results.

```markdown
# Handoff State

## Objective
Complete the authentication settings UI and verify the account-security flow.
Phase: completing passkey support and browser verification.

## Completed
- Added the settings route and reusable account-security components.
- Connected password-change and session-revocation flows.
- Updated the design tokens used by the new settings screens.

## Verified
- Typecheck passed.
- Unit tests passed: 42/42.
- Production build completed successfully.

## Decisions
- Keep session management server-side.
- Reuse the existing form validation layer rather than adding another dependency.

## Risks / Blockers
- Passkey removal still needs an end-to-end browser test.

## Next
1. Add the passkey-management UI.
2. Run the browser authentication suite.
3. Review the completed settings flow before release.
```

The skill's normal format also includes an update time and current state. Empty
sections are omitted. A test is only recorded as passed when it actually ran.

## Security and privacy

The handoff runtime works locally. Its shell writer reads stdin, validates the
content, and replaces one file. It has no network calls and does not commit,
stage, amend or push anything. The previous valid handoff survives rejected
content, and the temporary file is removed. New handoff files use restrictive
permissions from `mktemp`.

Secret detection catches recognisable patterns, including private keys and common
token formats. It cannot catch every secret or piece of personal data. Review
what the agent proposes. Keep credentials, environment values and sensitive
production data out of the handoff.

The installer refuses to overwrite an unmanaged `handoff` skill or locally
modified managed files. Uninstall preserves edited files, unrelated files and
edited continuity blocks. It does not delete `HANDOFF-STATE.md`. Retained ownership
records make preserved edits visible to later checks.

There is no telemetry. Downloading through npm or a marketplace still uses the
relevant registry or Git host, and your agent's model calls follow its provider's
privacy settings. See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Updating and uninstalling

Fetch the latest CLI when updating — `update` itself does not contact npm:

```sh
npx orbit-handoff@latest update --agent both --scope project --yes
```

If you have edited installed files, the update stops so you can preserve and
review those changes. It does not force an overwrite.

```sh
npx orbit-handoff uninstall --agent both --scope project --yes
npx orbit-handoff uninstall --agent both --scope user --yes
```

For the Claude marketplace route:

```sh
claude plugin update orbit-handoff@orbit-handoff
claude plugin uninstall orbit-handoff@orbit-handoff
```

The npm uninstall command manages npm-installed skills and its own continuity
blocks. Claude manages the marketplace-installed plugin separately.

## Compatibility

The writer needs a POSIX shell, Git and standard Unix utilities; it has no Node.js
dependency. The npm CLI needs Node.js 20+. CI covers macOS and Linux on Node.js
20 and 24. Native Windows is not supported; WSL provides the Linux environment.
WSL has not been separately tested for this release.

Provider discovery and plugin features depend on the agent version. The Claude
plugin and marketplace were validated with 2.1.289. OpenAI directory acceptance
and ordinary ChatGPT use are unverified until submission and review. See the
[release validation record](docs/VALIDATION.md) for the checks actually performed.

## Project layout

```text
orbit-handoff/
├── bin/                       npm CLI entry point
├── lib/                       Installer and continuity management
├── plugin/
│   ├── plugin.json            Portable Agent Plugin and OpenAI listing
│   ├── .claude-plugin/        Claude plugin manifest
│   ├── assets/                Listing icon
│   └── skills/handoff/        One canonical skill and shell writer
├── .claude-plugin/            GitHub-hosted Claude marketplace
├── scripts/                   Validation, privacy scan and ZIP packaging
├── tests/                     Disposable runtime and installer tests
├── docs/                      Publication guidance and validation evidence
└── .github/workflows/         macOS and Linux CI
```

The two plugin manifests share the same skill directory. There is no separate
Codex or Claude implementation to drift apart.

## Contributing

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md)
for the development checks and the handoff contract to preserve.

## Licence

[MIT](LICENSE) — Shabih Anwar.
