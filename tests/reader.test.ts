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
test('wide milestone IDs are discoverable in active files, child records and history index', async () => {
  const files = activeFixture(0);
  files.set('tabilet/memory-bank/milestone.md', '# Milestones\n## M130 - Delivery\n**Acceptance.** Works.\n[History](../docs/history/index.md)');
  files.set('tabilet/memory-bank/status-M130.md', '| ID | State | Notes |\n|---|---|---|\n| T01 | `[ ]` | Ready |');
  files.set('tabilet/memory-bank/amend-M130-01.md', '## M130-01 - Repair\nParent: M130\n| ID | State | Notes |\n|---|---|---|\n| T01 | `[ ]` | Repair |');
  files.set('tabilet/docs/history/index.md', '| ID | Outcome | Retired | Record | Notes |\n|---|---|---|---|---|\n| M153 | completed | 2026-09-13 | [M153](status-M153.md) | done |');
  files.set('tabilet/docs/history/status-M153.md', 'not read');
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.milestones.some(m => m.id === 'M130'));
  assert.ok(snapshot.milestones.some(m => m.id === 'M130-01'));
  assert.ok(!snapshot.issues.some(issue => issue.includes('M153')));
});
test('invalid extended roots are reported and archive lanes remain two-digit', async () => {
  const files = activeFixture(1);
  files.set('tabilet/memory-bank/status-M001.md', '| x | `[ ]` | bad |');
  files.set('docs/archive-A100.md', '# Not an archive');
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.issues.some(issue => issue.includes('status-M001.md')));
  assert.equal(snapshot.layout, 'v2');
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
test('optional stages are read-only context and never create executable rows', async () => {
  const files = activeFixture(1), f = memoryPort(files), reader = new Reader(f.port);
  const without = await reader.snapshot(signal());
  assert.equal(without.complete, true);
  assert.ok(!without.documents.some(document => document.path === 'tabilet/stages.md'));
  files.set('tabilet/stages.md', '# Stages\n\n**Current stage.** STG-01\n\n## STG-01\n**Name.** Current\n**Intent.** Deliver the active horizon\n\n## STG-02\n**Name.** Later\n**Intent.** Preliminary idea\n');
  const withStages = await reader.snapshot(signal());
  assert.equal(withStages.complete, true);
  assert.equal(withStages.documents.find(document => document.path === 'tabilet/stages.md')?.text, files.get('tabilet/stages.md'));
  assert.equal(withStages.tasks.length, without.tasks.length);
  assert.equal(withStages.milestones.length, without.milestones.length);
  files.set('tabilet/stages.md', files.get('tabilet/stages.md')!.replace('STG-01', 'STG-03'));
  const unresolved = await reader.snapshot(signal());
  assert.ok(unresolved.issues.some(issue => issue.includes('current stage STG-03 has no stage entry')));
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
  assert.equal(s.tasks.length, 0); assert.equal(s.goalAvailable, true);
});
test('bundled goal resolution does not require a package-owned GOAL.md', async () => {
  const files = activeFixture(1);
  assert.equal(files.has('tabilet/GOAL.md'), false);
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.equal(snapshot.goalAvailable, true);
  assert.deepEqual(snapshot.issues, []);
});
test('child files own their specifications and share identities across amendment and option kinds', async () => {
  const files = activeFixture(1);
  files.set('tabilet/memory-bank/amend-A01-01.md', '## A01-01 — Repair\nParent: A01\n\n**Review iterations.** 2\n| repair | `[ ]` | Keep acceptance |');
  files.set('tabilet/memory-bank/option-A01-02.md', '## A01-02 — Later idea\n**Parent:** A01\nDeferred; no task rows.');
  const before = [...files];
  let snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.deepEqual(snapshot.issues, []);
  assert.equal(snapshot.tasks.length, 6);
  assert.deepEqual(snapshot.milestones.filter(m => m.parent).map(m => [m.id, m.kind, m.parent]).sort(), [['A01-01','amend','A01'],['A01-02','option','A01']]);
  assert.ok(snapshot.milestones.some(m => m.title.includes('Later idea')));
  assert.deepEqual([...files], before);
  files.set('tabilet/memory-bank/option-A01-01.md', 'Parent: A01\nDeferred');
  snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.issues.some(i => i.includes('Duplicate active ID: A01-01')));
});
test('child parent declarations, missing parents and malformed filenames are surfaced', async () => {
  for (const declaration of ['', 'Parent: B01', 'Parent: A01\nParent: A01']) {
    const files = activeFixture(1);
    files.set('tabilet/memory-bank/amend-A01-01.md', `${declaration}\n| repair | \`[ ]\` | Required |`);
    const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
    assert.ok(snapshot.issues.some(i => i.includes('child must declare exactly Parent: A01')));
  }
  const files = activeFixture(0);
  files.set('tabilet/memory-bank/amend-A01-01.md','Parent: A01\n| repair | `[ ]` | Required |');
  files.set('tabilet/memory-bank/option-A01-00.md','Parent: A01');
  files.set('tabilet/memory-bank/status-A01-02.md','Parent: A01');
  const snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.issues.some(i => i.includes('orphan child')));
  assert.ok(snapshot.issues.some(i => i.includes('option-A01-00.md')));
  assert.ok(snapshot.issues.some(i => i.includes('status-A01-02.md')));
});
test('retired child bodies remain demand loaded and active/retired child collisions are visible', async () => {
  const files = activeFixture(0);
  files.set('tabilet/docs/history/index.md','| A01 | completed | 2026-10-25 | [Root](status-A01.md) | Closed |\n| A01-01 | completed | 2026-10-25 | [Amendment](amend-A01-01.md) | Closed |');
  files.set('tabilet/docs/history/status-A01.md','Demand loaded');
  files.set('tabilet/docs/history/amend-A01-01.md','Demand loaded');
  const f = memoryPort(files);
  let snapshot = await new Reader(f.port).snapshot(signal());
  assert.deepEqual(snapshot.issues, []);
  assert.equal(snapshot.history.length, 2);
  assert.ok(!f.reads.some(p => p.endsWith('amend-A01-01.md')));
  files.set('tabilet/memory-bank/option-A01-01.md','Parent: A01\nDeferred');
  snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.issues.some(i => i.includes('Duplicate active/retired ID: A01-01')));
  files.set('tabilet/docs/history/option-A01-01.md','Conflicting retired kind');
  snapshot = await new Reader(memoryPort(files).port).snapshot(signal());
  assert.ok(snapshot.issues.some(i => i.includes('Duplicate retired ID across file kinds: A01-01')));
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
