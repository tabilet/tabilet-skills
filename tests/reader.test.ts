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
  files.set('tabilet/memory-bank/status-A01.md', files.get('tabilet/memory-bank/status-A01.md')!.replace('`[~]`', '`[+]`'));
  const b = await reader.snapshot(signal()); assert.equal(b.tasks.filter(t => t.state === 'in_progress').length, 0); assert.equal(f.reads.length, readCount + 1);
});
test('v1.5 projects remain readable and identifiable without a v2 writable run', async () => {
  const files = new Map([...activeFixture(1)].map(([path, body]) => [path.startsWith('tabilet/') ? path.slice(8) : path, body]));
  files.set('GOAL.md', 'Legacy protocol.');
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.equal(snapshot.layout, 'legacy');
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.tasks.length, 5);
  assert.equal(snapshot.goalAvailable, true);
  assert.equal(snapshot.tasks[0].path, 'memory-bank/status-A01.md');
  files.set('tabilet/memory-bank/architecture.md', '# Mixed');
  const mixed = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.equal(mixed.layout, 'mixed');
  assert.ok(mixed.issues.some(issue => issue.includes('Mixed')));
  const archivesOnly = activeFixture(1);
  archivesOnly.set('docs/archive-A01.md', '# Legacy archive');
  const mixedArchives = await new Reader(memoryPort(archivesOnly).port).snapshot(signal());
  assert.equal(mixedArchives.layout, 'mixed');
  const truncatedPort = memoryPort(activeFixture(1)).port;
  const originalList = truncatedPort.list;
  truncatedPort.list = (path, sig) => path === 'docs'
    ? Promise.resolve({ entries: [], truncated: true }) : originalList(path, sig);
  assert.equal((await new Reader(truncatedPort).snapshot(signal())).layout, 'mixed');
});
test('an empty project is new and can enter the v2 initialization flow', async () => {
  const files = new Map([['AGENTS.md', '# New project']]);
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.equal(snapshot.layout, 'new');
  assert.ok(snapshot.issues.some(issue => issue.includes('tabilet/memory-bank/milestone.md')));
});
test('history bodies are demand loaded; active/retired duplication and missing relocation are explicit', async () => {
  const files = activeFixture(1); files.set('tabilet/docs/history/index.md', '| ID | Outcome | Retired | Record | Notes |\n| A01 | completed | 2026-09-13 | [Record](status-A01.md) | done |');
  files.set('tabilet/docs/history/status-A01.md', 'malformed record');
  const f = memoryPort(files), reader = new Reader(f.port); const a = await reader.snapshot(signal());
  assert.ok(a.issues.some(i => i.includes('Duplicate active/retired'))); assert.ok(!f.reads.includes('tabilet/docs/history/status-A01.md'));
  files.delete('tabilet/memory-bank/status-A01.md'); const b = await reader.snapshot(signal()); assert.ok(b.issues.some(i => i.includes('no active status file')));
  await reader.document('tabilet/docs/history/status-A01.md', signal()); assert.ok(f.reads.includes('tabilet/docs/history/status-A01.md'));
});
test('all-retired identity remains initialized and cancellation/supersession remain distinct', async () => {
  const files = activeFixture(0); files.set('tabilet/memory-bank/milestone.md', '# Milestones\n[History](../docs/history/index.md)');
  files.set('tabilet/docs/history/index.md', '| M01 | cancelled | 2026-09-13 | [Record](status-M01.md) | approved |\n| M02 | superseded | 2026-09-13 | [Record](status-M02.md) | successor M03 |');
  files.set('tabilet/docs/history/status-M01.md', 'not read'); files.set('tabilet/docs/history/status-M02.md', 'not read');
  files.set('tabilet/memory-bank/suggested.txt', 'Follow GOAL.md: M01 -> M02. COMMIT_POLICY: task.');
  const s = await new Reader(memoryPort(files).port).snapshot(signal()); assert.deepEqual(s.issues, []); assert.deepEqual(s.history.map(h => h.outcome), ['cancelled', 'superseded']);
  assert.equal(s.tasks.length, 0); assert.equal(s.goalAvailable, false);
});
test('malformed, legacy, denied, oversized, truncated, and multiple-progress ledgers are incomplete', async () => {
  const files = activeFixture(); files.set('tabilet/memory-bank/status.md', '| legacy | [ ] |');
  files.set('tabilet/memory-bank/status-B01.md', '| Item | State |\n| --- | --- |\n| wrong | done |\n| other | `[~]` |');
  files.set('tabilet/memory-bank/lessons.md', 'x'.repeat(MAX_FILE_BYTES + 1));
  const f = memoryPort(files); const original = f.port.list;
  f.port.list = async (path, sig) => ({ ...await original(path, sig), truncated: path === 'tabilet/memory-bank' });
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
  const files = activeFixture(0); files.set('tabilet/memory-bank/milestone.md', '| M01 | [Tasks](../../../canonical/status-M01.md) |'); files.set('../canonical/status-M01.md', '| 1 | `[ ]` | Linked canonical task |');
  const f = memoryPort(files), s = await new Reader(f.port).snapshot(signal());
  assert.equal(s.tasks[0].path, '../canonical/status-M01.md');
});

test('indexed aliases count one host file once, while distinct files retain duplicate-ID warnings', async () => {
  const files = activeFixture(1);
  files.set('tabilet/memory-bank/milestone.md', files.get('tabilet/memory-bank/milestone.md')! + '\n[Absolute alias](/project/tabilet/memory-bank/status-A01.md)');
  const f = memoryPort(files);
  const read = f.port.read, stat = f.port.stat;
  f.port.read = (path, sig) => read(path.replace(/^\/project\//, ''), sig);
  f.port.stat = (path, sig) => stat(path.replace(/^\/project\//, ''), sig);
  let snapshot = await new Reader(f.port).snapshot(signal());
  assert.deepEqual(snapshot.issues, []); assert.equal(snapshot.tasks.length, 5); assert.equal(snapshot.milestones.length, 1);
  assert.equal(snapshot.documents.filter(d => /status-A01.md$/.test(d.path)).length, 1);
  files.set('../canonical/status-A01.md', files.get('tabilet/memory-bank/status-A01.md')!);
  files.set('tabilet/memory-bank/milestone.md', files.get('tabilet/memory-bank/milestone.md')! + '\n[Different file](../../../canonical/status-A01.md)');
  snapshot = await new Reader(f.port).snapshot(signal());
  assert.ok(snapshot.issues.some(s => s.includes('Duplicate active ID: A01')));
  assert.equal(snapshot.milestones.length, 2);
});
