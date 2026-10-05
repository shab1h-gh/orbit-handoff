# Orbit Handoff

Carry the important state from one coding session into the next.

Orbit Handoff saves a concise, evidence-only `HANDOFF-STATE.md` at your repository
root when you explicitly request a handoff. It records the objective, current
phase, meaningful completed work, actual tests, decisions, blockers and immediate
next steps. The hard limit is 50 lines. Repository state and tracked documentation
remain authoritative.

In Claude Code, invoke `/orbit-handoff:handoff` after installing this plugin. In
Codex, the skill is named `handoff` and is invoked as `$handoff`. The writer needs a
POSIX shell, Git and standard Unix utilities, with access to a repository. Ordinary
chat without shell access cannot save that file.

The local writer rejects empty, oversized and obviously secret-bearing input
before an atomic replacement. Failed validation preserves the previous file and
cleans up temporary files. It makes no network calls and does not mutate Git.
There is no MCP server, telemetry or external account. Secret pattern checks are
limited; keep all credentials and sensitive data out of handoffs.

Standalone installation and optional repository continuity configuration are
covered in the [project README](https://github.com/shab1h-gh/orbit-handoff#readme).
This folder contains one shared skill and both provider manifests. Public
directory listing remains subject to each provider's review and approval.

Licensed under MIT by Shabih Anwar.
