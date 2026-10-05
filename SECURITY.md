# Security

Orbit Handoff keeps the handoff in your repository. Its writer makes no network
requests and does not mutate Git. It validates a temporary file before replacing
the previous handoff with a same-directory atomic rename. Failed validation leaves
the previous file intact and removes the temporary file. New handoffs inherit
`mktemp`'s restrictive permissions.

The secret check is a backstop for recognisable credential and private-key
patterns. It cannot identify every secret or piece of personal data. Review the
content and keep sensitive material out of it. Rejection messages include line
numbers, never matched content. The skill instructs agents to record evidence only.

The npm CLI copies the same canonical files to each supported agent. It records
file hashes, refuses to overwrite an unmanaged skill or locally edited installation,
and preserves edited files during uninstall. It refuses symlinked destinations.
Continuity configuration uses delimited, ownership-tracked blocks; unrelated
instructions are preserved. There are no dependencies or postinstall hooks.

`npx` and plugin installation may access their registries or GitHub. Your coding
agent uses its own model provider and permissions; Orbit Handoff does not change
those. The local writer does not enforce a sandbox around the agent.

Please report vulnerabilities privately through the repository's
[security advisory form](https://github.com/shab1h-gh/orbit-handoff/security/advisories/new).
Include a minimal reproduction with synthetic data and affected versions. Do not
put live secrets or private project state in public issues.
