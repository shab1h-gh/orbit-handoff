import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { setupProject, checkProject } from '../plugin/skills/orbit-setup/scripts/setup_project.mjs';

function fixture(t, git = true) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'orbit setup '));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  if (git) spawnSync('git', ['init', '-q'], { cwd: root });
  return root;
}

test('setup creates living docs and managed project rules idempotently', t => {
  const root = fixture(t);
  setupProject(root, ['codex','claude']);
  for (const name of ['PRODUCT.md','ARCHITECTURE.md','SECURITY.md','ROADMAP.md','DESIGN.md']) assert.equal(fs.existsSync(path.join(root,'docs',name)), true);
  assert.match(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'), /Orbit Handoff workflow/);
  assert.match(fs.readFileSync(path.join(root,'CLAUDE.md'),'utf8'), /Read and follow `AGENTS.md`/);
  assert.match(fs.readFileSync(path.join(root,'.gitignore'),'utf8'), /^# orbit-handoff:start/m);
  assert.equal(fs.existsSync(path.join(root,'HANDOFF-STATE.md')), false);
  const before = fs.readFileSync(path.join(root,'AGENTS.md'),'utf8');
  setupProject(root, ['codex','claude']);
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'), before);
  assert.equal(checkProject(root,['codex','claude']).ok, true);
});

test('setup preserves existing docs and unrelated instructions', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root,'docs'));
  fs.writeFileSync(path.join(root,'docs','ARCHITECTURE.md'), '# Existing architecture\n');
  fs.writeFileSync(path.join(root,'AGENTS.md'), '# Existing rules\nKeep me.\n');
  setupProject(root,['codex']);
  assert.equal(fs.readFileSync(path.join(root,'docs','ARCHITECTURE.md'),'utf8'), '# Existing architecture\n');
  assert.match(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'), /^# Existing rules\nKeep me\./);
  assert.equal(fs.existsSync(path.join(root,'CLAUDE.md')), false);
});

test('setup works before git init using cwd as project root', t => {
  const root = fixture(t, false);
  setupProject(root,['codex']);
  assert.equal(fs.existsSync(path.join(root,'docs','PRODUCT.md')), true);
});
