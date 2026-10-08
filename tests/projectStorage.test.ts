import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectDatabasePath, projectStorageRoot } from '../src/projectStorage.ts';

test('project database location matches the canonical shared storage fixture', () => {
  const data = JSON.parse(readFileSync(new URL('../payload/tests/fixtures/project-storage.json', import.meta.url), 'utf8'));
  assert.equal(data.schema, 'tabilet.project-storage/v2');
  assert.equal(data.database_relative, 'tabilet/audit.sqlite3');
  assert.equal(data.ignore_pattern, '/audit.sqlite3*');
  assert.equal(data.enable_key, 'audit_enabled');
});

test('registered worktrees, nested sessions, and symlink aliases share their project path through Git metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabilet-project-path-'));
  const project = join(root, 'project'), lease = join(root, 'project.goal/A01');
  try {
    execFileSync('git', ['init', '-q', project]);
    writeFileSync(join(project, 'source.md'), '# Source\n');
    execFileSync('git', ['-C', project, 'add', '.']);
    execFileSync('git', ['-C', project, '-c', 'user.name=Storage Test', '-c', 'user.email=storage@example.invalid', 'commit', '-qm', 'Initial']);
    execFileSync('git', ['-C', project, 'worktree', 'add', '-b', 'goal/A01', lease], { stdio: 'ignore' });
    const expected = projectDatabasePath(project);
    assert.equal(projectStorageRoot(lease), project);
    assert.equal(projectDatabasePath(lease), expected);
    assert.equal(projectDatabasePath(join(project, 'nested')), expected);
    const alias = join(root, 'alias'); symlinkSync(project, alias, 'dir');
    assert.equal(projectDatabasePath(alias), expected);
    assert.equal(expected, join(project, 'tabilet/audit.sqlite3'));
    const pointer = readFileSync(join(lease, '.git'), 'utf8').trim().slice(8);
    writeFileSync(join(pointer, 'gitdir'), join(root, 'wrong/.git') + '\n');
    assert.throws(() => projectDatabasePath(lease), /no valid project registration/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
