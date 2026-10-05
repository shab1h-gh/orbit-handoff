---
name: handoff
description: Use Orbit Handoff to overwrite HANDOFF-STATE.md with a compact (50 lines max), secret-free end-of-session handoff of verified state, decisions, risks and next steps when the user explicitly asks for a handoff or invokes handoff.
disable-model-invocation: true
---

# Orbit Handoff

Write a concise, factual handoff for the next session: operational state only, not a changelog or transcript.

## Workflow

1. Gather state in one call: `date '+%d-%m-%Y %H:%M'; git status --short --branch; git diff --stat HEAD; git log -1 --oneline`. Reuse the `HANDOFF-STATE.md` read at session start if it is still in context; otherwise read it. Consult only files changed or discussed this session.
2. Reconcile the previous handoff with current evidence: keep only items still true and outstanding; drop resolved, superseded or already-verified ones. If no handoff exists, derive state from committed project docs.
3. Pipe the new content to this skill's `scripts/write_handoff.sh`, resolving the script relative to the loaded skill directory (not the working directory). In Claude Code, `${CLAUDE_SKILL_DIR}/scripts/write_handoff.sh` resolves that location; in Codex, use the skill directory supplied when this skill is loaded. Quote the full script path and run it with `sh`. It overwrites `HANDOFF-STATE.md` at the repo root (never append), rejects empty, over-50-line or obviously secret-bearing content, and prints the line count. Do not re-read the file afterwards; if rejected, fix and re-run.
4. Stop. Do not start new implementation. Reply with a short confirmation, the line count and the first next step.

## Format

```markdown
# Handoff State

Updated: DD-MM-YYYY HH:MM

## Current objective
## Completed this session
## Current state
## Decisions
## Open issues / risks
## Immediate next steps
## Verification
```

- Omit empty sections; no filler. Short bullets and paths, not narrative.
- Aim for about 30 lines (hard cap 50). State each fact once; e.g. do not restate completed work under Verification.
- Immediate next steps: ordered, actionable and genuinely outstanding only.
- Verification: include exact commands only if actually run or they are the immediate next action.

## Rules

- Only update the handoff when explicitly invoked. Use read-only Git inspection; never commit, stage, amend, push or otherwise mutate Git. Do not use the network. Repository state and relevant tracked documentation override stale handoff context.
- Include the current objective and phase, meaningful completed work, actual verification, material decisions, blockers or risks, and concrete immediate next steps when evidence exists.
- Evidence only. Never claim a test, deployment, commit or push happened without evidence; keep unproven items as outstanding or unverified. Facts verified this session are valid even if not yet in repo docs.
- No secrets, credentials, tokens, private keys, recovery codes, `.env`/`.dev.vars` values, personal data or sensitive production data. The script's pattern check is a backstop, not a substitute.
- Never record the current HEAD SHA: committing or amending alongside the handoff would make it stale. Describe it semantically (e.g. "Phase 0 baseline committed on main"). Exact SHAs are allowed only for immutable earlier revisions (releases, deployments, rollback points). Never keep a known-stale SHA.
- `HANDOFF-STATE.md` is intended as Git-ignored local state: never make committing it a next step. If it is not ignored, tell the user to run `npx orbit-handoff init`; do not silently change repository configuration during handoff. Report genuine staged, unstaged or untracked project changes normally; never call the tree clean or committed without evidence.
- Durable architecture, security, roadmap or project decisions belong in tracked docs (`docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ROADMAP.md`), not only in the handoff.
