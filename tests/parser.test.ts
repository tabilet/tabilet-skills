import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { localLinks, retiredRecord, reviewEvidence, stageOverview, statusMarkerProblems, statusRows } from '../src/parser.ts';
const fixtures = JSON.parse(await readFile(new URL('../payload/tests/fixtures/parser-conformance.json', import.meta.url), 'utf8'));
for (const c of fixtures) test(`canonical Python parity: ${c.name}`, () => {
  if (c.kind === 'status') { assert.deepEqual(statusRows(c.text), c.rows); assert.deepEqual(statusMarkerProblems(c.text), c.problems); }
  else if (c.invalid) assert.throws(() => retiredRecord(c.text, c.file));
  else assert.deepEqual(JSON.parse(JSON.stringify(retiredRecord(c.text, c.file))), c.record);
});
test('review counters are explicit, current, bounded, and not inferred from task markers', () => {
  assert.equal(reviewEvidence('| 1 | `[+]` | Review iteration 2 |').counter, 'Unknown');
  assert.equal(reviewEvidence('**Review iterations.** 3\n').counter, '3/10');
  assert.equal(reviewEvidence('**Review iterations.** 2\n**Review iterations.** 3').counter, 'Conflicting or invalid');
  assert.equal(reviewEvidence('**Review iterations.** 11').counter, 'Conflicting or invalid');
  assert.equal(reviewEvidence('```\n**Review iterations.** 2\n```').counter, 'Unknown');
});
test('malformed prototype-like marker names cannot become task states', () => {
  for (const state of ['constructor', 'toString', '__proto__']) assert.deepEqual(statusRows(`| item | ${state} |`), []);
});
test('retired source documents preserve literal CRLF endings', () => {
  const c = fixtures.find((f: { name: string }) => f.name === 'completed');
  const result = retiredRecord(c.text.replaceAll('\n', '\r\n'), c.file);
  assert.equal(result.specification, c.record.specification.replaceAll('\n', '\r\n'));
  assert.equal(result.status, c.record.status.replaceAll('\n', '\r\n'));
});
test('retired records accept new source paths and frozen v1.5 provenance', () => {
  const c = fixtures.find((f: { name: string }) => f.name === 'completed');
  assert.equal(retiredRecord(c.text, c.file).metadata['Source status'], 'memory-bank/status-M01.md');
  const v2 = c.text.replaceAll('memory-bank/', 'tabilet/memory-bank/');
  assert.equal(retiredRecord(v2, c.file).metadata['Source status'], 'tabilet/memory-bank/status-M01.md');
});
test('legacy completed retirement preserves its recorded review provenance', () => {
  const c = fixtures.find((f: { name: string }) => f.name === 'completed');
  const legacy = c.text.replace('**Review.** passed', '**Review.** legacy')
    .replace('**Review iterations.** 2', '**Review iterations.** not recorded\n**Legacy closure.** Closed before persisted reviews.');
  assert.equal(retiredRecord(legacy, c.file).metadata['Review iterations'], 'not recorded');
  assert.throws(() => retiredRecord(legacy.replace('**Legacy closure.** Closed before persisted reviews.', ''), c.file));
  assert.throws(() => retiredRecord(legacy.replace('**Outcome.** completed', '**Outcome.** cancelled'), c.file));
});
test('stage overview reads current and preliminary entries without treating examples as stages', () => {
  const text = '# Stages\n\n**Current stage.** STG-01\n\n## STG-01\n**Name.** Delivery\n**Intent.** First outcome\n\n```markdown\n## STG-99\n```\n\n## STG-02\n**Name.** Later idea\n**Intent.** Tentative\n';
  const overview = stageOverview(text);
  assert.equal(overview.current, 'STG-01');
  assert.deepEqual(overview.entries.map(entry => entry.id), ['STG-01', 'STG-02']);
  assert.equal(overview.entries[1].intent, 'Tentative');
  assert.deepEqual(overview.problems, []);
  assert.ok(stageOverview(text.replace('**Current stage.** STG-01', '**Current stage.** STG-03')).problems.some(problem => problem.includes('no stage entry')));
});
test('links discover canonical local files and ignore executable/remote resources and fenced examples', () => {
  assert.deepEqual(localLinks('[Local](../../../canonical/status-M01.md)\n![image](https://invalid/x)\n[remote](https://invalid/x)\n```\n[hidden](x.md)\n```', 'tabilet/memory-bank/milestone.md'), [{ label: 'Local', path: '../canonical/status-M01.md' }]);
});
