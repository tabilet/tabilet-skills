/** Bounded, project-scoped reads of the optional external Tabilet database. */
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type SQLiteSection = 'overview' | 'runs' | 'events' | 'index';
export interface SQLiteQuery { section: SQLiteSection; offset: number; runId?: string; search?: string }
export interface SQLiteEntry { id: string; title: string; meta: string; detail?: string; path?: string; line?: number }
export interface SQLiteView {
  state: 'ready' | 'missing' | 'unregistered' | 'unsupported' | 'error';
  message: string; projectRoot: string; databasePath: string;
  counts: { runs: number; events: number; documents: number };
  index: { refreshedAt: string | null; complete: boolean | null; diagnostics: string[] } | null;
  entries: SQLiteEntry[]; more: boolean;
}

const PAGE = 20;
const EMPTY = { runs: 0, events: 0, documents: 0 };
function databasePath(env: NodeJS.ProcessEnv): string {
  const configured = env.TABILET_AUDIT_DB?.trim();
  if (configured) {
    const expanded = configured === '~' ? homedir() : configured.startsWith('~/') ? join(homedir(), configured.slice(2)) : configured;
    if (!isAbsolute(expanded)) throw new Error('TABILET_AUDIT_DB must be an absolute path');
    return resolve(expanded);
  }
  const state = env.XDG_STATE_HOME?.trim();
  return join(state && isAbsolute(state) ? state : join(homedir(), '.local', 'state'), 'tabilet', 'audit.sqlite3');
}
function insideProject(project: string, database: string): boolean {
  const from = relative(project, database);
  return from === '' || (from !== '..' && !from.startsWith(`..${sep}`));
}
function diagnostics(value: unknown): string[] {
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 10).map(item => (typeof item === 'string' ? item : JSON.stringify(item)).slice(0, 300)) : [];
  } catch { return ['Index diagnostics could not be decoded.']; }
}
function clipped(value: unknown, limit = 4000): string { return value == null ? '' : String(value).slice(0, limit); }

