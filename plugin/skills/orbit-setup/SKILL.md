---
name: orbit-setup
description: Set up or upgrade a coding project for token-efficient long-running work with Orbit Handoff. Use when the user invokes orbit-setup, asks to initialise Orbit project continuity, or wants lightweight living project docs and agent rules before development starts.
---

# Orbit Setup

Prepare the current project for efficient Codex and Claude Code sessions without overwriting existing project knowledge.

## Workflow

1. Resolve this skill's directory. Run its `scripts/setup_project.mjs` with Node, keeping the working directory inside the user's project:
   - Claude standalone: `node "${CLAUDE_SKILL_DIR}/scripts/setup_project.mjs" setup --agent both`
   - Codex: resolve the loaded skill directory and run the same script from there.
2. The script creates only missing living-document templates, preserves equivalent root/docs files, updates the managed Orbit blocks in `AGENTS.md` and `CLAUDE.md`, and ensures `HANDOFF-STATE.md` is Git-ignored.
3. Do not create `HANDOFF-STATE.md` during setup. The handoff skill creates it at the first meaningful checkpoint.
4. If the current conversation already contains clear, durable project facts, fill only the relevant TODOs in newly created docs. Do not scan the repository broadly or invent product, architecture, security or design decisions.
5. Report created, updated and preserved files concisely, then stop unless the user asked for additional work.

## Living docs

Orbit Setup prefers these files under `docs/` when no equivalent root/docs file already exists:

- `PRODUCT.md` — current product purpose, workflows, scope and constraints.
- `ARCHITECTURE.md` — current system shape, boundaries, persistence and runtime constraints.
- `SECURITY.md` — current trust boundaries, data/secrets controls and known risks.
- `ROADMAP.md` — current forward plan only.
- `DESIGN.md` — current design direction and durable UI rules.

These are living current-state documents, not changelogs. Future agents should update affected sections in place as implementation truth changes. Git is the history.

## Rules

- Preserve existing files and unrelated instructions. Never replace a user's existing project docs merely to standardise layout.
- Do not create duplicate root/docs versions of the same living document.
- Keep setup token-efficient: inspect only the target files and project facts needed for setup.
- Do not read secret files or write credentials, personal data or sensitive production data into project docs.
- Do not commit, push, merge, initialise Git or make other Git writes.
- The setup script may work before Git is initialised; in that case it uses the current working directory as the project root.
- Setup-created living docs are project files and are not removed by Orbit Handoff uninstall.
