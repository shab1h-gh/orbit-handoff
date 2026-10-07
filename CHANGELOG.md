# Changelog

## 1.1.0 — 7 October 2026

- Rename the product from **Orbit Handoff** to **Orbit Thread**.
- Publish the feature release under the new npm package name `orbit-thread`; keep historical `orbit-handoff` releases immutable.
- Add `orbit-setup` for Codex and Claude Code.
- Add `npx orbit-thread setup`; keep `init` as an alias.
- Create only missing lightweight PRODUCT, DESIGN, ARCHITECTURE, SECURITY and ROADMAP living docs while preserving existing equivalents.
- Add selective context-loading, in-place living-doc updates, fresh-context recovery and bounded-subagent rules.
- Add `configure` for project-specific subagent model/reasoning preferences stored in `.orbit-thread/config.json`.
- Add `doctor` for full continuity/config/document-health checks; keep `check` as the lightweight legacy managed-skill installation check.
- Allow Handoff to be invoked implicitly at meaningful verified checkpoints and completed coding tasks.
- Keep `HANDOFF-STATE.md` overwrite-only, evidence-only and capped at 50 lines.
- Migrate compatible Orbit Handoff project state to Orbit Thread while preserving locally edited managed files.
- Reduce CI noise by running feature work on pull requests, main on push, and package/release checks once after the cross-platform test matrix.

## 1.0.1 — 5 October 2026

- Confirm successful public npm publication and make `npx orbit-handoff install` the primary installation route.
- Remove stale pre-publication claims and record public package smoke testing.
- Update release and submission artifact references; directory submissions remain pending.
- Keep the installer, canonical skill and handoff writer unchanged.

## 1.0.0 — 5 October 2026

- Publish the proven handoff workflow as Orbit Handoff for Codex and Claude Code.
- Add interactive installation and ownership-aware init, check, update and uninstall.
- Package one canonical skill for Claude marketplaces and portable Agent Plugins.
- Preserve validated atomic handoffs, the 50-line limit and the local-only runtime.
- Add macOS and Linux tests, release packaging and directory submission guidance.
