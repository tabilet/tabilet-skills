/** Project database routing shared with the canonical Python toolkit contract. */
import { closeSync, existsSync, openSync, readSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

function metadata(path: string): string {
  const descriptor = openSync(path, 'r');
  try {
    const data = Buffer.alloc(65537), size = readSync(descriptor, data, 0, data.length, 0);
    if (size > 65536) throw new Error('Git project metadata is too large');
    const value = new TextDecoder('utf-8', { fatal: true }).decode(data.subarray(0, size)).replace(/[\r\n]+$/, '');
    if (!value || /[\r\n]/.test(value)) throw new Error('Invalid Git project metadata');
    return value;
  } finally { closeSync(descriptor); }
}

function canonical(path: string): string {
  const resolved = resolve(path);
  if (existsSync(resolved)) return realpathSync(resolved);
  const parent = dirname(resolved);
  return parent === resolved ? resolved : join(canonical(parent), basename(resolved));
}

export function projectStorageRoot(project: string): string {
  const root = canonical(project);
  for (let candidate = root; ; candidate = dirname(candidate)) {
    const entry = join(candidate, '.git');
    if (existsSync(entry)) {
      if (statSync(entry).isDirectory()) return candidate;
      if (statSync(entry).isFile()) {
        const pointer = metadata(entry);
        if (!pointer.startsWith('gitdir: ')) throw new Error('Invalid .git project pointer');
        const gitdir = canonical(resolve(candidate, pointer.slice(8))), commonFile = join(gitdir, 'commondir');
        if (!existsSync(commonFile)) return candidate;
        const common = canonical(resolve(gitdir, metadata(commonFile))), owner = dirname(common);
        const registered = join(gitdir, 'gitdir');
        if (basename(common) !== '.git' || !existsSync(common) || !statSync(common).isDirectory()
            || dirname(gitdir) !== join(common, 'worktrees') || !existsSync(registered)
            || canonical(metadata(registered)) !== canonical(entry)
            || canonical(join(owner, '.git')) !== common) throw new Error('Linked worktree has no valid project registration');
        return owner;
      }
    }
    if (dirname(candidate) === candidate) return root;
  }
}

export function projectDatabasePath(project: string): string {
  return join(projectStorageRoot(project), 'tabilet', 'audit.sqlite3');
}
