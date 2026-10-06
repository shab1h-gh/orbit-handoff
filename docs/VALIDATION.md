# Release validation record

Checks performed on 5 October 2026, using disposable Git repositories.

## Original v1.0.0 checks

### Automated tests

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

### Native discovery and packaging

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

`orbit-handoff@1.0.0` was successfully published manually. Public registry
verification on 5 October 2026 confirmed version 1.0.0, `latest` resolving to
1.0.0 before the patch release, and repository/homepage/issue metadata pointing
to `shab1h-gh/orbit-handoff`. The previous failed publication attempt is stale
history; the registry package is available.

Neither OpenAI nor Anthropic public directory submission has been made.
Provider review, identity verification and portal checks remain publisher steps.
Native Windows, WSL-specific operation and ordinary ChatGPT execution are
unverified; the supported runtime is macOS/Linux with a POSIX shell.

## v1.0.1 patch verification

The patch changes documentation and release version metadata only. No installer,
canonical skill, writer, tests or packaging logic changed.

### Public v1.0.0 smoke test

Downloaded the actual public package with an isolated npm cache and ran
`npx orbit-handoff@1.0.0 install --agent both --scope project --yes` in a disposable
Git repository on macOS with Node.js 24.16.0 and npm 12.0.2. Verified:

- Codex and Claude installs contain byte-identical skill files and ownership metadata.
- The npm CLI has executable permissions. Installed writers are mode 0644 and
  execute through `sh`, matching the canonical skill's invocation contract.
- `check` succeeds after install; `init` preserves existing AGENTS.md, CLAUDE.md
  and .gitignore content, records ownership and ignores HANDOFF-STATE.md.
- Reinstall and repeated init preserve bytes and add no duplicate blocks.
- Init creates no handoff. The writer creates and atomically replaces the file
  with restrictive permissions; empty and 51-line inputs preserve the valid file.
- No writer temporary files remain. Uninstall restores original configuration,
  removes unchanged owned skills, and preserves unrelated files and the handoff.
- Edited skills and continuity blocks survive uninstall; check and reinstall
  report edited files with failure status rather than overwriting them.

This smoke test exercises the CLI and shell workflow. It does not claim a new
native agent discovery test or an authenticated agent-driven handoff.

### Local checks and packed v1.0.1 smoke test

- All 26 existing tests passed on macOS with Node.js 24.16.0.
- `npm run validate`, `npm run scan:public` and `npm run build:plugin` passed.
- Claude Code 2.1.289 passed both `claude plugin validate ./plugin --strict` and
  `claude plugin validate . --strict` for the updated manifests.
- The portable manifest passed the official Agent Plugins 1.0.0 JSON Schema
  with Ajv's draft-2020 validator and format checks.
- `npm pack --dry-run` and `npm pack` succeeded using a disposable cache.
  The tarball contains 20 intended files, an executable CLI, version 1.0.1 and
  the corrected README. No dependencies, credentials or build residue are included.
- The submission ZIP passed its integrity check and both extracted archives
  passed the public/privacy scanner. No private paths or unwanted files were found.
- The packed 1.0.1 CLI passed the same disposable-repository install, check,
  init, reinstall, handoff and uninstall smoke test described above, including
  edited-content preservation and executable permissions.
- Complete diff review confirmed that runtime code and canonical skill bytes
  are unchanged. The v1.0.0 tag and release remain untouched.

These are pre-publication checks. After publication, verify `latest` resolves to
1.0.1 and repeat the public-registry smoke test; report its result in the GitHub
release. The original CI result above covers v1.0.0; it is not a new 1.0.1 CI claim.


## v1.1.0 feature validation

Validation work for the Orbit Setup feature release began on 6 October 2026.

### Focused local checks completed

A disposable local fixture exercised the new dual-skill/setup implementation:

- Orbit Setup creates missing PRODUCT, DESIGN, ARCHITECTURE, SECURITY and ROADMAP
  living-doc templates.
- Existing equivalent project docs and unrelated AGENTS.md content are preserved.
- Repeated setup is idempotent and does not duplicate managed blocks.
- Setup works before Git is initialised by treating the current directory as the
  project root.
- HANDOFF-STATE.md is not created by setup.
- The updated dual-skill manifest/metadata validation passed locally.
- The portable plugin packager built `orbit-handoff-plugin-1.1.0.zip` locally
  with both skill entrypoints present.
- Eight focused local setup/runtime checks passed in the isolated validation
  fixture used while preparing the feature branch.

The feature branch's full GitHub CI matrix passed on macOS and Linux with Node.js
20 and 24 after the setup migration fix. Each job ran the repository test suite,
package validation, public-source scan, plugin ZIP build and npm pack dry run.
The suite now contains 29 tests, including the new setup/idempotency cases.

A packed npm-tarball smoke test, current Claude native plugin validation, Codex
native skill discovery and public-registry smoke test are still required before
v1.1.0 is published/tagged.

### Invocation-policy change

The v1.1.0 canonical handoff skill intentionally removes Claude's
`disable-model-invocation: true` and sets OpenAI skill metadata
`allow_implicit_invocation: true`.

This allows a configured project's AGENTS.md/CLAUDE.md rules to request a handoff
proactively after meaningful verified milestones and completed coding tasks. The
skill remains manually invokable as `$handoff` / `/handoff` as before.

Orbit Setup is separately exposed as `$orbit-setup` / `/orbit-setup` for
standalone installs and as the corresponding namespaced command in the Claude
plugin.

### Provider-directory status

Provider review state is not inferable from this repository. OpenAI and
Anthropic publisher dashboards are authoritative for any submission already made.
GitHub/npm availability and local validation do not imply public-directory
approval.
