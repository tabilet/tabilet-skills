import assert from 'node:assert/strict';
import test from 'node:test';
import { Reader, MAX_FILE_BYTES } from '../src/reader.ts';
import { activeFixture, memoryPort } from './fixtures.ts';
const signal = () => new AbortController().signal;
test('120-file, 17-lane project caches by version, preserves every marker, and detects external edits', async () => {
  const files = activeFixture(120), before = [...files], f = memoryPort(files), reader = new Reader(f.port);
  const a = await reader.snapshot(signal());
  assert.deepEqual(a.issues, []); assert.equal(a.milestones.length, 120); assert.equal(new Set(a.milestones.map(m => m.id[0])).size, 17); assert.equal(a.tasks.length, 600);
  const readCount = f.reads.length; await reader.snapshot(signal()); assert.equal(f.reads.length, readCount);
  assert.deepEqual([...files], before);
  files.set('memory-bank/status-A01.md', files.get('memory-bank/status-A01.md')!.replace('`[~]`', '`[+]`'));
  const b = await reader.snapshot(signal()); assert.equal(b.tasks.filter(t => t.state === 'in_progress').length, 0); assert.equal(f.reads.length, readCount + 1);
});
test('history bodies are demand loaded; active/retired duplication and missing relocation are explicit', async () => {
  const files = activeFixture(1); files.set('docs/history/index.md', '| ID | Outcome | Retired | Record | Notes |\n| A01 | completed | 2026-09-13 | [Record](status-A01.md) | done |');
  files.set('docs/history/status-A01.md', 'malformed record');
  const f = memoryPort(files), reader = new Reader(f.port); const a = await reader.snapshot(signal());
  assert.ok(a.issues.some(i => i.includes('Duplicate active/retired'))); assert.ok(!f.reads.includes('docs/history/status-A01.md'));
  files.delete('memory-bank/status-A01.md'); const b = await reader.snapshot(signal()); assert.ok(b.issues.some(i => i.includes('no active status file')));
  await reader.document('docs/history/status-A01.md', signal()); assert.ok(f.reads.includes('docs/history/status-A01.md'));
});
test('all-retired identity remains initialized and cancellation/supersession remain distinct', async () => {
  const files = activeFixture(0); files.set('memory-bank/milestone.md', '# Milestones\n[History](../docs/history/index.md)');
  files.set('docs/history/index.md', '| M01 | cancelled | 2026-09-13 | [Record](status-M01.md) | approved |\n| M02 | superseded | 2026-09-13 | [Record](status-M02.md) | successor M03 |');
  files.set('docs/history/status-M01.md', 'not read'); files.set('docs/history/status-M02.md', 'not read');
  files.set('memory-bank/suggested.txt', 'Follow GOAL.md: M01 -> M02. COMMIT_POLICY: task.');
  const s = await new Reader(memoryPort(files).port).snapshot(signal()); assert.deepEqual(s.issues, []); assert.deepEqual(s.history.map(h => h.outcome), ['cancelled', 'superseded']);
  assert.equal(s.tasks.length, 0); assert.equal(s.goalAvailable, false);
});
test('malformed, legacy, denied, oversized, truncated, and multiple-progress ledgers are incomplete', async () => {
  const files = activeFixture(); files.set('memory-bank/status.md', '| legacy | [ ] |');
  files.set('memory-bank/status-B01.md', '| Item | State |\n| --- | --- |\n| wrong | done |\n| other | `[~]` |');
  files.set('memory-bank/lessons.md', 'x'.repeat(MAX_FILE_BYTES + 1));
  const f = memoryPort(files); const original = f.port.list;
  f.port.list = async (path, sig) => ({ ...await original(path, sig), truncated: path === 'memory-bank' });
  const s = await new Reader(f.port).snapshot(signal());
  for (const issue of ['legacy', 'unknown', 'Multiple rows', 'exceeds', 'truncated']) assert.ok(s.issues.some(i => i.includes(issue)), issue);
  assert.equal(s.complete, false);
  f.port.stat = async () => { throw new Error('permission denied'); };
  assert.ok((await new Reader(f.port).snapshot(signal())).issues.some(i => i.includes('permission denied')));
});
test('session cancellation and content changes during read never publish a successful snapshot', async () => {
  const files = activeFixture(), f = memoryPort(files), original = f.port.read;
  f.port.read = async (path, sig) => { const old = await original(path, sig); files.set(path, old.text + '\nchanged'); return old; };
  const s = await new Reader(f.port).snapshot(signal()); assert.equal(s.complete, false);
  const controller = new AbortController(); controller.abort(); await assert.rejects(new Reader(f.port).snapshot(controller.signal));
});
test('indexed canonical paths work when directory discovery is denied', async () => {
  const files = activeFixture(0); files.set('memory-bank/milestone.md', '| M01 | [Tasks](../../canonical/status-M01.md) |'); files.set('../canonical/status-M01.md', '| 1 | `[ ]` | Linked canonical task |');
  const f = memoryPort(files), s = await new Reader(f.port).snapshot(signal());
  assert.equal(s.tasks[0].path, '../canonical/status-M01.md');
});
