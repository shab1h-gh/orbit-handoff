# Contributing

Thanks for helping improve Orbit Handoff. Open an issue for a bug or a focused
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

Keep the canonical skill in `plugin/skills/handoff`. Do not create agent-specific
copies of the workflow. The two plugin manifests describe the same skill tree.
Installer tests use disposable projects and must preserve user content. Runtime
changes must keep the 50-line cap, validation before atomic replacement, secret
backstop, no temporary residue, no network and no Git mutation.

If you change packaging, also run `claude plugin validate ./plugin --strict` and
`claude plugin validate . --strict` with the current Claude Code CLI. Public
directory validation is a separate publisher step; local tests do not imply
approval. Use British English in documentation.
