import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { setupProject, checkProject, removeProjectConfig, resolveProjectRoot } from '../plugin/skills/orbit-setup/scripts/setup_project.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const skillsRoot = path.join(packageRoot, 'plugin/skills');
const marker = '.orbit-handoff.json';
const agents = ['codex', 'claude'];
const skills = ['handoff', 'orbit-setup'];
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const exists = p => { try { fs.lstatSync(p); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };

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

function skillSource(skill) { return path.join(skillsRoot, skill); }
function bundled(skill) { return Object.fromEntries(files(skillSource(skill)).map(name => [name, fs.readFileSync(path.join(skillSource(skill), name))])); }
function agentSkillsRoot(agent, scope, root) { return path.join(scope === 'user' ? os.homedir() : root, agent === 'codex' ? '.agents/skills' : '.claude/skills'); }
function location(agent, scope, root, skill) { return path.join(agentSkillsRoot(agent, scope, root), skill); }

function readOwnership(dir) {
  safePath(dir);
  const p = path.join(dir, marker);
  if (!exists(p)) return null;
  const state = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (state.product !== 'orbit-handoff' || state.schema !== 1 || typeof state.version !== 'string' || !state.files || typeof state.files !== 'object' || Array.isArray(state.files)) throw new Error(`Invalid ownership file: ${p}`);
  for (const [name, hash] of Object.entries(state.files)) {
    if (!name || name === marker || path.posix.isAbsolute(name) || name.includes('\\') || name.split('/').some(part => ['.', '..', ''].includes(part)) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid ownership entry: ${p}`);
  }
  return state;
}

function preflight(dir, skill, updating) {
  const state = readOwnership(dir);
  if (exists(dir) && !state) throw new Error(`An unmanaged ${skill} skill already exists at ${dir}; move it aside yourself before installing.`);
  if (updating && !state) return true;
  if (state) {
    for (const [name, hash] of Object.entries(state.files)) {
      const p = path.join(dir, name); safePath(p);
      if (!exists(p) || digest(fs.readFileSync(p)) !== hash) throw new Error(`Managed file was edited or removed: ${p}. Preserve your changes before updating.`);
    }
    for (const name of Object.keys(bundled(skill))) if (exists(path.join(dir, name)) && !Object.hasOwn(state.files, name)) throw new Error(`Unrelated file conflicts with this release: ${path.join(dir, name)}`);
  }
  return true;
}

function installSkill(dir, skill) {
  const previous = readOwnership(dir);
  const content = bundled(skill);
  for (const [name, data] of Object.entries(content)) atomicWrite(path.join(dir, name), data);
  for (const name of Object.keys(previous?.files ?? {})) if (!Object.hasOwn(content, name) && exists(path.join(dir, name))) fs.unlinkSync(path.join(dir, name));
  atomicWrite(path.join(dir, marker), JSON.stringify({ product: 'orbit-handoff', schema: 1, version: pkg.version, skill,
    files: Object.fromEntries(Object.entries(content).map(([name, data]) => [name, digest(data)])) }, null, 2) + '\n');
}

function prune(dir, boundary) {
  while (dir !== boundary && exists(dir) && fs.readdirSync(dir).length === 0) { fs.rmdirSync(dir); dir = path.dirname(dir); }
}

function uninstallSkill(dir) {
  const state = readOwnership(dir);
  if (!state) { if (exists(dir)) console.log(`Unmanaged skill preserved: ${dir}`); return; }
  const retained = {};
  for (const [name, hash] of Object.entries(state.files)) {
    const p = path.join(dir, name); safePath(p);
    if (!exists(p)) continue;
    if (digest(fs.readFileSync(p)) === hash) { fs.unlinkSync(p); prune(path.dirname(p), dir); }
    else { retained[name] = hash; console.log(`Preserved edited file: ${p}`); }
  }
  if (Object.keys(retained).length) atomicWrite(path.join(dir, marker), JSON.stringify({ ...state, files: retained }, null, 2) + '\n');
  else if (exists(path.join(dir, marker))) fs.unlinkSync(path.join(dir, marker));
  prune(dir, path.dirname(dir));
}

function skillStatus(root, selected, scope) {
  let complete = true;
  for (const agent of selected) {
    for (const skill of skills) {
      const dir = location(agent, scope, root, skill);
      const state = readOwnership(dir);
      let label = exists(dir) ? 'unmanaged skill' : 'not installed';
      if (state) {
        const contents = bundled(skill);
        const intact = Object.entries(state.files).every(([name, hash]) => { const p = path.join(dir, name); return exists(p) && digest(fs.readFileSync(p)) === hash; });
        const current = intact && Object.keys(state.files).length === Object.keys(contents).length && Object.entries(contents).every(([name, data]) => state.files[name] === digest(data));
        label = !intact ? `v${state.version}, locally modified` : current ? `v${state.version}, current` : `v${state.version}, update available in this package`;
        if (!current) complete = false;
      } else complete = false;
      console.log(`${agent}/${skill} (${scope}): ${label} — ${dir}`);
    }
  }
  return complete;
}

const help = `Orbit Handoff ${pkg.version}\n\nUsage: orbit-handoff <install|setup|init|check|update|uninstall> [options]\n\n  --agent codex|claude|both  Choose agent (defaults to both)\n  --scope project|user      Choose installation scope\n  --yes, -y                 Non-interactive; defaults to both/project\n  --help, -h                Show help\n  --version, -v             Show package version\n\nsetup prepares the current project with living docs and Orbit workflow rules.\ninit is a backwards-compatible alias for setup.\nupdate uses the running package version; use npx orbit-handoff@latest update.\n`;

export async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h') || !argv.length) { console.log(help); return; }
  if (argv.includes('--version') || argv.includes('-v')) { console.log(pkg.version); return; }
  let [command, ...rest] = argv;
  if (command === 'init') command = 'setup';
  if (!['install', 'setup', 'check', 'update', 'uninstall'].includes(command)) throw new Error(`Unknown command: ${command}`);
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
  if (command === 'setup' && scope === 'user') throw new Error('setup configures the current project; use --scope project');
  if (process.platform === 'win32') throw new Error('Use a Linux environment in WSL; native Windows is not supported');

  const interactive = !yes && command !== 'check';
  if (interactive && !process.stdin.isTTY) throw new Error('Non-interactive input: pass --yes (and optionally --agent / --scope)');
  const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    if (!agent && rl) {
      const answer = (await rl.question('Choose agent: 1) Codex  2) Claude Code  3) Both [3]: ')).trim() || '3';
      agent = { '1':'codex','2':'claude','3':'both' }[answer];
      if (!agent) throw new Error('Choose 1, 2 or 3');
    }
    agent ??= 'both';
    if (!scope && rl && command !== 'setup') {
      const answer = (await rl.question('Choose scope: 1) Current project  2) User/global [1]: ')).trim() || '1';
      scope = { '1':'project','2':'user' }[answer];
      if (!scope) throw new Error('Choose 1 or 2');
    }
    scope ??= 'project';
    const selected = agent === 'both' ? agents : [agent];
    const root = resolveProjectRoot(process.cwd());

    if (command === 'check') {
      const installed = skillStatus(root, selected, scope);
      if (scope === 'project') {
        const result = checkProject(root, selected);
        result.messages.forEach(message => console.log(message));
      }
      if (!installed) process.exitCode = 1;
      return;
    }

    if (command === 'setup') {
      console.log(`Will configure Orbit project continuity in ${root}. Existing docs and unrelated instructions are preserved.`);
      if (rl && !['y','yes'].includes((await rl.question('Continue? [y/N]: ')).trim().toLowerCase())) { console.log('Cancelled.'); return; }
      const result = setupProject(root, selected);
      for (const item of [...result.managed, ...result.docs]) console.log(`${item.action}: ${item.name}`);
      console.log('Orbit Handoff: setup complete. HANDOFF-STATE.md will be created at the first checkpoint.');
      return;
    }

    const targets = selected.flatMap(a => skills.map(skill => ({ agent:a, skill, dir:location(a, scope, root, skill) })));
    let eligible;
    if (command === 'install' || command === 'update') {
      if (command === 'update' && !targets.some(t => readOwnership(t.dir))) throw new Error('No managed installation to update; run install first');
      eligible = targets.map(t => preflight(t.dir, t.skill, command === 'update'));
    } else targets.forEach(t => readOwnership(t.dir));

    console.log(`Will ${command} Orbit Handoff ${pkg.version} (${scope}):\n${targets.map(t => t.dir).join('\n')}`);
    if (rl && !['y','yes'].includes((await rl.question('Continue? [y/N]: ')).trim().toLowerCase())) { console.log('Cancelled.'); return; }

    if (command === 'uninstall') {
      targets.forEach(t => uninstallSkill(t.dir));
      if (scope === 'project') removeProjectConfig(root, selected);
    } else {
      targets.forEach((t, i) => { if (command === 'install' || eligible[i]) installSkill(t.dir, t.skill); });
    }
    console.log(`Orbit Handoff: ${command} complete.${command === 'install' ? '\nRun orbit-handoff setup to configure this project.' : ''}`);
  } finally { rl?.close(); }
}
