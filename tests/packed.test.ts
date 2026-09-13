import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import SkillRegistry, { renderSkillContent } from '@deepseek-ai/dsh-skill';
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem';
import * as toolSkill from '@deepseek-ai/dsh-tool-skill';
import test from 'node:test';
const names = ['archive', 'goal', 'init', 'next', 'reconcile', 'upgrade'].map(c => `memory-bank-${c}`);
test('packed artifact includes exact upstream resources, no runtime or install scripts, and actual DSH loader precedence/disposal', async t => {
  const root = await mkdtemp(join(tmpdir(), 'tabilet-packed-')); t.after(() => rm(root, { recursive: true, force: true }));
  const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root], { encoding: 'utf8' }))[0];
  execFileSync('tar', ['-xzf', join(root, packed.filename), '-C', root]);
  const pkg = join(root, 'package'), manifest = JSON.parse(await readFile(join(pkg, 'package.json'), 'utf8'));
  for (const name of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(manifest.scripts[name], undefined);
  assert.ok(!packed.files.some((f: { path: string }) => /node_modules|\.acceptance|tests\//.test(f.path) && !f.path.startsWith('payload/tests/')));
  const lock = JSON.parse(await readFile(join(pkg, 'upstream.lock.json'), 'utf8'));
  for (const [path, digest] of Object.entries(lock.files)) assert.equal(createHash('sha256').update(await readFile(join(pkg, 'payload', path))).digest('hex'), digest, path);
  await symlink(resolve('node_modules'), join(root, 'node_modules'));
  const project = join(root, 'project'), dshHome = join(root, 'dsh'); await mkdir(project); await mkdir(dshHome);
  const ctx = new Context(), registry = await ctx.plugin(SkillRegistry);
  const defaults = await ctx.plugin(filesystem, { dshHome, agentsHome: join(root, 'agents'), bundledSkillDir: join(root, 'absent'), watch: false });
  const plugin = await ctx.plugin(await import(pathToFileURL(join(pkg, 'dist/host.js')).href));
  t.after(async () => { await plugin.dispose(); await defaults.dispose(); await registry.dispose(); });
  assert.deepEqual((await ctx.skills.list({ cwd: project })).map(s => s.name), names);
  for (const name of names) {
    const loaded = await ctx.skills.get(name, { cwd: project }); assert.ok(loaded); assert.equal(loaded.provider, 'tabilet-skills'); assert.equal(loaded.source, 'bundled'); assert.match(renderSkillContent(loaded), /memory-bank/);
  }
  const override = join(project, '.agents/skills/memory-bank-next'); await mkdir(override, { recursive: true });
  await cp(join(pkg, 'payload/skills/memory-bank-next/SKILL.md'), join(override, 'SKILL.md'));
  // A fresh registry observation sees the filesystem change without a provider cache.
  await defaults.dispose(); const defaults2 = await ctx.plugin(filesystem, { dshHome, agentsHome: join(root, 'agents'), watch: false }); t.after(() => defaults2.dispose());
  assert.equal((await ctx.skills.get('memory-bank-next', { cwd: project }))?.source, 'project-agents');
  await plugin.dispose(); assert.deepEqual((await ctx.skills.list({ cwd: project })).map(s => s.name), ['memory-bank-next']);
  assert.ok(await readFile(join(override, 'SKILL.md')));
});
test('model-free DSH pre-step submission loads the prepared request and complete canonical skill', async t => {
  const { prepare } = await import('../src/requests.ts');
  const ctx = new Context(), registry = await ctx.plugin(SkillRegistry);
  const plugin = await ctx.plugin(await import('../dist/host.js'));
  t.after(async () => { await plugin.dispose(); await registry.dispose(); });
  const handlers: ((...args: any[]) => any)[] = [];
  toolSkill.apply({ skills: ctx.skills, tools: { register() {} }, on(event: string, handler: (...args: any[]) => any) { if (event === 'agent/pre-step') handlers.push(handler); } } as unknown as Context);
  const request = prepare('goal', { order: 'M01 -> M02', completion: 'Both accepted', policy: 'none' });
  const messages = [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: request }] }];
  const result = await handlers[0]({ agent: { session: { header: { cwd: process.cwd() } } }, messages, signal: new AbortController().signal }, async () => ({ kind: 'continue', messages }));
  assert.equal(result.messages[0].content[0].text, request); assert.equal(result.messages[1].source.name, 'memory-bank-goal');
  assert.ok(result.messages[1].content[0].text.includes((await ctx.skills.get('memory-bank-goal', { cwd: process.cwd() }))!.content));
});
