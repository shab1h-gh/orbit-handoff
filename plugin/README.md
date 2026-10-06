# Orbit Thread

Orbit Thread provides two local coding skills:

- **Orbit Setup** prepares a project with lightweight living docs, selective context rules and configurable subagent preferences.
- **Handoff** overwrites a compact, evidence-only `HANDOFF-STATE.md` so a fresh coding session can resume from Git + current project truth rather than a large old conversation.

Standalone commands:

- Codex: `$orbit-setup` and `$handoff`
- Claude Code: `/orbit-setup` and `/handoff`

Claude plugin commands:

- `/orbit-thread:orbit-setup`
- `/orbit-thread:handoff`

Setup creates only missing PRODUCT, DESIGN, ARCHITECTURE, SECURITY and ROADMAP templates, preserves existing equivalents, manages a concise Orbit Thread section in AGENTS.md/CLAUDE.md, and keeps local handoff/tool state Git-ignored.

The project rules update living docs in place, load only relevant context, default to no subagents with a maximum of two, and request Handoff after meaningful verified milestones/completed coding tasks.

Handoff is overwrite-only, capped at 50 lines, secret-checked before atomic replacement and makes no network calls or Git mutations.

There is no MCP server, telemetry or external account.

See the project README for installation, migration and update instructions.
