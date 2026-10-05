# npm publication and patch releases

`orbit-handoff@1.0.0` is published on the public npm registry. Its repository,
homepage and issue links point to `shab1h-gh/orbit-handoff`. The earlier publication
failure is superseded by the successful manual publication. Never republish,
unpublish or move the v1.0.0 release or tag.

Version `1.0.1` is a documentation-only patch because npm's immutable v1.0.0
archive contains the old README. The installer, skill and writer are unchanged.
The primary installation route is:

```sh
npx orbit-handoff install
```

## Prepare and publish

Run the repository checks, inspect both archives and smoke-test the npm tarball
in a disposable Git repository before publishing:

```sh
npm test
npm run validate
npm run scan:public
npm run build:plugin
npm pack --dry-run
npm pack
npm publish ./orbit-handoff-1.0.1.tgz --access public --registry https://registry.npmjs.org/
```

Complete npm's normal browser or 2FA challenge if prompted. If the current
session cannot complete authentication, give the publisher the exact command
above. Do not disable 2FA or weaken account security. The package name remains
`orbit-handoff`; no alternative package name is permitted.

## Verify public distribution

```sh
npm view orbit-handoff@latest version repository --registry https://registry.npmjs.org/
git init
npx orbit-handoff@latest install --agent both --scope project --yes
npx orbit-handoff@latest check
npx orbit-handoff@latest init --agent both --yes
npx orbit-handoff@latest install --agent both --scope project --yes
npx orbit-handoff@latest check
npx orbit-handoff@latest uninstall --agent both --scope project --yes
```

Confirm both agents receive identical canonical skill files, configuration is
idempotent, and unrelated or edited files survive uninstall. Exercise the writer
with `sh` as instructed by the skill, checking creation, replacement, invalid-input
preservation and Git ignore behaviour. Record the actual registry version and
smoke-test results in [VALIDATION.md](VALIDATION.md).

Public directory submissions are separate publisher steps described in
[SUBMISSION.md](SUBMISSION.md). Neither OpenAI nor Anthropic approval is implied
by npm publication or GitHub marketplace availability.
