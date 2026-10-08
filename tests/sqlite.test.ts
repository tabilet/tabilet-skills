import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSQLite } from '../src/sqlite.ts';
import { projectDatabasePath } from '../src/projectStorage.ts';
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

test('SQLite view selects separate project defaults and ignores the old shared location', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-project-sqlite-'));
  const project = join(root, 'one/project'), other = join(root, 'two/project');
  const env = { XDG_STATE_HOME: join(root, 'state'), TABILET_AUDIT_DB: 'project' };
  try {
    mkdirSync(project, { recursive: true }); mkdirSync(other, { recursive: true });
    const first = projectDatabasePath(project, env), second = projectDatabasePath(other, env);
    assert.notEqual(first, second);
    createSQLiteFixture(join(env.XDG_STATE_HOME, 'tabilet/audit.sqlite3'), project, other);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, env).state, 'missing');
    createSQLiteFixture(first, project, other);
    const original = readFileSync(first);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, env).state, 'ready');
    assert.equal(readSQLite(other, { section: 'overview', offset: 0 }, env).state, 'missing');
    assert.deepEqual(readFileSync(first), original);
    const alias = join(root, 'alias.sqlite3'); symlinkSync(first, alias);
    assert.match(readSQLite(project, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: alias }).message, /Symlink audit database paths/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SQLite view reports missing, unregistered, and in-project databases', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-')), project = join(root, 'project'), other = join(root, 'other'), path = join(root, 'audit.sqlite3');
  try {
    mkdirSync(project); mkdirSync(other);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: path }).state, 'missing');
    createSQLiteFixture(path, project, other);
    mkdirSync(join(project, '.git'));
    const unregistered = join(project, 'new-session'); mkdirSync(unregistered);
    assert.equal(readSQLite(unregistered, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: path }).state, 'unregistered');
    assert.match(readSQLite(other, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: path }).message, /different project/);
    const copy = join(project, 'audit.sqlite3');
    copyFileSync(path, copy);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }, { TABILET_AUDIT_DB: copy }).state, 'error');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
