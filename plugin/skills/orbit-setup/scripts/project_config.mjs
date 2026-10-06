import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PRODUCT = 'orbit-thread';
const SCHEMA = 1;
const agents = ['codex', 'claude'];
const start = '<!-- orbit-thread:subagents:start -->';
const end = '<!-- orbit-thread:subagents:end -->';

const exists = p => {
  try { fs.lstatSync(p); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
};

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
  const temporary = path.join(path.dirname(p), `.orbit-thread-${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: exists(p) ? fs.statSync(p).mode & 0o777 : 0o644 });
    fs.renameSync(temporary, p);
  } finally {
    if (exists(temporary)) fs.unlinkSync(temporary);
  }
}

const configPath = root => path.join(root, '.orbit-thread/config.json');
const statePath = root => path.join(root, '.orbit-thread/state.json');
const defaultConfig = () => ({
  product: PRODUCT,
  schema: SCHEMA,
  subagents: {
    max: 2,
    codex: { model: null, reasoning: null },
    claude: { model: null, reasoning: null },
  },
});

function validate(config, source = 'Orbit Thread config') {
  if (!config || config.product !== PRODUCT || config.schema !== SCHEMA ||
      !config.subagents || !Number.isInteger(config.subagents.max) ||
      config.subagents.max < 0 || config.subagents.max > 2) {
    throw new Error(`Invalid ${source}`);
  }
  for (const agent of agents) {
    const pref = config.subagents[agent];
    if (!pref || !Object.hasOwn(pref, 'model') || !Object.hasOwn(pref, 'reasoning')) throw new Error(`Invalid ${source}`);
    for (const key of ['model', 'reasoning']) {
      const value = pref[key];
      const limit = key === 'model' ? 100 : 40;
      if (value !== null && (typeof value !== 'string' || !value.trim() || value.includes('\n') || value.length > limit)) {
        throw new Error(`Invalid ${source}: ${agent}.${key}`);
      }
    }
  }
  return config;
}

export function readProjectConfig(root) {
  const p = configPath(path.resolve(root));
  if (!exists(p)) return defaultConfig();
  return validate(JSON.parse(fs.readFileSync(p, 'utf8')), p);
}

export function ensureProjectConfig(root) {
  root = path.resolve(root);
  const config = readProjectConfig(root);
  if (!exists(configPath(root))) atomicWrite(configPath(root), JSON.stringify(config, null, 2) + '\n');
  return config;
}

export function renderSubagentBlock(config) {
  validate(config);
  const lines = [start];
  if (config.subagents.max === 0) {
    lines.push('- Subagents are disabled for this project.');
  } else {
    lines.push(`- Subagents: default to none. Use at most ${config.subagents.max} total/concurrently, only for genuinely separable work where isolated context materially helps. No recursive subagents. The main agent owns integration and final decisions.`);
    for (const agent of agents) {
      const pref = config.subagents[agent];
      if (!pref.model && !pref.reasoning) continue;
      const details = [
        pref.model ? `model ${pref.model}` : null,
        pref.reasoning ? `reasoning/effort ${pref.reasoning}` : null,
      ].filter(Boolean).join(', ');
      lines.push(`- Preferred ${agent === 'codex' ? 'Codex' : 'Claude'} subagent setting when the host supports it: ${details}. Treat this as a preference, not a reason to block work if the exact setting is unavailable.`);
    }
  }
  lines.push(end);
  return lines.join('\n');
}

function clean(value, label, max) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  if (!text || text.includes('\n') || text.length > max) throw new Error(`Invalid ${label}`);
  return text;
}

function replaceManagedSubagentBlock(text, replacement) {
  const first = text.indexOf(start);
  const last = text.indexOf(end);
  if (first < 0 || last < first || text.indexOf(start, first + start.length) >= 0 || text.indexOf(end, last + end.length) >= 0) {
    throw new Error('Orbit Thread subagent block is missing or malformed; run setup before configure.');
  }
  return text.slice(0, first) + replacement + text.slice(last + end.length);
}

export function configureProject(root, { agent, maxSubagents, model, reasoning, resetSubagents = false } = {}) {
  root = path.resolve(root);
  const stateFile = statePath(root);
  const agentsFile = path.join(root, 'AGENTS.md');
  if (!exists(stateFile) || !exists(agentsFile)) throw new Error('Orbit Thread project setup is not configured; run `npx orbit-thread setup` first.');

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const owned = state?.additions?.['AGENTS.md'];
  if (!owned || typeof owned.inserted !== 'string') throw new Error('Orbit Thread AGENTS.md ownership state is missing; run setup first.');

  let config = readProjectConfig(root);
  if (resetSubagents) {
    if (agent && agents.includes(agent)) config.subagents[agent] = { model: null, reasoning: null };
    else config = defaultConfig();
  }
  if (maxSubagents !== undefined) {
    const value = Number(maxSubagents);
    if (!Number.isInteger(value) || value < 0 || value > 2) throw new Error('max-subagents must be 0, 1 or 2');
    config.subagents.max = value;
  }
  const cleanModel = clean(model, 'subagent model', 100);
  const cleanReasoning = clean(reasoning, 'subagent reasoning/effort', 40);
  if (cleanModel !== undefined || cleanReasoning !== undefined) {
    if (!agents.includes(agent)) throw new Error('Choose --agent codex or --agent claude when setting a model or reasoning/effort preference.');
    if (cleanModel !== undefined) config.subagents[agent].model = cleanModel;
    if (cleanReasoning !== undefined) config.subagents[agent].reasoning = cleanReasoning;
  }
  validate(config);

  const before = fs.readFileSync(agentsFile, 'utf8');
  const index = before.indexOf(owned.inserted);
  if (index < 0 || index !== before.lastIndexOf(owned.inserted)) {
    throw new Error('Managed Orbit Thread AGENTS.md block was edited or duplicated; reconcile it before configure.');
  }

  const replacement = renderSubagentBlock(config);
  const nextInserted = replaceManagedSubagentBlock(owned.inserted, replacement);
  const nextFile = before.slice(0, index) + nextInserted + before.slice(index + owned.inserted.length);
  state.additions['AGENTS.md'].inserted = nextInserted;

  atomicWrite(configPath(root), JSON.stringify(config, null, 2) + '\n');
  atomicWrite(agentsFile, nextFile);
  atomicWrite(stateFile, JSON.stringify(state, null, 2) + '\n');
  return config;
}
