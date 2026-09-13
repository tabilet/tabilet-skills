import { activeFixture } from '../tests/fixtures.ts';
import { mkdir, readFile, writeFile, symlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const state = JSON.parse(await readFile('.acceptance/profile.json', 'utf8'));
const cases = JSON.parse(await readFile('payload/tests/fixtures/parser-conformance.json', 'utf8'));
const projects: Record<string, string> = {};
for (const [name, count] of [['active', 120], ['legacy', 1], ['retired', 0], ['linked', 0]] as const) {
  const files = activeFixture(count), project = join(state.root, name); projects[name] = project;
  if (name === 'legacy') { files.set('memory-bank/status.md', '| Legacy | [ ] |'); files.delete('memory-bank/lessons.md'); }
  if (name === 'retired') {
    files.set('memory-bank/milestone.md', '# Milestones\n[History](../docs/history/index.md)\n');
    const body = cases.find((c: { name: string }) => c.name === 'cancelled').text;
    files.set('docs/history/index.md', '| M01 | cancelled | 2026-09-12 | [Record](status-M01.md) | Owner approved |\n');
    files.set('docs/history/status-M01.md', body);
    files.set('docs/history/knowledge.md', '# Knowledge history\nPreserved learning.\n');
    files.set('docs/archive-A01.md', '# Frozen context\nOriginal product facts.\n');
  }
  if (name === 'linked') {
    const canonical = join(state.root, 'canonical'); await mkdir(canonical, { recursive: true });
    await writeFile(join(canonical, 'status-M01.md'), '| 1 | `[ ]` | Linked canonical task |\n');
    files.set('memory-bank/milestone.md', '| M01 | [Canonical](../../canonical/status-M01.md) |\n');
  }
  if (name === 'active') files.set('memory-bank/milestone.md', files.get('memory-bank/milestone.md')! + `\n[Absolute alias](${join(project, 'memory-bank/status-A01.md')})\n`);
  if (name === 'active') files.set('memory-bank/product.md', '# Product\n<script>globalThis.TABILET_UNSAFE = true</script>\n![Remote image](https://example.invalid/tracker.png)\n');
  for (const [path, text] of files) { await mkdir(dirname(join(project, path)), { recursive: true }); await writeFile(join(project, path), text); }
  if (name === 'linked') await symlink(join(state.root, 'canonical/status-M01.md'), join(project, 'memory-bank/status-S01.md'));
}
await writeFile('.acceptance/projects.json', JSON.stringify(projects, null, 2));
