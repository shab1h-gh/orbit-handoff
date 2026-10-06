# Directory submission

Updated 6 October 2026.

Public directory review is separate from npm, GitHub and standalone skill
installation. This repository cannot see an account-side review decision unless
the provider exposes it publicly, so the publisher dashboard remains authoritative.

## OpenAI / ChatGPT Plugins Directory

The v1.1.0 submission artifact is:

```text
dist/orbit-handoff-plugin-1.1.0.zip
```

Build it with:

```sh
npm run build:plugin
```

The ZIP contains portable `plugin.json`, both canonical skills:

```text
skills/handoff/
skills/orbit-setup/
```

plus OpenAI interface metadata, the listing icon and Claude compatibility
manifest. Orbit Handoff needs no MCP server or external account.

### Check an existing submission

Open the OpenAI Plugins publisher dashboard:

```text
https://platform.openai.com/plugins
```

Use the same organisation/project and verified publisher identity used for the
submission. The dashboard status is authoritative for whether the draft is
pending review, requires changes, has been approved, or is published.

Do not infer approval from:

- npm publication;
- Codex standalone installation;
- GitHub release artefacts;
- the repository being public;
- the plugin ZIP passing local validation.

If an older v1.0.x package is already under review or approved, do not assume
changing `main` updates that submission. Use the publisher dashboard's current
update/version workflow for the new v1.1.0 ZIP after this release is verified.

### Submission/update flow

1. Complete local release validation and build the v1.1.0 ZIP.
2. Open the Plugins publisher dashboard with the verified publisher identity.
3. Open the existing Orbit Handoff listing if one exists; otherwise create a new
   plugin submission.
4. Upload the validated v1.1.0 ZIP through the dashboard's current version/update
   flow.
5. Review automated findings and listing metadata.
6. Complete any required policy/data-handling attestations.
7. Submit the new version for review.
8. Only advertise public availability after the dashboard says the listing is
   approved/published.

Suggested reviewer exercise: run Orbit Setup in a disposable project, confirm
that it preserves existing docs while creating missing living-doc templates,
then run Handoff after known changes/tests and verify that the resulting
`HANDOFF-STATE.md` reflects only current evidence, is at most 50 lines and
overwrites prior state.

## Anthropic / Claude public marketplace

The GitHub marketplace route is independent of Anthropic's public directory.

This works without public-directory approval:

```text
/plugin marketplace add shab1h-gh/orbit-handoff
/plugin install orbit-handoff@orbit-handoff
```

or:

```sh
claude plugin marketplace add shab1h-gh/orbit-handoff
claude plugin install orbit-handoff@orbit-handoff
```

A successful GitHub marketplace installation therefore does **not** mean Orbit
Handoff should appear in Claude's public Skills/Plugins marketplace.

For public-directory submission/status, use Anthropic's current developer
management surface:

```text
https://claude.ai/directory/manage
```

Connect the GitHub account that owns/pushes to `shab1h-gh/orbit-handoff`, open
the existing submission if one exists, and check its current review/publishing
state there.

For v1.1.0, validate the plugin before submitting/updating:

```sh
claude plugin validate ./plugin --strict
claude plugin validate . --strict
```

Then submit the repository/plugin path and the immutable release tag once v1.1.0
has been tagged. Until that release exists, do not claim the v1.1.0 public
listing is available.

The official/public marketplace may have additional eligibility, review and
publisher requirements that the GitHub marketplace route does not.

## General rule

Provider dashboard state wins over repository documentation.

If a provider changes its submission workflow, update this file to current truth
rather than appending historical instructions. Git history already records the
old process.
