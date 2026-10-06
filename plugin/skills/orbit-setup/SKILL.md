---
name: orbit-setup
description: Set up or upgrade a coding project for token-efficient long-running work with Orbit Thread. Use when the user invokes orbit-setup, asks to initialise project continuity, wants lightweight living project docs and agent rules before development, or asks to configure Orbit Thread project workflow.
---

# Orbit Thread Setup

Prepare the current project for efficient Codex and Claude Code sessions without overwriting existing project knowledge.

## Workflow

1. Resolve this skill's directory and run `scripts/setup_project.mjs` with Node from inside the user's project:
   - Claude standalone: `node "${CLAUDE_SKILL_DIR}/scripts/setup_project.mjs" setup --agent both`
   - Codex: resolve the loaded skill directory and run the same script from there.
2. The script creates only missing living-document templates, preserves equivalent root/docs files, updates the managed Orbit Thread blocks in `AGENTS.md` and `CLAUDE.md`, creates `.orbit-thread/config.json`, and ensures local handoff/tool state is Git-ignored.
3. Do not create `HANDOFF-STATE.md` during setup. The handoff skill creates it at the first meaningful checkpoint.
4. If the conversation already contains clear durable project facts, fill only relevant TODOs in newly created docs. Do not broadly scan the repository or invent product, architecture, security or design decisions.
5. Report created, updated and preserved files concisely.

## Project shape

Orbit Thread prefers these living docs under `docs/` when no equivalent root/docs file already exists:

- `PRODUCT.md` — product purpose, workflows, scope and constraints.
- `DESIGN.md` — durable visual/interaction rules.
- `ARCHITECTURE.md` — system shape, boundaries, persistence and operations.
- `SECURITY.md` — trust boundaries, controls and known risks.
- `ROADMAP.md` — forward-looking current plan only.

These are living current-state documents, not changelogs. Update affected sections in place as implementation truth changes; Git is the history.

## Rules

- Preserve existing files and unrelated instructions. Never replace project docs merely to standardise layout or create duplicate root/docs copies.
- Keep setup token-efficient: inspect only target files and facts needed for setup.
- Do not read secret files or write credentials, personal data or sensitive production data into project docs.
- Do not commit, push, merge, initialise Git or make other Git writes.
- Setup may run before Git is initialised; then the current directory is the project root.
- Setup-created living docs and `.orbit-thread/config.json` are project-owned and are preserved on uninstall.
- For subagent preferences, use the npm CLI after setup, for example:
  `npx orbit-thread configure --agent claude --model "Claude Sonnet 5.5" --effort low`
  or `npx orbit-thread configure --agent codex --model "GPT-6.1 Sol" --reasoning high`.
