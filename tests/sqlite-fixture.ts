import { DatabaseSync } from 'node:sqlite';
import { realpathSync } from 'node:fs';

export function createSQLiteFixture(path: string, project: string, other: string): void {
  const db = new DatabaseSync(path);
  try {
    db.exec(`PRAGMA user_version=4;
      CREATE TABLE workspaces(workspace_id TEXT PRIMARY KEY,project_root TEXT UNIQUE NOT NULL);
      CREATE TABLE runs(run_id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,operation TEXT NOT NULL,started_at TEXT NOT NULL,completed_at TEXT,result TEXT,parent_run_id TEXT);
      CREATE TABLE events(event_id TEXT PRIMARY KEY,run_id TEXT NOT NULL,sequence INTEGER NOT NULL,recorded_at TEXT NOT NULL,event_type TEXT NOT NULL,milestone_id TEXT,task_label TEXT,status_path TEXT,commit_sha TEXT,details_json TEXT);
      CREATE TABLE index_state(workspace_id TEXT PRIMARY KEY,refreshed_at TEXT,complete INTEGER,diagnostics_json TEXT);
      CREATE TABLE index_documents(workspace_id TEXT NOT NULL,path TEXT NOT NULL,kind TEXT NOT NULL,size INTEGER,text TEXT NOT NULL);
      CREATE TABLE index_search(search_id INTEGER PRIMARY KEY,workspace_id TEXT NOT NULL,path TEXT NOT NULL,line INTEGER NOT NULL,kind TEXT NOT NULL,text TEXT NOT NULL);`);
    const active = realpathSync(project), separate = realpathSync(other);
    db.prepare('INSERT INTO workspaces VALUES (?,?)').run('active', active);
    db.prepare('INSERT INTO workspaces VALUES (?,?)').run('other', separate);
    db.prepare('INSERT INTO runs VALUES (?,?,?,?,?,?,?)').run('run-active', 'active', 'memory-bank-next', '2026-10-01T12:00:00Z', '2026-10-01T12:01:00Z', 'completed', null);
    db.prepare('INSERT INTO runs VALUES (?,?,?,?,?,?,?)').run('run-other', 'other', 'secret-operation', '2026-10-01T13:00:00Z', null, null, null);
    db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?)').run('event-active', 'run-active', 1, '2026-10-01T12:00:30Z', 'task_completed', 'A01', 'Build A01', 'tabilet/memory-bank/status-A01.md', 'abcdef', '{"result":"verified"}');
    db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?)').run('event-other', 'run-other', 1, '2026-10-01T13:00:30Z', 'secret-event', null, null, null, null, '{"secret":true}');
    db.prepare('INSERT INTO index_state VALUES (?,?,?,?)').run('active', '2026-10-01T12:02:00Z', 1, '[]');
    db.prepare('INSERT INTO index_documents VALUES (?,?,?,?,?)').run('active', 'tabilet/memory-bank/status-A01.md', 'status', 123, '# Build A01');
    db.prepare('INSERT INTO index_documents VALUES (?,?,?,?,?)').run('other', 'private.md', 'status', 123, 'secret text');
    db.prepare('INSERT INTO index_search VALUES (?,?,?,?,?,?)').run(1, 'active', 'tabilet/memory-bank/status-A01.md', 5, 'task', 'Build A01 searchable');
    db.prepare('INSERT INTO index_search VALUES (?,?,?,?,?,?)').run(2, 'other', 'private.md', 1, 'task', 'secret searchable');
  } finally { db.close(); }
}
