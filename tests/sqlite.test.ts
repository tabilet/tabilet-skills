import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSQLite } from '../src/sqlite.ts';
import { createSQLiteFixture } from './sqlite-fixture.ts';

test('SQLite view is read-only, project-scoped, and browses audit and index evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-')), project = join(root, 'project'), other = join(root, 'other'), path = join(root, 'audit.sqlite3');
  try {
    mkdirSync(project); mkdirSync(other); createSQLiteFixture(path, project, other);
    const env = { TABILET_AUDIT_DB: path };
    const before = readFileSync(path); const modified = statSync(path).mtimeMs;
    const overview = readSQLite(project, { section: 'overview', offset: 0 }, env);
    assert.equal(overview.state, 'ready'); assert.deepEqual(overview.counts, { runs: 1, events: 1, documents: 1 });
    assert.equal(overview.index?.complete, true);
    const runs = readSQLite(project, { section: 'runs', offset: 0 }, env);
    assert.deepEqual(runs.entries.map(e => e.id), ['run-active']);
    const events = readSQLite(project, { section: 'events', runId: 'run-active', offset: 0 }, env);
    assert.deepEqual(events.entries.map(e => e.id), ['event-active']);
    assert.equal(events.entries[0]?.path, 'tabilet/memory-bank/status-A01.md');
    assert.deepEqual(readSQLite(project, { section: 'events', runId: 'run-other', offset: 0 }, env).entries, []);
    assert.deepEqual(readSQLite(project, { section: 'index', search: 'searchable', offset: 0 }, env).entries.map(e => e.id), ['1']);
    assert.deepEqual(readSQLite(project, { section: 'index', offset: 0 }, env).entries.map(e => e.path), ['tabilet/memory-bank/status-A01.md']);
    assert.deepEqual(readFileSync(path), before); assert.equal(statSync(path).mtimeMs, modified);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SQLite view reports missing, unregistered, and in-project databases', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-')), project = join(root, 'project'), other = join(root, 'other'), path = join(root, 'audit.sqlite3');
  try {
    mkdirSync(project); mkdirSync(other);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: path }).state, 'missing');
    createSQLiteFixture(path, project, other);
    const unregistered = join(root, 'new'); mkdirSync(unregistered);
    assert.equal(readSQLite(unregistered, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: path }).state, 'unregistered');
    const copy = join(project, 'audit.sqlite3');
    copyFileSync(path, copy);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: copy }).state, 'error');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
