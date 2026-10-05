import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const pkg = read('package.json');
const portable = read('plugin/plugin.json');
const claude = read('plugin/.claude-plugin/plugin.json');
const marketplace = read('.claude-plugin/marketplace.json');
assert.equal(portable.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
assert.equal(portable.name, pkg.name);
assert.equal(portable.version, pkg.version);
assert.equal(claude.name, pkg.name);
assert.equal(claude.version, pkg.version);
assert.equal(marketplace.plugins.length, 1);
assert.equal(marketplace.plugins[0].name, claude.name);
assert.equal(marketplace.plugins[0].version, pkg.version);
assert.equal(marketplace.plugins[0].source, './plugin');
assert.equal(claude.skills, './skills/');
assert.equal(pkg.license, 'MIT');
assert.equal(pkg.scripts.postinstall, undefined);
assert.equal(pkg.dependencies, undefined);
assert.equal(fs.readFileSync(path.join(root, 'plugin/LICENSE'), 'utf8'), fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'));
const listing = portable.extensions['com.openai'].interface;
for (const [key, limit] of Object.entries({ displayName: 30, shortDescription: 30, longDescription: 4000, developerName: 80 })) {
  assert.ok(typeof listing[key] === 'string' && listing[key].length > 0 && listing[key].length <= limit, key);
}
assert.equal(listing.displayName, 'Orbit Handoff');
assert.equal(listing.category, 'Developer Tools');
for (const key of ['logo', 'composerIcon']) {
  assert.ok(listing[key].startsWith('./assets/'));
  const icon = fs.readFileSync(path.join(root, 'plugin', listing[key]));
  assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
}
const skill = fs.readFileSync(path.join(root, 'plugin/skills/handoff/SKILL.md'), 'utf8');
assert.match(skill, /^---\nname: handoff\ndescription: .+\ndisable-model-invocation: true\n---/);
const metadata = fs.readFileSync(path.join(root, 'plugin/skills/handoff/agents/openai.yaml'), 'utf8');
assert.match(metadata, /display_name: "Orbit Handoff"/);
assert.match(metadata, /allow_implicit_invocation: false/);
assert.match(metadata, /\$handoff/);
for (const forbidden of ['mcp.json', '.mcp.json', 'hooks/hooks.json']) assert.equal(fs.existsSync(path.join(root, 'plugin', forbidden)), false);
console.log('Canonical skill, manifests, listing limits, icons and local-only packaging validated.');
console.log('Portable JSON Schema and provider CLI checks are separate release checks; directory approval remains manual.');
