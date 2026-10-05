# v1.0.0 validation record

Checks performed on 5 October 2026, using disposable Git repositories.

## Automated tests

All 26 tests passed locally on macOS with Node.js 24. Tests cover first creation,
overwrite, exactly 50 lines, 51-line rejection, final lines with and without a
newline, empty and synthetic secret/private-key rejection, preservation of the
old file, paths with spaces, cleanup after validation and rename failures, and
unchanged Git index/refs with network-command guards.

CLI tests cover Codex, Claude and both-agent project installs, identical copies,
reinstall, check, update across package versions, uninstall, user-scope locations
in a disposable home, init idempotency and block upgrades, ignore rules, existing
instructions, edited files/blocks, unrelated files/directories, symlinks and
invalid ownership paths. No live user installation is altered by these tests.

CI ran the suite, local package validation, source scan, ZIP build and npm pack
on macOS/Linux with Node.js 20 and 24. All four jobs passed in the
[initial public CI run](https://github.com/shab1h-gh/orbit-handoff/actions/runs/37254076291).

## Native discovery and packaging

- Codex CLI 0.160.0 returned the installed `handoff` from its native `skills/list`
  API, with display name Orbit Handoff and a `$handoff` default prompt.
- Claude Code 2.1.289 passed `claude plugin validate ./plugin --strict` and
  `claude plugin validate . --strict`.
- A local marketplace install succeeded. `claude plugin details orbit-handoff`
  reported one `handoff` skill, zero agents/hooks/MCP/LSP servers.
- A second isolated configuration installed `orbit-handoff@orbit-handoff` from
  `shab1h-gh/orbit-handoff` on GitHub and reported version 1.0.0 enabled.
- Claude startup's `slash_commands` and `skills` arrays contained
  `orbit-handoff:handoff`; its plugin metadata reported version 1.0.0.
- A standalone Claude project install registered and loaded `handoff`, confirming
  the `/handoff` command independently of the plugin namespace.
- The attempted Claude model run ended with **Not logged in**. Registration and
  installation are verified; an authenticated agent-driven handoff is untested.
- The portable manifest passed the official Agent Plugins 1.0.0 JSON Schema
  using Ajv's draft-2020 validator. Local checks cover OpenAI listing limits,
  real PNG assets, skill metadata and the absence of MCP/hooks.
- `npm pack` was inspected and the packed CLI installed both agents through
  `npx --package` in a clean disposable project.
- The interactive installer was exercised in a terminal: agent selection,
  project scope selection, destination preview and confirmation all completed.
- Public-source scans passed. Archives are inspected separately for unwanted
  paths, credentials, test output and build residue before release.

## Publication limits

The exact npm name was available, but `npm whoami` returned `ENEEDAUTH` during
release preparation. Until npm publication succeeds, the registry-based
`npx orbit-handoff install` route is unverified. The prepared tarball and GitHub
checkout provide the tested CLI; see [PUBLISHING.md](PUBLISHING.md).

Neither OpenAI nor Anthropic public directory submission has been made.
Provider review, identity verification and portal checks remain publisher steps.
Native Windows, WSL-specific operation and ordinary ChatGPT execution are
unverified; the supported runtime is macOS/Linux with a POSIX shell.