/** Opens SQLite read-only, never creates or refreshes the index, and returns only this checkout's rows. */
export function readSQLite(projectPath: string, query: SQLiteQuery, env: NodeJS.ProcessEnv = process.env): SQLiteView {
  let projectRoot = projectPath;
  try { projectRoot = realpathSync(projectPath); }
  catch { return { state: 'error', message: 'Selected session project is unavailable.', projectRoot, databasePath: '', counts: { ...EMPTY }, index: null, entries: [], more: false }; }
  let path = '';
  const output: SQLiteView = { state: 'error', message: '', projectRoot, databasePath: '', counts: { ...EMPTY }, index: null, entries: [], more: false };
  try { path = databasePath(env); output.databasePath = path; }
  catch (error) { output.message = clipped(error); return output; }
  if (insideProject(projectRoot, path)) { output.message = 'Audit database must be outside the selected project.'; return output; }
  if (!existsSync(path)) { output.state = 'missing'; output.message = 'No audit database at this path. Install and run the optional toolkit to create an index.'; return output; }
  let database: DatabaseSync | undefined;
  try {
    if (insideProject(projectRoot, realpathSync(path))) throw new Error('Audit database must be outside the selected project');
    database = new DatabaseSync(path, { readOnly: true, timeout: 1000 });
    database.exec('PRAGMA query_only=ON');
    const version = Number((database.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
    if (version !== 4) { output.state = 'unsupported'; output.message = `Database schema v${version} needs the canonical Tabilet toolkit (v4) for this view.`; return output; }
    const workspace = database.prepare('SELECT workspace_id FROM workspaces WHERE project_root=?').get(projectRoot) as { workspace_id: string } | undefined;
    if (!workspace) { output.state = 'unregistered'; output.message = 'This project has no records in the selected database. Run tabilet-audit index sync for this project.'; return output; }
    const id = workspace.workspace_id;
    output.counts = {
      runs: Number((database.prepare('SELECT COUNT(*) AS n FROM runs WHERE workspace_id=?').get(id) as { n: number }).n),
      events: Number((database.prepare('SELECT COUNT(*) AS n FROM events e JOIN runs r ON r.run_id=e.run_id WHERE r.workspace_id=?').get(id) as { n: number }).n),
      documents: Number((database.prepare('SELECT COUNT(*) AS n FROM index_documents WHERE workspace_id=?').get(id) as { n: number }).n),
    };
    const index = database.prepare('SELECT refreshed_at,complete,diagnostics_json FROM index_state WHERE workspace_id=?').get(id) as { refreshed_at: string | null; complete: number; diagnostics_json: string | null } | undefined;
    output.index = index ? { refreshedAt: index.refreshed_at, complete: index.complete === 1, diagnostics: diagnostics(index.diagnostics_json) } : { refreshedAt: null, complete: null, diagnostics: [] };
    output.state = 'ready';
    output.message = 'Audit records and the index are read-only here. Project Markdown remains authoritative.';
    if (query.section === 'overview') return output;
    if (query.section === 'runs') {
      const rows = database.prepare('SELECT run_id,operation,started_at,completed_at,result,parent_run_id FROM runs WHERE workspace_id=? ORDER BY started_at DESC,run_id DESC LIMIT ? OFFSET ?').all(id, PAGE + 1, query.offset) as Record<string, unknown>[];
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map(row => ({ id: String(row.run_id), title: clipped(row.operation, 120), meta: `${clipped(row.started_at, 60)} · ${clipped(row.result || (row.completed_at ? 'unknown' : 'unfinished'), 60)}`, detail: row.parent_run_id ? `Parent run: ${clipped(row.parent_run_id, 128)}` : undefined }));
    } else if (query.section === 'events') {
      if (!query.runId) throw new Error('Select a run before browsing its events');
      const rows = database.prepare('SELECT e.event_id,e.sequence,e.recorded_at,e.event_type,e.milestone_id,e.task_label,e.status_path,e.commit_sha,e.details_json FROM events e JOIN runs r ON r.run_id=e.run_id WHERE r.workspace_id=? AND e.run_id=? ORDER BY e.sequence LIMIT ? OFFSET ?').all(id, query.runId, PAGE + 1, query.offset) as Record<string, unknown>[];
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map(row => ({ id: String(row.event_id), title: clipped(row.event_type, 120), meta: `#${row.sequence} · ${clipped(row.recorded_at, 60)}`, detail: [row.milestone_id && `Milestone ${clipped(row.milestone_id, 30)}`, row.task_label && `Task ${clipped(row.task_label, 200)}`, row.commit_sha && `Commit ${clipped(row.commit_sha, 64)}`, row.details_json && clipped(row.details_json)].filter(Boolean).join('\n'), path: row.status_path ? String(row.status_path) : undefined }));
    } else if (query.search?.trim()) {
      const term = query.search.trim();
      const rows = database.prepare("SELECT search_id,path,line,kind,substr(text,1,350) AS snippet FROM index_search WHERE workspace_id=? AND (instr(lower(text),lower(?))>0 OR instr(lower(path),lower(?))>0) ORDER BY path,line LIMIT ? OFFSET ?").all(id, term, term, PAGE + 1, query.offset) as Record<string, unknown>[];
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map(row => ({ id: String(row.search_id), title: String(row.path), meta: `${clipped(row.kind, 70)} · line ${row.line}`, detail: clipped(row.snippet, 350), path: String(row.path), line: Number(row.line) }));
    } else {
      const rows = database.prepare('SELECT path,kind,size FROM index_documents WHERE workspace_id=? ORDER BY path LIMIT ? OFFSET ?').all(id, PAGE + 1, query.offset) as Record<string, unknown>[];
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map(row => ({ id: String(row.path), title: String(row.path), meta: `${clipped(row.kind, 70)} · ${row.size ?? '?'} bytes`, path: String(row.path) }));
    }
  } catch (error) { output.state = 'error'; output.message = `SQLite read failed: ${clipped(error, 300)}`; output.entries = []; output.more = false; }
  finally { database?.close(); }
  return output;
}
