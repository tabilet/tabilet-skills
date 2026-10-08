/** Project database routing shared with the canonical Python toolkit contract. */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';

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

export function projectStorageId(canonicalProject: string): string {
  return createHash('sha256').update(canonicalProject, 'utf8').digest('hex');
}

export function projectDatabasePath(project: string, env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.TABILET_AUDIT_DB?.trim();
  const expand = (value: string) => value === '~' ? homedir() : value.startsWith('~/') ? join(homedir(), value.slice(2)) : value;
  if (configured && configured !== 'project') {
    const external = expand(configured);
    if (!isAbsolute(external)) throw new Error('Audit database must be project or an absolute external path');
    return resolve(external);
  }
  const state = expand(env.XDG_STATE_HOME?.trim() || '');
  const base = state && isAbsolute(state) ? state : join(homedir(), '.local', 'state');
  return join(canonical(base), 'tabilet', 'projects', projectStorageId(projectStorageRoot(project)), 'audit.sqlite3');
}
