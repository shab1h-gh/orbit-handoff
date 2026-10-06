# Privacy

Orbit Thread has no telemetry, remote service, external account or MCP server.

The Handoff writer processes input locally and saves `HANDOFF-STATE.md`. Orbit Setup writes local/project documentation, managed agent instructions, a small project configuration file and local ownership state. The CLI records hashes and the exact managed instruction blocks it adds.

Installation through npm or a plugin marketplace uses the relevant registry or Git host. Your coding agent's model calls and privacy settings remain governed by its provider. Orbit Thread's local writer and setup/configuration scripts do not send repository content anywhere.

Keep secrets, credentials, personal data and sensitive production data out of handoffs and living docs. Pattern checks are limited and are not a data-loss-prevention system. `HANDOFF-STATE.md` and Orbit Thread's local ownership state are Git-ignored by setup; ignoring a previously tracked file does not untrack it.
