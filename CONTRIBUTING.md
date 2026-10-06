# Contributing

Thanks for helping improve Orbit Handoff. Open an issue for a bug or focused
proposal, or send a pull request with a clear explanation and relevant tests.
Use synthetic repositories and credentials in reproductions.

You need Node.js 20 or newer, Python 3 for packaging, Git and a POSIX shell.
The project has no npm dependencies.

```sh
npm test
npm run validate
npm run scan:public
npm run build:plugin
npm pack --dry-run
```

Keep the canonical skills in:

```text
plugin/skills/handoff/
plugin/skills/orbit-setup/
```

Do not create divergent Codex and Claude implementations.

Changes to Handoff must preserve the 50-line cap, overwrite-only current state,
validation before atomic replacement, secret backstop, failed-write preservation,
no temporary residue, no network calls and no Git mutation.

Changes to Orbit Setup must preserve existing project documentation and unrelated
instructions, avoid duplicate root/docs files, remain idempotent, and keep living
docs as current-state documents rather than changelogs.

Installer/update tests should use disposable projects and verify migration from
older managed installs, edited-file preservation and user-owned content.

If you change packaging, also run:

```sh
claude plugin validate ./plugin --strict
claude plugin validate . --strict
```

Public-directory validation is a separate publisher step; local checks do not
imply OpenAI or Anthropic approval.

Use British English in documentation.
