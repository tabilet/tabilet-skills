import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { readSQLite } from '../src/sqlite.ts';
import { projectDatabasePath } from '../src/projectStorage.ts';
import { createSQLiteFixture } from './sqlite-fixture.ts';

test('SQLite view is read-only, project-scoped, and browses audit and index evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-')), project = join(root, 'project'), other = join(root, 'other');
  try {
    mkdirSync(project); mkdirSync(other);
    const path = projectDatabasePath(project); createSQLiteFixture(path, project, other);
    const before = readFileSync(path); const modified = statSync(path).mtimeMs;
    const overview = readSQLite(project, { section: 'overview', offset: 0 });
    assert.equal(overview.state, 'ready'); assert.equal(overview.auditEnabled, true);
    assert.deepEqual(overview.counts, { runs: 1, events: 1, documents: 1 });
    assert.equal(overview.index?.complete, true);
    assert.deepEqual(readSQLite(project, { section: 'runs', offset: 0 }).entries.map(e => e.id), ['run-active']);
    const events = readSQLite(project, { section: 'events', runId: 'run-active', offset: 0 });
    assert.deepEqual(events.entries.map(e => e.id), ['event-active']);
    assert.equal(events.entries[0]?.path, 'tabilet/memory-bank/status-A01.md');
    assert.deepEqual(readSQLite(project, { section: 'events', runId: 'run-other', offset: 0 }).entries, []);
    assert.deepEqual(readSQLite(project, { section: 'index', search: 'searchable', offset: 0 }).entries.map(e => e.id), ['1']);
    assert.deepEqual(readSQLite(project, { section: 'index', offset: 0 }).entries.map(e => e.path), ['tabilet/memory-bank/status-A01.md']);
    assert.deepEqual(readFileSync(path), before); assert.equal(statSync(path).mtimeMs, modified);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SQLite view uses each project file and ignores obsolete database configuration', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-project-sqlite-'));
  const project = join(root, 'one/project'), other = join(root, 'two/project');
  const saved = process.env.TABILET_AUDIT_DB;
  try {
    mkdirSync(project, { recursive: true }); mkdirSync(other, { recursive: true });
    const first = projectDatabasePath(project), second = projectDatabasePath(other);
    assert.notEqual(first, second);
    const old = join(root, 'state/tabilet/audit.sqlite3'); createSQLiteFixture(old, project, other);
    process.env.TABILET_AUDIT_DB = old;
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }).state, 'missing');
    createSQLiteFixture(first, project, other);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }).state, 'ready');
    assert.equal(readSQLite(other, { section: 'overview', offset: 0 }).state, 'missing');
    assert.equal(projectDatabasePath(project), join(project, 'tabilet/audit.sqlite3'));
  } finally {
    if (saved === undefined) delete process.env.TABILET_AUDIT_DB; else process.env.TABILET_AUDIT_DB = saved;
    rmSync(root, { recursive: true, force: true });
  }
});

test('SQLite view reports missing, unregistered, and wrong-project storage', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-')), project = join(root, 'project'), other = join(root, 'other');
  try {
    mkdirSync(project); mkdirSync(other);
    assert.equal(readSQLite(project, { section: 'overview', offset: 0 }).state, 'missing');
    const path = projectDatabasePath(project); createSQLiteFixture(path, project, other);
    mkdirSync(join(project, '.git'));
    const unregistered = join(project, 'new-session'); mkdirSync(unregistered);
    assert.equal(readSQLite(unregistered, { section: 'overview', offset: 0 }).state, 'unregistered');
    mkdirSync(join(other, 'tabilet')); copyFileSync(path, projectDatabasePath(other));
    assert.match(readSQLite(other, { section: 'overview', offset: 0 }).message, /different project/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SQLite view rejects database and sidecar symlinks', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-links-')), project = join(root, 'project'), other = join(root, 'other');
  try {
    mkdirSync(project); mkdirSync(other);
    const path = projectDatabasePath(project); mkdirSync(join(project, 'tabilet'));
    const outside = join(root, 'outside.sqlite3'); createSQLiteFixture(outside, project, other);
    symlinkSync(outside, path);
    assert.match(readSQLite(project, { section: 'overview', offset: 0 }).message, /Symlink audit database paths/);
    rmSync(path); copyFileSync(outside, path); symlinkSync(outside, path + '-wal');
    assert.match(readSQLite(project, { section: 'overview', offset: 0 }).message, /without symlinks/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SQLite view shows saved disabled and index-only settings without changing records', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-disabled-')), project = join(root, 'project'), other = join(root, 'other');
  try {
    mkdirSync(project); mkdirSync(other);
    const path = projectDatabasePath(project); createSQLiteFixture(path, project, other);
    for (const value of ['0', null, 'invalid']) {
      const db = new DatabaseSync(path);
      if (value === null) db.prepare("DELETE FROM schema_meta WHERE key='audit_enabled'").run();
      else db.prepare("INSERT OR REPLACE INTO schema_meta VALUES ('audit_enabled',?)").run(value);
      db.close();
      const before = readFileSync(path), view = readSQLite(project, { section: 'overview', offset: 0 });
      if (value === 'invalid') assert.match(view.message, /Invalid saved audit setting/);
      else { assert.equal(view.state, 'ready'); assert.equal(view.auditEnabled, false); assert.equal(view.counts.runs, 1); }
      assert.deepEqual(readFileSync(path), before);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('registered worktree reads share the database and opt-in with separate checkout rows', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-sqlite-worktree-')), project = join(root, 'project'), lease = join(root, 'lease');
  try {
    execFileSync('git', ['init', '-q', project]);
    execFileSync('git', ['-C', project, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'Initial']);
    execFileSync('git', ['-C', project, 'worktree', 'add', '-b', 'goal/A01', lease], { stdio: 'ignore' });
    createSQLiteFixture(projectDatabasePath(project), project, lease);
    const view = readSQLite(lease, { section: 'runs', offset: 0 });
    assert.equal(view.state, 'ready'); assert.equal(view.auditEnabled, true);
    assert.equal(view.databasePath, projectDatabasePath(project));
    assert.deepEqual(view.entries.map(e => e.id), ['run-other']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
