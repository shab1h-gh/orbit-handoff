import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const source = path.join(packageRoot, 'plugin/skills/handoff');
const marker = '.orbit-handoff.json';
const agents = ['codex', 'claude'];
const begin = '<!-- orbit-handoff:start -->';
const end = '<!-- orbit-handoff:end -->';
const ignoreBegin = '# orbit-handoff:start';
const ignoreEnd = '# orbit-handoff:end';
const instructions = `${begin}\n## Orbit Handoff\n\n- Read HANDOFF-STATE.md at session start if present.\n- Inspect the current Git state and read relevant tracked project documentation.\n- Repository state and tracked documentation override stale handoff context.\n- Only update HANDOFF-STATE.md when the handoff skill is explicitly invoked.\n${end}\n`;
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const exists = p => { try { fs.lstatSync(p); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };
const text = p => exists(p) ? fs.readFileSync(p, 'utf8') : '';

function safePath(p) {
  let cursor = path.resolve(p);
  while (true) {
    if (exists(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Refusing symlink: ${cursor}`);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

function atomicWrite(p, content) {
  safePath(p);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const temporary = path.join(path.dirname(p), `.orbit-handoff-${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: exists(p) ? fs.statSync(p).mode & 0o777 : 0o644 });
    fs.renameSync(temporary, p);
  } finally { if (exists(temporary)) fs.unlinkSync(temporary); }
}

function files(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${relative}`);
    return entry.isDirectory() ? files(path.join(dir, entry.name), relative) : [relative];
  }).sort();
}

const bundled = () => Object.fromEntries(files(source).map(name => [name, fs.readFileSync(path.join(source, name))]));
function location(agent, scope, root) {
  return path.join(scope === 'user' ? os.homedir() : root, agent === 'codex' ? '.agents' : '.claude', 'skills/handoff');
}

function readOwnership(dir) {
  safePath(dir);
  const p = path.join(dir, marker);
  if (!exists(p)) return null;
  const state = JSON.parse(text(p));
  if (state.product !== 'orbit-handoff' || state.schema !== 1 || typeof state.version !== 'string' ||
      !state.files || typeof state.files !== 'object' || Array.isArray(state.files)) throw new Error(`Invalid ownership file: ${p}`);
  for (const [name, hash] of Object.entries(state.files)) {
    if (!name || name === marker || path.posix.isAbsolute(name) || name.includes('\\') || name.split('/').some(part => ['.', '..', ''].includes(part)) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid ownership entry: ${p}`);
  }
  return state;
}

function preflightInstall(dir, updating) {
  const state = readOwnership(dir);
  if (exists(dir) && !state) throw new Error(`An unmanaged handoff already exists at ${dir}; move it aside yourself before installing.`);
  if (updating && !state) return false;
  if (state) {
    for (const [name, hash] of Object.entries(state.files)) {
      const p = path.join(dir, name);
      safePath(p);
      if (!exists(p) || digest(fs.readFileSync(p)) !== hash) throw new Error(`Managed file was edited or removed: ${p}. Preserve your changes before updating.`);
    }
    for (const name of Object.keys(bundled())) {
      if (exists(path.join(dir, name)) && !Object.hasOwn(state.files, name)) throw new Error(`Unrelated file conflicts with this release: ${path.join(dir, name)}`);
    }
  }
  return true;
}

function install(dir) {
  const previous = readOwnership(dir);
  const content = bundled();
  for (const [name, data] of Object.entries(content)) atomicWrite(path.join(dir, name), data);
  for (const name of Object.keys(previous?.files ?? {})) if (!Object.hasOwn(content, name)) fs.unlinkSync(path.join(dir, name));
  atomicWrite(path.join(dir, marker), JSON.stringify({ product: 'orbit-handoff', schema: 1, version: pkg.version,
    files: Object.fromEntries(Object.entries(content).map(([name, data]) => [name, digest(data)])) }, null, 2) + '\n');
}

