# Publish the prepared npm release

The package name is `orbit-handoff`; the prepared version is `1.0.0`.
No alternative package name is permitted. The release archive is
`orbit-handoff-1.0.0.tgz`, attached to the GitHub release.

Publisher login is confirmed. Publication was rejected with `E403` because npm
requires two-factor authentication for publishing. Enable/complete npm's normal
2FA flow, then publish the prepared archive. The commands are:

```sh
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
npm publish ./orbit-handoff-1.0.0.tgz --access public --registry https://registry.npmjs.org/
```

Complete npm's normal browser or 2FA challenge if prompted. Do not disable 2FA
or weaken account security. Recheck that the exact name is available before a
delayed first publication; if someone else owns it, stop and report the conflict.
The current [npm 2FA documentation](https://docs.npmjs.com/configuring-two-factor-authentication/)
describes the account setup. An npm login alone is not sufficient to publish.

After publication, smoke-test from a disposable empty Git repository:

```sh
git init
npx orbit-handoff@latest install
npx orbit-handoff check
npx orbit-handoff init --yes
npx orbit-handoff check
npx orbit-handoff uninstall --yes
```

Confirm both selected agents receive the canonical skill and unrelated files are
preserved. Update the validation record with the registry version and actual
smoke-test result. Public directory submissions are separate steps described in
[SUBMISSION.md](SUBMISSION.md).
