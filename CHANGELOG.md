# Changelog

## 1.1.0 — 6 October 2026

- Add the new `orbit-setup` skill for Codex and Claude Code.
- Add `npx orbit-handoff setup`; keep `init` as a backwards-compatible alias.
- Create only missing lightweight living docs for product, design, architecture, security and roadmap truth while preserving existing equivalents.
- Add token-efficient managed agent rules for selective context loading, in-place living-doc updates, bounded subagents and fresh-context recovery.
- Allow the handoff skill to be invoked implicitly when Orbit project rules require a meaningful checkpoint or a completed coding task handoff.
- Keep `HANDOFF-STATE.md` overwrite-only, evidence-only and capped at 50 lines.
- Upgrade existing managed standalone installs by adding the new setup skill without overwriting local edits.
- Update portable/OpenAI and Claude plugin metadata for the dual-skill release.

## 1.0.1 — 5 October 2026

- Confirm successful public npm publication and make `npx orbit-handoff install`
  the primary installation route.
- Remove stale pre-publication claims and record public package smoke testing.
- Update release and submission artifact references; directory submissions remain pending.
- Keep the installer, canonical skill and handoff writer unchanged.

## 1.0.0 — 5 October 2026

- Publish the proven handoff workflow as Orbit Handoff for Codex and Claude Code.
- Add interactive installation and ownership-aware init, check, update and uninstall.
- Package one canonical skill for Claude marketplaces and portable Agent Plugins.
- Preserve validated atomic handoffs, the 50-line limit and the local-only runtime.
- Add macOS and Linux tests, release packaging and directory submission guidance.
