import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../plugin/skills/handoff/scripts/write_handoff.sh', import.meta.url));
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'orbit handoff runtime '));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}
const write = (dir, input, args = [], env = process.env) => spawnSync('sh', [script, ...args], { cwd: dir, input, encoding: 'utf8', env });
const state = dir => fs.readFileSync(path.join(dir, 'HANDOFF-STATE.md'), 'utf8');
const residue = dir => fs.readdirSync(dir).filter(name => name.startsWith('.handoff.'));

test('first successful handoff and overwrite preserve exact bytes in a path with spaces', t => {
  const dir = fixture(t);
  assert.equal(write(dir, '# Handoff State\nFirst session\n').status, 0);
  assert.equal(state(dir), '# Handoff State\nFirst session\n');
  assert.equal(write(dir, '# Handoff State\nSecond session\n').status, 0);
  assert.equal(state(dir), '# Handoff State\nSecond session\n');
  assert.deepEqual(residue(dir), []);
  assert.equal(fs.statSync(path.join(dir, 'HANDOFF-STATE.md')).mode & 0o777, 0o600);
});

for (const newline of [true, false]) {
  test(`50 lines accepted and 51 rejected, trailing newline ${newline}`, t => {
    const dir = fixture(t);
    const content = n => Array.from({ length: n }, (_, i) => `Evidence ${i + 1}`).join('\n') + (newline ? '\n' : '');
    assert.equal(write(dir, content(50)).status, 0);
    assert.equal(state(dir), content(50));
    assert.equal(write(dir, content(51)).status, 1);
    assert.equal(state(dir), content(50));
    assert.deepEqual(residue(dir), []);
  });
}

test('empty input rejected before creating a state file', t => {
  const dir = fixture(t);
  assert.equal(write(dir, '').status, 1);
  assert.equal(fs.existsSync(path.join(dir, 'HANDOFF-STATE.md')), false);
  assert.deepEqual(residue(dir), []);
});

test('private key and synthetic credential patterns rejected without disclosure; old valid state survives', t => {
  const dir = fixture(t);
  const previous = '# Handoff State\nVerified baseline\n';
  assert.equal(write(dir, previous).status, 0);
  const synthetic = [
    ['-----BEGIN ', 'RSA PRIVATE KEY-----'].join(''),
    'AKIA' + 'A'.repeat(16),
    'sk_' + 'live_' + 'a'.repeat(20),
    'ghp_' + 'a'.repeat(24),
    'api_key=' + 'a'.repeat(20),
    'token: ' + 'a'.repeat(20),
    'github_pat_' + 'a'.repeat(24),
    'xoxb-' + 'a'.repeat(24),
    'eyJ' + 'a'.repeat(12) + '.' + 'b'.repeat(12) + '.signature',
  ];
  for (const input of ['', ...synthetic]) {
    const result = write(dir, input);
    assert.equal(result.status, 1);
    if (input) assert.equal(result.stdout.includes(input) || result.stderr.includes(input), false);
    assert.equal(state(dir), previous);
    assert.deepEqual(residue(dir), []);
  }
});

test('resolves repository root from nested directories and accepts explicit target path', t => {
  const dir = fixture(t);
  const nested = path.join(dir, 'sub folder');
  fs.mkdirSync(nested);
  assert.equal(write(nested, 'Root evidence').status, 0);
  assert.equal(state(dir), 'Root evidence');
  const target = path.join(nested, 'custom state.md');
  assert.equal(write(dir, 'Explicit target', [target]).status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), 'Explicit target');
});

test('Git index and refs remain unchanged; network commands are never invoked', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'tracked.txt'), 'baseline');
  spawnSync('git', ['add', 'tracked.txt'], { cwd: dir });
  const index = fs.readFileSync(path.join(dir, '.git/index'));
  const head = fs.readFileSync(path.join(dir, '.git/HEAD'));
  const guards = path.join(dir, 'guards');
  fs.mkdirSync(guards);
  for (const command of ['curl', 'wget', 'ssh', 'nc', 'npm']) fs.writeFileSync(path.join(guards, command), '#!/bin/sh\nprintf invoked > "$ORBIT_NETWORK_LOG"\nexit 90\n', { mode: 0o755 });
  const log = path.join(dir, 'network.log');
  assert.equal(write(dir, 'Local evidence', [], { ...process.env, PATH: `${guards}:${process.env.PATH}`, ORBIT_NETWORK_LOG: log }).status, 0);
  assert.equal(fs.existsSync(log), false);
  assert.deepEqual(fs.readFileSync(path.join(dir, '.git/index')), index);
  assert.deepEqual(fs.readFileSync(path.join(dir, '.git/HEAD')), head);
  assert.deepEqual(residue(dir), []);
});

test('rename failure cleans temporary residue', t => {
  const dir = fixture(t);
  const guard = path.join(dir, 'guard');
  fs.mkdirSync(guard);
  fs.writeFileSync(path.join(guard, 'mv'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  assert.equal(write(dir, 'Old valid state').status, 0);
  assert.equal(write(dir, 'New state', [], { ...process.env, PATH: `${guard}:${process.env.PATH}` }).status, 1);
  assert.equal(state(dir), 'Old valid state');
  assert.deepEqual(residue(dir), []);
});
