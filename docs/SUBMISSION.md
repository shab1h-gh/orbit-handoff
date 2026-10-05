# Directory submission

Prepared on 5 October 2026. No public directory submission has been made, and no
approval or listing is implied by local validation.

## OpenAI public Plugins Directory

Release artifact: `orbit-handoff-plugin-1.0.1.zip`. Build it with
`npm run build:plugin`; the output is `dist/orbit-handoff-plugin-1.0.1.zip`.
The ZIP has portable `plugin.json` at its root, `skills/handoff`, OpenAI interface
metadata, a real PNG icon and the Claude compatibility manifest. It contains no
MCP server, hooks or account configuration. The category is Developer Tools.

Publisher steps, following the current [OpenAI submission guide](https://developers.openai.com/plugins/deploy/submission):

1. Open [OpenAI Plugins](https://platform.openai.com/plugins) under the intended
   organisation/project. Confirm publishing permission and complete developer
   identity verification as Shabih Anwar.
2. Choose **Upload new or existing plugin**, select the verified identity and
   upload the release ZIP.
3. Review automated metadata/skill findings, fix blocking errors, and check the
   imported listing. This is skills-only; there is no MCP connection to configure.
4. Complete any review fields and policy attestations requested in the dashboard,
   then submit the draft for review.
5. After approval, select **Publish plugin**. Only then advertise a directory
   listing. Local schema checks cannot replace dashboard validation or review.

Suggested review exercise: work in a disposable Git repository with a POSIX shell;
explicitly invoke `handoff` after a session with known changes and tests. Confirm
that the resulting file reflects only that evidence, is at most 50 lines and
overwrites prior state. Check that 51 lines and synthetic secret-bearing input
are rejected without losing the old file. No reviewer account is needed for the
plugin itself. The host agent still needs its normal authentication.

## Anthropic directory / community distribution

The public GitHub marketplace is separate from Anthropic directory approval.
Repository: `shab1h-gh/orbit-handoff`. Plugin folder: `plugin`. Release tag:
`v1.0.1`. Validate with:

```sh
claude plugin validate ./plugin --strict
claude plugin validate . --strict
```

The current [Anthropic submission route](https://claude.com/docs/plugins/submit)
is the developer portal, replacing earlier submission forms:

1. Open [the developer portal](https://claude.ai/directory/manage) with an eligible
   paid plan/role and connect the GitHub account that can push to this repository.
2. Select **Submit new → Plugin bundle**. Enter `shab1h-gh/orbit-handoff`, plugin
   path `plugin`, and tag `v1.0.1` for this immutable release (or `main` if you want
   future branch updates reviewed).
3. Run **Validate**, resolve blocking findings and check the listing details.
4. Complete data-handling questions, the publisher contact email and compliance
   acknowledgements. Orbit Handoff has no remote service or telemetry; its state
   is local and remains until the user removes it.
5. Review and submit. Wait for the provider's checks/review, then follow the
   portal's publishing step. Do not claim approval before it is granted.

The official `claude-plugins-official` marketplace has a separate partner route;
the current documentation directs publishers to their Anthropic partner contact.
No email, form or third-party submission has been sent automatically.

The [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist)
also checks README and licence presence, file sizes and names, and credentials.
The plugin README and licence are included, with no dependencies or executable
downloads inside the plugin. The provider portal applies further checks and
name-availability rules that the CLI cannot confirm locally.