function prune(dir, boundary) {
  while (dir !== boundary && exists(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

function uninstall(dir) {
  const state = readOwnership(dir);
  if (!state) { console.log(`No managed installation: ${dir}`); return; }
  const retained = {};
  for (const [name, hash] of Object.entries(state.files)) {
    const p = path.join(dir, name);
    safePath(p);
    if (!exists(p)) continue;
    if (digest(fs.readFileSync(p)) === hash) { fs.unlinkSync(p); prune(path.dirname(p), dir); }
    else { retained[name] = hash; console.log(`Preserved edited file: ${p}`); }
  }
  if (Object.keys(retained).length) atomicWrite(path.join(dir, marker), JSON.stringify({ ...state, files: retained }, null, 2) + '\n');
  else fs.unlinkSync(path.join(dir, marker));
  prune(dir, path.dirname(dir));
}

function repoRoot(cwd) {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return cwd; }
}

function configState(root) {
  const p = path.join(root, '.orbit-handoff/state.json');
  safePath(p);
  if (!exists(p)) return { product: 'orbit-handoff', schema: 1, additions: {} };
  const state = JSON.parse(text(p));
  if (state.product !== 'orbit-handoff' || state.schema !== 1 || !state.additions || typeof state.additions !== 'object' || Array.isArray(state.additions)) throw new Error(`Invalid continuity ownership: ${p}`);
  for (const [name, addition] of Object.entries(state.additions)) {
    if (!['AGENTS.md', 'CLAUDE.md', '.gitignore'].includes(name) || typeof addition.inserted !== 'string' || typeof addition.created !== 'boolean') throw new Error(`Invalid continuity ownership entry: ${p}`);
  }
  return state;
}

function persistConfig(root, state) {
  const p = path.join(root, '.orbit-handoff/state.json');
  if (Object.keys(state.additions).length) atomicWrite(p, JSON.stringify(state, null, 2) + '\n');
  else if (exists(p)) { fs.unlinkSync(p); if (fs.readdirSync(path.dirname(p)).length === 0) fs.rmdirSync(path.dirname(p)); }
}

function planConfig(root, selected) {
  const state = configState(root);
  const changes = [];
  for (const name of [...selected.map(agent => agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md'), '.gitignore']) {
    const p = path.join(root, name);
    safePath(p);
    const before = text(p);
    if (Object.hasOwn(state.additions, name)) {
      const owned = state.additions[name].inserted;
      if (!before.includes(owned) || before.indexOf(owned) !== before.lastIndexOf(owned)) throw new Error(`Managed block edited or duplicated in ${name}; review it before running init.`);
      const first = name === '.gitignore' ? ignoreBegin : begin;
      const last = name === '.gitignore' ? ignoreEnd : end;
      if (before.split(first).length !== 2 || before.split(last).length !== 2) throw new Error(`Managed block edited or duplicated in ${name}; review it before running init.`);
      const block = name === '.gitignore' ? `${ignoreBegin}\nHANDOFF-STATE.md\n${ignoreEnd}\n` : instructions;
      const inserted = (owned.match(/^(?:\r?\n)*/)?.[0] ?? '') + block;
      if (inserted !== owned) {
        state.additions[name].inserted = inserted;
        changes.push({ p, content: before.replace(owned, inserted), name });
      }
      continue;
    }
    const first = name === '.gitignore' ? ignoreBegin : begin;
    const last = name === '.gitignore' ? ignoreEnd : end;
    if (before.includes(first) || before.includes(last)) throw new Error(`Unowned or malformed Orbit Handoff block in ${name}; refusing to overwrite it.`);
    if (name === '.gitignore' && before.split(/\r?\n/).some(line => line === 'HANDOFF-STATE.md' || line === '/HANDOFF-STATE.md')) continue;
    const block = name === '.gitignore' ? `${ignoreBegin}\nHANDOFF-STATE.md\n${ignoreEnd}\n` : instructions;
    const inserted = (before ? (before.endsWith('\n') ? '\n' : '\n\n') : '') + block;
    state.additions[name] = { inserted, created: !exists(p) };
    changes.push({ p, content: before + inserted, name });
  }
  return { state, changes };
}

function removeConfig(root, selected) {
  const state = configState(root);
  const names = selected.map(agent => agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md');
  for (const name of names) removeAddition(root, state, name);
  if (!state.additions['AGENTS.md'] && !state.additions['CLAUDE.md']) removeAddition(root, state, '.gitignore');
  persistConfig(root, state);
}

function removeAddition(root, state, name) {
  const addition = state.additions[name];
  if (!addition) return;
  const p = path.join(root, name);
  safePath(p);
  const before = text(p);
  if (!exists(p)) { delete state.additions[name]; return; }
  const index = before.indexOf(addition.inserted);
  if (index < 0 || index !== before.lastIndexOf(addition.inserted)) { console.log(`Preserved edited managed block: ${name}`); return; }
  const after = before.slice(0, index) + before.slice(index + addition.inserted.length);
  if (!after && addition.created) fs.unlinkSync(p);
  else atomicWrite(p, after);
  delete state.additions[name];
}

function status(root, selected, scope) {
  let complete = true;
  for (const agent of selected) {
    const dir = location(agent, scope, root);
    const state = readOwnership(dir);
    let label = exists(dir) ? 'unmanaged skill' : 'not installed';
    if (state) {
      const contents = bundled();
      const intact = Object.entries(state.files).every(([name, hash]) => { const p = path.join(dir, name); safePath(p); return exists(p) && digest(fs.readFileSync(p)) === hash; });
      const current = intact && Object.keys(state.files).length === Object.keys(contents).length && Object.entries(contents).every(([name, data]) => state.files[name] === digest(data));
      label = !intact ? `v${state.version}, locally modified` : current ? `v${state.version}, current` : `v${state.version}, update available in this package`;
      if (!current) complete = false;
    } else complete = false;
    console.log(`${agent} (${scope}): ${label} — ${dir}`);
  }
  if (scope === 'project') {
    const state = configState(root);
    for (const agent of selected) {
      const name = agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md';
      const addition = state.additions[name];
      const valid = addition && text(path.join(root, name)).includes(addition.inserted);
      console.log(`${name}: ${valid ? 'continuity configured' : 'continuity not configured or edited'}`);
    }
    let ignored = false;
    try { ignored = execFileSync('git', ['check-ignore', '--no-index', 'HANDOFF-STATE.md'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== ''; } catch { /* no repository or not ignored */ }
    console.log(`HANDOFF-STATE.md: ${exists(path.join(root, 'HANDOFF-STATE.md')) ? 'present' : 'not created yet'}; Git ${ignored ? 'ignored' : 'ignore not verified'}`);
  }
  return complete;
}

const help = `Orbit Handoff ${pkg.version}\n\nUsage: orbit-handoff <install|init|check|update|uninstall> [options]\n\n  --agent codex|claude|both  Choose agent (check defaults to both)\n  --scope project|user      Choose installation scope\n  --yes, -y                Non-interactive; defaults to both/project\n  --help, -h               Show help\n  --version, -v            Show package version\n\ninit configures the current repository; it does not create a handoff.\nupdate uses the running package version; use npx orbit-handoff@latest update.\ncheck exits 1 if a selected installation is missing, modified or outdated.\n`;

export async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h') || !argv.length) { console.log(help); return; }
  if (argv.includes('--version') || argv.includes('-v')) { console.log(pkg.version); return; }
  const [command, ...rest] = argv;
  if (!['install', 'init', 'check', 'update', 'uninstall'].includes(command)) throw new Error(`Unknown command: ${command}`);
  let agent, scope, yes = false;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--yes' || rest[i] === '-y') yes = true;
    else if (rest[i] === '--agent') agent = rest[++i];
    else if (rest[i] === '--scope') scope = rest[++i];
    else throw new Error(`Unknown option: ${rest[i]}`);
    if (rest[i] === undefined) throw new Error('Missing option value');
  }
  if (agent !== undefined && !['codex', 'claude', 'both'].includes(agent)) throw new Error('Agent must be codex, claude or both');
  if (scope !== undefined && !['project', 'user'].includes(scope)) throw new Error('Scope must be project or user');
  if (command === 'init' && scope === 'user') throw new Error('init configures the current repository; use --scope project');
  if (process.platform === 'win32') throw new Error('Use a Linux environment in WSL; native Windows is not supported');
  const interactive = !yes && command !== 'check';
  if (interactive && !process.stdin.isTTY) throw new Error('Non-interactive input: pass --yes (and optionally --agent / --scope)');
  const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    if (!agent && rl) {
      const answer = (await rl.question('Choose agent: 1) Codex  2) Claude Code  3) Both [3]: ')).trim() || '3';
      agent = { '1': 'codex', '2': 'claude', '3': 'both' }[answer];
      if (!agent) throw new Error('Choose 1, 2 or 3');
    }
    agent ??= 'both';
    if (!scope && rl && command !== 'init') {
      const answer = (await rl.question('Choose scope: 1) Current project  2) User/global [1]: ')).trim() || '1';
      scope = { '1': 'project', '2': 'user' }[answer];
      if (!scope) throw new Error('Choose 1 or 2');
    }
    scope ??= 'project';
    const selected = agent === 'both' ? agents : [agent];
    const root = repoRoot(process.cwd());
    const destinations = selected.map(a => location(a, scope, root));
    if (command === 'check') { if (!status(root, selected, scope)) process.exitCode = 1; return; }
    let plan;
    if (command === 'init') {
      try { execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, stdio: 'ignore' }); }
      catch { throw new Error('init requires a Git repository; initialise one first'); }
      plan = planConfig(root, selected);
      console.log(plan.changes.length ? `Will append continuity blocks to: ${plan.changes.map(c => c.name).join(', ')}. Existing content will be preserved. Ownership is recorded in .orbit-handoff/state.json.` : 'Continuity is already configured.');
    } else {
      if (command === 'install' || command === 'update') {
        const eligible = destinations.map(dir => preflightInstall(dir, command === 'update'));
        if (!eligible.some(Boolean)) throw new Error('No managed installation to update; run install first');
        plan = eligible;
      } else {
        destinations.forEach(readOwnership);
        if (scope === 'project') configState(root);
      }
      console.log(`Will ${command} Orbit Handoff ${pkg.version} (${scope}):\n${destinations.join('\n')}${command === 'uninstall' && scope === 'project' ? '\nWill also remove unchanged owned continuity blocks. Edited and unrelated files are preserved.' : ''}`);
    }
    if (rl && !['y', 'yes'].includes((await rl.question('Continue? [y/N]: ')).trim().toLowerCase())) { console.log('Cancelled.'); return; }
    if (command === 'init') {
      for (const change of plan.changes) atomicWrite(change.p, change.content);
      persistConfig(root, plan.state);
    } else if (command === 'uninstall') {
      destinations.forEach(uninstall);
      if (scope === 'project') removeConfig(root, selected);
    } else destinations.forEach((dir, i) => { if (plan[i]) install(dir); else console.log(`Not installed, skipped: ${dir}`); });
    console.log(`Orbit Handoff: ${command} complete.${command === 'install' ? '\nRun orbit-handoff init to configure continuity in this repository.' : ''}`);
  } finally { rl?.close(); }
}
