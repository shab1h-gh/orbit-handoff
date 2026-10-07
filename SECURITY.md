# Security

Orbit Thread keeps handoff and project-continuity state local.

The Handoff writer makes no network requests and does not mutate Git. It validates a temporary file before replacing the previous handoff with a same-directory atomic rename. Failed validation leaves the previous file intact and removes temporary residue. New handoffs inherit `mktemp`'s restrictive permissions.

The secret check is a backstop for recognisable credential/private-key patterns, not a complete DLP system. Rejection messages include line numbers rather than matched content.

The npm CLI copies the same canonical skills to supported agents. It records file hashes, refuses unmanaged skill collisions or locally edited managed installations, preserves edited files during uninstall and rejects symlinked destinations. Setup uses ownership-tracked instruction blocks, preserves unrelated instructions and existing living docs, and writes project subagent preferences only into Orbit Thread's managed AGENTS.md block.

There are no runtime npm dependencies or postinstall hooks.

`npx` and plugin installation may access their registries or GitHub. Your coding agent uses its own provider and permissions; Orbit Thread does not expand those permissions or sandbox the host agent.

Please report vulnerabilities privately through the repository security advisory form after the repository rename:
`https://github.com/shab1h-gh/orbit-thread/security/advisories/new`

Use synthetic data in reports. Never put live secrets or private project state in public issues.
