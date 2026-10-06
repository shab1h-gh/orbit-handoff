import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const begin = '<!-- orbit-handoff:start -->';
const end = '<!-- orbit-handoff:end -->';
const ignoreBegin = '# orbit-handoff:start';
const ignoreEnd = '# orbit-handoff:end';

const agentsBlock = \`${begin}
## Orbit Handoff workflow

- Treat tracked source and relevant living docs as durable truth. \`HANDOFF-STATE.md\` is concise current execution state, never project history.
- Inspect the current Git state and read relevant tracked project documentation. After a fresh, cleared or recovered session, read \`HANDOFF-STATE.md\` if present, then use Git status/diff/recent log and only the docs/source needed for the next unfinished task.
- Load context selectively. Do not scan generated/vendor/build output or reread unchanged files without a reason.
- Living docs are current truth, not changelogs. Use existing \`PRODUCT.md\`, \`DESIGN.md\`, \`ARCHITECTURE.md\`, \`SECURITY.md\` and \`ROADMAP.md\` files in the root or \`docs/\`. Update affected sections in place as soon as completed work changes current truth. Never append session history; Git is history. Do not rewrite applied migrations.
- Use the installed Orbit Handoff skill for checkpoints. Run it after each completed user task and after a meaningful, verified milestone in long-running work; also before \`/clear\`, session end, or a usage/context stop when warning is available. Do not checkpoint trivial edits.
- Checkpoints overwrite \`HANDOFF-STATE.md\`. At an intermediate checkpoint, continue the remaining requested work afterwards. At a completed task, checkpoint before the final reply.
- Subagents: default to none. Use at most 2 total/concurrently, only for genuinely separable work where isolated context materially helps. No recursive subagents. The main agent owns integration and final decisions.
- Read-only Git inspection is allowed. Commit, push, merge, rebase, reset, branch deletion or other Git writes require explicit authority in the current request. Never force-push or destructively clean without explicit authority.
- Run the smallest relevant verification before claiming completion. Never claim tests, deployments or actions that did not run.
- Never place secrets, credentials, environment values, personal data or sensitive production data in living docs or \`HANDOFF-STATE.md\`.
${end}
\`;

const claudeBlock = \`${begin}
## Orbit Handoff

Read and follow \`AGENTS.md\` for the project workflow, context-loading, checkpoint and subagent rules. On a fresh or recovered session, use \`HANDOFF-STATE.md\` plus current Git state and only the relevant living docs instead of reconstructing old conversation history.
${end}
\`;

const ignoreBlock = \`${ignoreBegin}
HANDOFF-STATE.md
${ignoreEnd}
\`;

const templates = {
  'PRODUCT.md': \`# Product

> Living current-state document. Replace placeholders as product truth becomes known; do not append session history.

## Purpose
- TODO: what the product does and who it serves.

## Core workflows
- TODO: the main user-visible workflows.

## Scope and non-goals
- TODO: what is in scope and explicitly out of scope.

## Current constraints
- TODO: material product limits that affect implementation.
\`,
  'ARCHITECTURE.md': \`# Architecture

> Living current-state document. Update existing sections in place when the system changes.

## System shape
- TODO: major runtime components and responsibilities.

## Boundaries and data flow
- TODO: important trust, service and module boundaries.

## Persistence and integrations
- TODO: databases, storage, queues and external services.

## Operational constraints
- TODO: deployment, runtime and reliability constraints.
\`,
  'SECURITY.md': \`# Security

> Living current-state document. Record actual controls, invariants and known risks only.

## Trust boundaries
- TODO: authentication, authorisation, tenancy and public-entry boundaries.

## Data and secrets
- TODO: sensitive data handling, encryption, secret storage and logging rules.

## Abuse and failure controls
- TODO: rate limits, anti-abuse, validation and fail-closed behaviour.

## Known risks
- TODO: unresolved security limitations or verification still required.
\`,
  'ROADMAP.md': \`# Roadmap

> Forward-looking current plan only. Replace completed or superseded items instead of appending history.

## Current phase
- TODO: the active project phase and outcome.

## Next
1. TODO: highest-priority next milestone.

## Later
- TODO: worthwhile later work.

## Explicitly deferred
- TODO: work intentionally not being done now.
\`,
  'DESIGN.md': \`# Design

> Living current-state design truth. Keep this concise and update it in place.

## Direction
- TODO: visual/product design direction.

## System
- TODO: typography, colour, spacing, components and interaction conventions.

## Accessibility and responsive behaviour
- TODO: current accessibility and device rules.

## Surface-specific decisions
- TODO: only durable decisions that affect future UI work.
\`,
};

const exists = p => {
  try { fs.lstatSync(p); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
};
const read = p => exists(p) ? fs.readFileSync(p, 'utf8') : '';

function safePath(p) {
  let cursor = path.resolve(p);
  while (true) {
    if (exists(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error(\`Refusing symlink: ${cursor}\`);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

function atomicWrite(p, content) {
  safePath(p);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const temporary = path.join(path.dirname(p), \`.orbit-handoff-${crypto.randomUUID()}.tmp\`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: exists(p) ? fs.statSync(p).mode & 0o777 : 0o644 });
    fs.renameSync(temporary, p);
  } finally {
    if (exists(temporary)) fs.unlinkSync(temporary);
  }
}

export function resolveProjectRoot(cwd = process.cwd()) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return path.resolve(cwd);
  }
}

function statePath(root) {
  return path.join(root, '.orbit-handoff/state.json');
}

function loadState(root) {
  const p = statePath(root);
  if (!exists(p)) return { product: 'orbit-handoff', schema: 2, configuredAgents: [], additions: {} };
  const parsed = JSON.parse(read(p));
  if (parsed.product !== 'orbit-handoff' || !parsed.additions || typeof parsed.additions !== 'object' || Array.isArray(parsed.additions)) {
    throw new Error(\`Invalid Orbit Handoff state: ${p}\`);
  }

  if (parsed.schema === 1) {
    const configured = [];
    if (parsed.additions['AGENTS.md']) configured.push('codex');
    if (parsed.additions['CLAUDE.md']) configured.push('claude');
    return { product: 'orbit-handoff', schema: 2, configuredAgents: configured, additions: parsed.additions };
  }

  if (parsed.schema !== 2 || !Array.isArray(parsed.configuredAgents) ||
      parsed.configuredAgents.some(agent => !['codex', 'claude'].includes(agent))) {
    throw new Error(\`Unsupported Orbit Handoff state: ${p}\`);
  }

  for (const [name, addition] of Object.entries(parsed.additions)) {
    if (!['AGENTS.md', 'CLAUDE.md', '.gitignore'].includes(name) ||
        typeof addition.inserted !== 'string' || typeof addition.created !== 'boolean') {
      throw new Error(\`Invalid Orbit Handoff ownership entry: ${p}\`);
    }
  }

  return parsed;
}

function persistState(root, state) {
  const p = statePath(root);
  if (Object.keys(state.additions).length || state.configuredAgents.length) {
    atomicWrite(p, JSON.stringify(state, null, 2) + '\n');
  } else if (exists(p)) {
    fs.unlinkSync(p);
    const dir = path.dirname(p);
    if (exists(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
}

function desiredBlock(name) {
  if (name === 'AGENTS.md') return agentsBlock;
  if (name === 'CLAUDE.md') return claudeBlock;
  if (name === '.gitignore') return ignoreBlock;
  throw new Error(\`Unknown managed file: ${name}\`);
}

function markers(name) {
  return name === '.gitignore' ? [ignoreBegin, ignoreEnd] : [begin, end];
}

function planManaged(root, state, name) {
  const p = path.join(root, name);
  safePath(p);
  const before = read(p);
  const owned = state.additions[name];

  if (owned) {
    if (!before.includes(owned.inserted) || before.indexOf(owned.inserted) !== before.lastIndexOf(owned.inserted)) {
      throw new Error(\`Managed Orbit Handoff block was edited or duplicated in ${name}; review it before running setup.\`);
    }
    const [first, last] = markers(name);
    if (before.split(first).length !== 2 || before.split(last).length !== 2) {
      throw new Error(\`Managed Orbit Handoff block was edited or duplicated in ${name}; review it before running setup.\`);
    }
    const leading = owned.inserted.match(/^(?:\r?\n)*/)?.[0] ?? '';
    const inserted = leading + desiredBlock(name);
    if (inserted === owned.inserted) return null;
    state.additions[name].inserted = inserted;
    return { p, name, content: before.replace(owned.inserted, inserted), action: 'updated' };
  }

  if (name === '.gitignore' && before.split(/\r?\n/).some(line => line === 'HANDOFF-STATE.md' || line === '/HANDOFF-STATE.md')) {
    return null;
  }

  const [first, last] = markers(name);
  if (before.includes(first) || before.includes(last)) {
    throw new Error(\`Unowned or malformed Orbit Handoff block in ${name}; refusing to overwrite it.\`);
  }

  const inserted = (before ? (before.endsWith('\n') ? '\n' : '\n\n') : '') + desiredBlock(name);
  state.additions[name] = { inserted, created: !exists(p) };
  return { p, name, content: before + inserted, action: exists(p) ? 'updated' : 'created' };
}

function ensureDocs(root) {
  const results = [];
  for (const [name, template] of Object.entries(templates)) {
    const rootFile = path.join(root, name);
    const docsFile = path.join(root, 'docs', name);
    safePath(rootFile);
    safePath(docsFile);
    if (exists(rootFile)) {
      results.push({ name: path.relative(root, rootFile), action: 'preserved' });
      continue;
    }
    if (exists(docsFile)) {
      results.push({ name: path.relative(root, docsFile), action: 'preserved' });
      continue;
    }
    atomicWrite(docsFile, template);
    results.push({ name: path.relative(root, docsFile), action: 'created' });
  }
  return results;
}

export function setupProject(root, selected = ['codex', 'claude']) {
  root = path.resolve(root);
  safePath(root);
  const agents = [...new Set(selected)];
  if (!agents.length || agents.some(agent => !['codex', 'claude'].includes(agent))) throw new Error('Agent must be codex, claude or both');

  const state = loadState(root);
  state.configuredAgents = [...new Set([...state.configuredAgents, ...agents])].sort();

  const names = ['AGENTS.md', '.gitignore'];
  if (state.configuredAgents.includes('claude')) names.push('CLAUDE.md');

  const planned = names.map(name => planManaged(root, state, name)).filter(Boolean);
  const docs = ensureDocs(root);

  for (const change of planned) atomicWrite(change.p, change.content);
  persistState(root, state);

  return { root, managed: planned.map(({ name, action }) => ({ name, action })), docs };
}

function removeAddition(root, state, name) {
  const addition = state.additions[name];
  if (!addition) return { name, action: 'not-managed' };
  const p = path.join(root, name);
  safePath(p);
  if (!exists(p)) {
    delete state.additions[name];
    return { name, action: 'missing' };
  }

  const before = read(p);
  const index = before.indexOf(addition.inserted);
  if (index < 0 || index !== before.lastIndexOf(addition.inserted)) {
    return { name, action: 'preserved-edited' };
  }

  const after = before.slice(0, index) + before.slice(index + addition.inserted.length);
  if (!after && addition.created) fs.unlinkSync(p);
  else atomicWrite(p, after);
  delete state.additions[name];
  return { name, action: 'removed' };
}

export function removeProjectConfig(root, selected = ['codex', 'claude']) {
  root = path.resolve(root);
  const state = loadState(root);
  const remove = new Set(selected);
  state.configuredAgents = state.configuredAgents.filter(agent => !remove.has(agent));

  const results = [];
  if (!state.configuredAgents.includes('claude')) results.push(removeAddition(root, state, 'CLAUDE.md'));
  if (!state.configuredAgents.length) {
    results.push(removeAddition(root, state, 'AGENTS.md'));
    results.push(removeAddition(root, state, '.gitignore'));
  }

  persistState(root, state);
  return results;
}

export function checkProject(root, selected = ['codex', 'claude']) {
  root = path.resolve(root);
  const state = loadState(root);
  const messages = [];
  let ok = true;

  for (const agent of selected) {
    const configured = state.configuredAgents.includes(agent);
    messages.push(\`${agent}: ${configured ? 'project workflow configured' : 'project workflow not configured'}\`);
    if (!configured) ok = false;
  }

  for (const name of ['AGENTS.md', ...(selected.includes('claude') ? ['CLAUDE.md'] : [])]) {
    const addition = state.additions[name];
    const intact = addition && read(path.join(root, name)).includes(addition.inserted);
    messages.push(\`${name}: ${intact ? 'managed block intact' : 'managed block missing or edited'}\`);
    if (!intact) ok = false;
  }

  const handoffIgnored = read(path.join(root, '.gitignore')).split(/\r?\n/)
    .some(line => line === 'HANDOFF-STATE.md' || line === '/HANDOFF-STATE.md');
  messages.push(\`HANDOFF-STATE.md: ${handoffIgnored ? 'ignore rule present' : 'ignore rule missing'}\`);
  if (!handoffIgnored) ok = false;

  for (const name of Object.keys(templates)) {
    const present = exists(path.join(root, name)) || exists(path.join(root, 'docs', name));
    messages.push(\`${name}: ${present ? 'present' : 'missing'}\`);
    if (!present) ok = false;
  }

  return { ok, messages };
}

function parseAgent(value) {
  if (value === 'both') return ['codex', 'claude'];
  if (['codex', 'claude'].includes(value)) return [value];
  throw new Error('Agent must be codex, claude or both');
}

async function runCli(argv) {
  let command = 'setup';
  let agent = 'both';
  if (argv[0] && !argv[0].startsWith('-')) command = argv.shift();
  while (argv.length) {
    const flag = argv.shift();
    if (flag === '--agent') agent = argv.shift();
    else throw new Error(\`Unknown option: ${flag}\`);
  }

  const root = resolveProjectRoot();
  const selected = parseAgent(agent);

  if (command === 'setup') {
    const result = setupProject(root, selected);
    for (const item of [...result.managed, ...result.docs]) console.log(\`${item.action}: ${item.name}\`);
    console.log('Orbit Setup complete. HANDOFF-STATE.md will be created by the handoff skill at the first checkpoint.');
    return;
  }
  if (command === 'check') {
    const result = checkProject(root, selected);
    result.messages.forEach(message => console.log(message));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === 'remove') {
    removeProjectConfig(root, selected).forEach(item => console.log(\`${item.action}: ${item.name}\`));
    return;
  }
  throw new Error(\`Unknown setup command: ${command}\`);
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (direct) {
  runCli(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
