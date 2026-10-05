# Privacy

Orbit Handoff has no telemetry, remote service, external account or MCP server.
The handoff writer processes stdin locally and saves `HANDOFF-STATE.md`. The CLI
stores installation hashes and the exact continuity blocks it adds, locally.

Installation through npm or a plugin marketplace uses the relevant registry or
Git host. Your coding agent's model calls and privacy settings remain governed by
its provider. Orbit Handoff's instructions and script do not send repository
content anywhere.

Keep secrets, credentials, personal data and sensitive production data out of
handoffs. The pattern check is limited; it is not a data-loss-prevention system.
Use `init` to add the handoff to `.gitignore`, and check that it is not already
tracked. Ignoring a file does not untrack it.
