import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile, mkdtemp } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = data => createHash('sha256').update(data).digest('hex');
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { maxBuffer: 16 * 1024 * 1024 });
export async function pin(repo, ref = 'HEAD') {
  const commit = git(repo, 'rev-parse', `${ref}^{commit}`).toString().trim();
  const version = JSON.parse(git(repo, 'show', `${commit}:.claude-plugin/plugin.json`)).version;
  const paths = git(repo, 'ls-tree', '-r', '--name-only', commit, 'skills', 'tests/fixtures/parser-conformance.json', 'LICENSE').toString().trim().split('\n');
  const files = Object.fromEntries(paths.map(path => [path, hash(git(repo, 'show', `${commit}:${path}`))]));
  await writeFile(join(root, 'upstream.lock.json'), JSON.stringify({ repository: 'https://github.com/tabilet/skills.git', version, commit, files }, null, 2) + '\n');
}
export async function stage() {
  const lock = JSON.parse(await readFile(join(root, 'upstream.lock.json'), 'utf8'));
  if (!/^[a-f0-9]{40}$/.test(lock.commit)) throw new Error('Upstream requires a full immutable Git commit');
  let repo = process.env.TABILET_UPSTREAM_CHECKOUT || resolve(root, '../skills');
  let temp;
  try { git(repo, 'cat-file', '-e', lock.commit); }
  catch {
    temp = await mkdtemp(join(tmpdir(), 'tabilet-upstream-')); repo = temp;
    git(repo, 'init', '-q'); git(repo, 'fetch', '--depth=1', lock.repository, lock.commit);
  }
  try {
    const expected = git(repo, 'ls-tree', '-r', '--name-only', lock.commit, 'skills', 'tests/fixtures/parser-conformance.json', 'LICENSE').toString().trim().split('\n').sort();
    if (JSON.stringify(expected) !== JSON.stringify(Object.keys(lock.files).sort())) throw new Error('Upstream lock omits or adds payload files');
    if (JSON.parse(git(repo, 'show', `${lock.commit}:.claude-plugin/plugin.json`)).version !== lock.version) throw new Error('Upstream version does not match its pinned commit');
    const files = new Map();
    for (const [path, digest] of Object.entries(lock.files)) {
      if (path.startsWith('/') || path.split('/').includes('..')) throw new Error('Unsafe upstream path');
      const data = git(repo, 'show', `${lock.commit}:${path}`);
      if (hash(data) !== digest) throw new Error(`Upstream hash mismatch: ${path}`);
      files.set(path, data);
    }
    const names = [...files.keys()].filter(p => /^skills\/[^/]+\/SKILL.md$/.test(p));
    if (names.length !== 6) throw new Error('Expected six complete canonical skills');
    await rm(join(root, 'payload'), { recursive: true, force: true });
    for (const [path, data] of files) {
      const destination = join(root, 'payload', path);
      await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, data);
    }
  } finally { if (temp) await rm(temp, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'pin') await pin(resolve(process.argv[3]), process.argv[4]);
  else await stage();
}
