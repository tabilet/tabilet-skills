import assert from 'node:assert/strict';
import test from 'node:test';
import { commands, insertPrepared, prepare, type Draft, type Composer } from '../src/requests.ts';
test('all six requests preserve workflow boundaries and explicit goal policies', () => {
  for (const c of commands) assert.ok(prepare(c, { order: 'M01 -> M02', completion: 'Both accepted', review: 'https://example.invalid/review' }).startsWith(`/memory-bank-${c} `));
  const goal = prepare('goal', { order: 'M01 -> M02', completion: 'Accepted' }); assert.match(goal, /COMMIT_POLICY: task/); assert.match(goal, /EXTERNAL_MUTATIONS: none/);
  assert.match(prepare('goal', { order: 'M01', completion: 'Accepted', policy: 'none' }), /COMMIT_POLICY: none/);
  for (const order of ['', 'M1', 'M00', 'M01 -> M01', 'M01 -> pending']) assert.throws(() => prepare('goal', { order, completion: 'Accepted' }));
  assert.throws(() => prepare('goal', { order: 'M01' }));
  assert.match(prepare('next', { resume: true }), /Resume the sole in-progress/);
  assert.match(prepare('reconcile', { review: 'https://example.invalid/private' }), /separate explicit confirmation before fetching/);
});
test('composer guards revision, session, text, phase, attachments, and reference chips synchronously', () => {
  const empty: Draft = { draft: '', draftRev: 2, phase: 'plain', attachmentIds: [], occurrences: [] };
  let draft = empty, current = true, inserted = 0;
  const port: Composer = { snapshot: () => draft, isCurrent: () => current, insert: () => { inserted++; return true; } };
  for (const changes of [{ draft: ' ' }, { draft: 'existing' }, { draftRev: 3 }, { phase: 'claimed' }, { attachmentIds: ['x'] }, { occurrences: ['x'] }, { claim: {} }]) {
    draft = { ...empty, ...changes }; assert.doesNotMatch(insertPrepared(port, 'request', 2), /^Inserted/);
  }
  draft = empty; current = false; insertPrepared(port, 'request', 2); assert.equal(inserted, 0);
  current = true; assert.match(insertPrepared(port, 'request', 2), /^Inserted/); assert.equal(inserted, 1);
});
