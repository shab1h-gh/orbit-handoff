# Orbit Handoff

Orbit Handoff provides two local coding skills:

- **Orbit Setup** prepares a project with lightweight living documentation and token-efficient agent rules.
- **Orbit Handoff** saves concise verified current state to `HANDOFF-STATE.md` so a fresh coding session can resume without carrying a large conversation.

## Commands

Standalone installations expose:

- Codex: `$orbit-setup` and `$handoff`
- Claude Code: `/orbit-setup` and `/handoff`

When installed as this Claude plugin, the namespaced commands are:

- `/orbit-handoff:orbit-setup`
- `/orbit-handoff:handoff`

Orbit Setup creates only missing `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `SECURITY.md` and `ROADMAP.md` templates, preserves existing equivalents, manages concise Orbit rules in `AGENTS.md`/ `CLAUDE.md`, and keeps `HANDOFF-STATE.md` Git-ignored.

The project rules keep those tracked documents as current truth, update them in place rather than appending session history, default to no subagents with a maximum of two when genuinely useful, and ask the agent to run Handoff after meaningful verified milestones and completed coding tasks that changed repository state or durable project truth.

Orbit Handoff overwrites rather than appends. The handoff is capped at 50 lines, rejects empty and obvious secret-bearing input, writes atomically, preserves the previous valid state after rejected content, makes no network calls and does not mutate Git.

There is no MCP server, telemetry or external account. The host coding agent still needs repository/shell access to run the local workflow.

Standalone installation, updating and distribution details are in the [project README](https://github.com/shab1h-gh/orbit-handoff#readme).

Licensed under MIT by Shabih Anwar.
