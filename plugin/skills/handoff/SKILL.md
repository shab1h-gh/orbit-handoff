---
name: handoff
description: Use Orbit Handoff to overwrite HANDOFF-STATE.md with a compact, secret-free checkpoint of verified coding state. Invoke when the user asks for a handoff, when Orbit project instructions require a meaningful checkpoint, before a fresh/cleared session, or just before finalising a completed coding task in a project configured for Orbit checkpoints.
---

# Orbit Handoff

Write concise current operational state for the next session, not a changelog or transcript.

## When to run

Run when explicitly invoked. In projects configured by Orbit Setup, also run:

- after each completed user task, before the final reply;
- after a meaningful, verified milestone during long-running work;
- before `/clear`, session end, or a usage/context stop when warning is available.

Do not checkpoint trivial edits.

## Workflow

1. Gather state in one call: `date '+%d-%m-%Y %H:%M'; git status --short --branch; git diff --stat HEAD; git log -1 --oneline`. If Git is unavailable, record that fact and use only current-session evidence. Reuse the handoff already read this session when possible; otherwise read it once. Consult only files changed or discussed for the current work.
2. Reconcile previous state with current evidence. Keep only facts still true and work still relevant. Drop resolved, superseded or duplicated history. Repository state and relevant tracked docs override stale handoff content.
3. Pipe the new Markdown to this skill's `scripts/write_handoff.sh`, resolving the script relative to the loaded skill directory. In Claude Code, `${CLAUDE_SKILL_DIR}/scripts/write_handoff.sh` resolves that location; in Codex, use the skill directory supplied when this skill is loaded. Quote the full path and run it with `sh`.
4. The writer overwrites repo-root `HANDOFF-STATE.md` atomically, rejects empty/over-50-line/obviously secret-bearing content, and prints the line count. Do not re-read the file after a successful write.
5. If this is an intermediate checkpoint and the current user request still has unfinished work, continue that work. If the task/session is complete, return the normal final response with a brief note only when useful.

## Format

```markdown
# Handoff State

Updated: DD-MM-YYYY HH:MM

## Current objective
## Completed milestones
## In progress
## Current state
## Decisions
## Open issues / risks
## Immediate next steps
## Verification
```

- Omit empty sections. Use short bullets and paths, not narrative.
- Aim for about 30 lines; hard cap 50.
- State each fact once.
- Immediate next steps must be genuinely outstanding and actionable.
- Verification may include exact commands only when they actually ran or are the immediate next action.

## Rules

- Use read-only Git inspection only. Never commit, stage, amend, push, reset or otherwise mutate Git.
- Evidence only. Never claim a test, deployment, commit, push or external action happened without evidence. Keep unverified items explicitly outstanding.
- Never include secrets, credentials, tokens, private keys, recovery codes, `.env`/`.dev.vars` values, personal data or sensitive production data.
- Never record the current HEAD SHA. It becomes stale easily. Exact SHAs are allowed only for immutable earlier revisions such as releases, deployments or rollback points.
- `HANDOFF-STATE.md` is local current state, intended to be Git-ignored. Never append history and never make committing it a next step.
- Durable product, design, architecture, security or roadmap truth belongs in tracked living docs. Orbit Handoff does not replace those files.
- At an intermediate checkpoint, do not stop merely because the handoff was written. Continue the user's remaining requested work.
