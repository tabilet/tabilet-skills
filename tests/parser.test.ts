import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { localLinks, retiredRecord, reviewEvidence, statusMarkerProblems, statusRows } from '../src/parser.ts';
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
test('links discover canonical local files and ignore executable/remote resources and fenced examples', () => {
  assert.deepEqual(localLinks('[Local](../../canonical/status-M01.md)\n![image](https://invalid/x)\n[remote](https://invalid/x)\n```\n[hidden](x.md)\n```', 'memory-bank/milestone.md'), [{ label: 'Local', path: '../canonical/status-M01.md' }]);
});
