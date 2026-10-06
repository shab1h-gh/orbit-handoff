# npm publication and releases

Orbit Handoff is published as the public npm package `orbit-handoff`.

Versions `1.0.0` and `1.0.1` are immutable historical releases. Do not republish,
unpublish or move their tags.

Version `1.1.0` adds Orbit Setup and automatic checkpoint support, so it is a
feature release rather than a documentation-only patch.

The primary installation route remains:

```sh
npx orbit-handoff install
```

## Prepare v1.1.0

Before publication, run:

```sh
npm test
npm run validate
npm run scan:public
npm run build:plugin
npm pack --dry-run
npm pack
```

Inspect the npm tarball and portable plugin ZIP before publishing. Verify that
both canonical skills are present:

```text
plugin/skills/handoff/
plugin/skills/orbit-setup/
```

Smoke-test the packed package in a disposable project:

```sh
git init
npx --yes --package ./orbit-handoff-1.1.0.tgz orbit-handoff install --agent both --scope project --yes
npx --yes --package ./orbit-handoff-1.1.0.tgz orbit-handoff setup --agent both --yes
npx --yes --package ./orbit-handoff-1.1.0.tgz orbit-handoff check --agent both --scope project
```

Confirm:

- Codex and Claude receive both managed skills.
- `$orbit-setup` / `/orbit-setup` are discoverable through their native skill loaders.
- setup creates only missing living-doc templates and preserves existing equivalents.
- setup is idempotent.
- existing v1.0.x managed continuity blocks upgrade safely.
- `HANDOFF-STATE.md` stays local/Git-ignored and is not created by setup.
- handoff still enforces the 50-line cap, secret rejection and atomic overwrite.
- uninstall preserves setup-created living project docs and user-owned content.

## Publish

After all release checks pass:

```sh
npm publish ./orbit-handoff-1.1.0.tgz --access public --registry https://registry.npmjs.org/
```

Complete npm's normal browser/2FA challenge if prompted. Never weaken npm account
security to automate publication.

If the current agent cannot complete interactive authentication, stop with the
verified tarball and give the publisher the exact command above.

## Verify public distribution

After publication:

```sh
npm view orbit-handoff@latest version repository --registry https://registry.npmjs.org/
mkdir /tmp/orbit-handoff-public-smoke
cd /tmp/orbit-handoff-public-smoke
git init
npx orbit-handoff@latest install --agent both --scope project --yes
npx orbit-handoff@latest setup --agent both --yes
npx orbit-handoff@latest check --agent both --scope project
npx orbit-handoff@latest uninstall --agent both --scope project --yes
```

Verify `latest` resolves to `1.1.0` and repeat the setup/handoff smoke tests
against the actual registry package.

## Existing users

Standalone npm-managed installations update with:

```sh
npx orbit-handoff@latest update --agent both --scope project --yes
npx orbit-handoff@latest setup --agent both --yes
```

`update` installs the new `orbit-setup` skill and upgrades unchanged managed
skill files. `setup` upgrades the project's managed rules and creates only
missing living-doc templates.

Claude GitHub-marketplace users update through Claude:

```sh
claude plugin update orbit-handoff@orbit-handoff
```

Then run:

```text
/orbit-handoff:orbit-setup
```

Public provider-directory submissions are separate from npm/GitHub distribution.
See [SUBMISSION.md](SUBMISSION.md). A successful npm or GitHub marketplace install
does not prove public directory approval.
