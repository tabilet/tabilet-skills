import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Reader, type Document, type FilePort, type Snapshot } from './reader.ts';
import { markers, retiredRecord, reviewEvidence, type State } from './parser.ts';
import { commands, insertPrepared, prepare, type Command, type Composer } from './requests.ts';
import type { SkillSource } from './dsh.ts';

const views = ['Overview', 'Tasks', 'Acceptance', 'Memory', 'History', 'Compatibility', 'SQLite'] as const;
const labels: Record<State, string> = { pending: 'Pending', completed: 'Completed', in_progress: 'In progress', blocked: 'Blocked', cancelled: 'Cancelled', historical: 'Closed historical' };
export interface DashboardProps {
  sessionId: string; visible: boolean; port: FilePort; composer?: Composer;
  sources(signal: AbortSignal): Promise<SkillSource[]>;
  navigate(path: string, line?: number): void;
}
export function Dashboard({ sessionId, visible, port, composer, sources, navigate }: DashboardProps) {
  const reader = useMemo(() => new Reader(port), [port]);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [view, setView] = useState<typeof views[number]>('Overview');
  const [catalog, setCatalog] = useState<SkillSource[]>([]), [catalogError, setCatalogError] = useState('');
  const [refreshId, setRefreshId] = useState(0);
  const [search, setSearch] = useState(''), [milestone, setMilestone] = useState(''), [lane, setLane] = useState(''), [state, setState] = useState('');
  const [opened, setOpened] = useState('');
  const [command, setCommand] = useState<Command>();
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!visible) return;
    let active = true, working = false, queued = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (!active || document.visibilityState === 'hidden') return;
      if (working) { queued = true; return; }
      working = true; setLoading(true); setError('');
      try {
        const result = await reader.snapshot(controller.signal);
        if (active) setSnapshot(result);
        try { const catalog = await sources(controller.signal); if (active) { setCatalog(catalog); setCatalogError(''); } } catch (e) { if (active) setCatalogError(String(e)); }
      } catch (e) { if (active) setError(String(e)); }
      finally { working = false; if (active) setLoading(false); }
      if (queued && active) { queued = false; void refresh(); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const focus = () => void refresh();
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    void port.watch?.(controller.signal, focus).catch(e => { if (active) setError(`Change feed unavailable; periodic refresh remains active. ${String(e)}`); });
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [reader, sources, port, visible, refreshId]);
  const tasks = snapshot?.tasks || [];
  const progress = tasks.filter(t => t.state === 'in_progress');
  const filtered = tasks.filter(t => (!state || t.state === state) && (!milestone || t.id === milestone) && (!lane || t.id[0] === lane) && (!search || `${t.id} ${t.cells.join(' ')}`.toLowerCase().includes(search.toLowerCase())));
  const sourceButton = (path: string, line?: number) => <button className="mb-source" onClick={() => navigate(path, line)}>{path}{line ? `:${line}` : ''} ↗</button>;
  const closePreview = () => { setCommand(undefined); previousFocus.current?.focus(); };
  return <section className="mb-dashboard" aria-label="Memory Bank" data-session={sessionId}>
    <style>{css}</style>
    <header className="mb-header"><div><strong>Memory Bank</strong><small>Project records · {sessionId.slice(0, 12)}</small></div><button onClick={() => setRefreshId(n => n + 1)} aria-label="Refresh memory bank">↻ Refresh</button></header>
    <div className="mb-freshness" role="status">{loading ? 'Refreshing — previous data may be stale' : snapshot ? `${snapshot.complete ? 'Active records read' : 'Incomplete or conflicting records'} · ${new Date(snapshot.refreshedAt).toLocaleTimeString()}` : 'No complete read available'}</div>
    {error && <p role="alert" className="mb-warning">{error}</p>}
    <nav aria-label="Memory Bank views" className="mb-nav">{views.map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setOpened(''); }}>{v}</button>)}</nav>
    {snapshot?.layout === 'legacy' && <p className="mb-warning" role="status">v1.5.0 project: read-only view. Migrate explicitly with migrate-v1.5-to-v2.py before using v2 workflows.</p>}
    {snapshot?.layout === 'mixed' && <p className="mb-warning" role="status">Mixed or uncertain project layout. Repair or resume migration before using v2 workflows.</p>}
    {(snapshot?.layout === 'v2' || snapshot?.layout === 'new') && <details className="mb-workflows"><summary>Prepare a workflow request</summary><p>Preview a request, then send it from the conversation. No workflow runs here.</p><div className="mb-actions">{commands.map(c => <button key={c} onClick={e => { previousFocus.current = e.currentTarget; setCommand(c); }}>{c === 'next' ? (progress.length === 1 ? 'Resume' : 'Next') : c[0].toUpperCase() + c.slice(1)}</button>)}</div></details>}
    {!!snapshot?.issues.length && view !== 'Compatibility' && <button className="mb-warning mb-conflicts" onClick={() => setView('Compatibility')}>{snapshot.issues.length} compatibility issue{snapshot.issues.length === 1 ? '' : 's'} — inspect records</button>}
    {view === 'Overview' && <div>
      <div className="mb-counts">{Object.entries(markers).map(([marker, value]) => <button key={value} onClick={() => { setState(value); setView('Tasks'); }}><b>{tasks.filter(t => t.state === value).length}</b><span>{marker.replaceAll('`', '')} {labels[value]}</span></button>)}</div>
      <h3>Active milestones</h3>{snapshot?.milestones.length ? snapshot.milestones.map(m => <div key={m.path} className="mb-record"><strong>{m.title}</strong>{sourceButton(m.path)}</div>) : <p>{snapshot?.history.some(h => h.id) ? 'No active milestones. Retired identities are indexed below History.' : 'No active milestones found.'}</p>}
      <h3>In progress</h3>{progress.length ? progress.map(t => <div className="mb-record" key={`${t.path}:${t.line}`}>{t.id} · {t.item}{sourceButton(t.path, t.line)}</div>) : <p>No row is in progress.</p>}
      <h3>Blocked</h3>{tasks.filter(t => t.state === 'blocked').map(t => <div className="mb-record" key={`${t.path}:${t.line}`}><strong>{t.id} · {t.item}</strong><p>{t.cells.slice(2).join(' | ')}</p>{sourceButton(t.path, t.line)}</div>)}
      <p className="mb-note">Markers record task state. They do not establish exclusive ownership or milestone acceptance. Historical document validity is checked when opened.</p>
    </div>}
    {view === 'Tasks' && <div>
      <div className="mb-filters"><label>Search<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Task text or notes" /></label>
      <label>Milestone<select value={milestone} onChange={e => setMilestone(e.target.value)}><option value="">All milestones</option>{snapshot?.milestones.map(m => <option key={m.path} value={m.id}>{m.title}</option>)}</select></label>
      <label>Lane<select value={lane} onChange={e => setLane(e.target.value)}><option value="">All lanes</option>{[...new Set(tasks.map(t => t.id[0]))].sort().map(l => <option key={l}>{l}</option>)}</select></label>
      <label>State<select value={state} onChange={e => setState(e.target.value)}><option value="">All states</option>{Object.entries(labels).map(([s, label]) => <option key={s} value={s}>{label}</option>)}</select></label></div>
      <p>{filtered.length} matching rows</p>{filtered.map(t => <article className="mb-record" key={`${t.path}:${t.line}`}><small>{t.id} · {labels[t.state]}</small><h3>{t.item}</h3><pre>{t.cells.slice(2).join('\n\n')}</pre>{sourceButton(t.path, t.line)}</article>)}
    </div>}
    {view === 'Acceptance' && <div><p>Recorded evidence is shown verbatim. Terminal rows alone do not establish acceptance. Unlabelled or ambiguous counters remain unknown.</p>{snapshot?.documents.filter(d => /status-[A-Z]\d{2}\.md$/.test(d.path)).map(d => {
      const evidence = reviewEvidence(d.text);
      return <article className="mb-record" key={d.path}><h3>{d.path.split('/').at(-1)}</h3><p>Current review counter: <strong>{evidence.counter}</strong></p>{evidence.evidence.length ? evidence.evidence.map(([line, s]) => <div key={line}><pre>{s}</pre>{sourceButton(d.path, line)}</div>) : <p>Verification and review evidence: Unknown</p>}</article>;
    })}</div>}
    {view === 'Memory' && <div><div className="mb-actions">{['product', 'architecture', 'tech-stack', 'lessons'].map(name => <button key={name} onClick={() => setOpened(`${snapshot?.layout === 'legacy' ? '' : 'tabilet/'}memory-bank/${name}.md`)}>{name}</button>)}</div>{opened ? <OpenDocument key={opened} reader={reader} path={opened} snapshot={snapshot} navigate={navigate} visible={visible} /> : <p>Open a current memory document.</p>}</div>}
    {view === 'History' && <div><p>Index metadata is available immediately. Full retired records, knowledge history, and frozen context archives load when opened.</p>{snapshot?.documents.filter(d => /history\/index.md$/.test(d.path)).map(d => <button key={d.path} onClick={() => setOpened(d.path)}>Open history index</button>)}{snapshot?.history.map(h => <div className="mb-record" key={h.path}><button onClick={() => setOpened(h.path)}>{h.label}</button><small>Document verification: {opened === h.path ? 'see opened record' : 'not loaded'}</small></div>)}{opened && <OpenDocument key={opened} reader={reader} path={opened} snapshot={snapshot} navigate={navigate} visible={visible} />}</div>}
    {view === 'Compatibility' && <div><h3>Project records</h3>{snapshot?.issues.length ? <ul>{snapshot.issues.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>No active-ledger conflicts detected. Historical bodies are verified only when opened.</p>}
      <h3>Winning skill sources</h3>{catalogError && <p role="alert">Skill catalog unavailable: {catalogError}</p>}{commands.map(c => { const skill = catalog.find(s => s.name === `memory-bank-${c}`); return <div className="mb-record" key={c}><strong>memory-bank-{c}</strong>{skill ? <><p>{skill.source}{skill.provider ? ` · ${skill.provider}` : ''}</p>{skill.location && <pre>{skill.location}</pre>}{skill.provider !== 'tabilet-skills' && <p>Duplicate: the bundled copy is shadowed by this winning override.</p>}</> : <p>Not reported by the current session catalog.</p>}</div>; })}<p>DSH resolves precedence. Its public catalog reports winners; other shadowed copies may exist. Installing skills does not upgrade project rules. Use the explicit Upgrade workflow.</p>{!composer && <p>Composer capability unavailable; requests can be copied.</p>}</div>}
    {view === 'SQLite' && <div>
      <h3>Optional SQLite audit and lookup</h3>
      <p>SQLite is an optional external audit database and rebuildable index of project Markdown. Markdown remains authoritative. This sidebar reads project files; it does not open or modify the database.</p>
      <h3>Database location</h3>
      <p>The default is <code>{'${XDG_STATE_HOME:-~/.local/state}/tabilet/audit.sqlite3'}</code>. Set <code>TABILET_AUDIT_DB</code> to use another external path. Keep the database outside the project.</p>
      <p>This is the default path for standalone <code>tabilet-audit</code> commands. It does not enable automatic API-runner auditing; that stays off unless you set <code>TABILET_AUDIT_DB</code> or pass <code>--audit-db</code> to the runner.</p>
      <h3>Inspect audit records</h3>
      <pre><code>tabilet-audit audit runs --project /absolute/path/to/project</code></pre>
      <pre><code>tabilet-audit audit events --run-id RUN_ID</code></pre>
      <h3>Search or browse the Markdown index</h3>
      <pre><code>tabilet-audit index search /absolute/path/to/project 'authentication'</code></pre>
      <pre><code>tabilet-audit explorer /absolute/path/to/project --port 8000</code></pre>
      <p>After starting the local explorer, open <code>http://localhost:8000/</code>. Install the optional toolkit separately; these commands are examples only and are not run by the sidebar.</p>
      <p><a href="https://github.com/tabilet/skills/blob/v2.1.0/docs/sqlite.md" target="_blank" rel="noreferrer">Read the SQLite audit and lookup guide ↗</a></p>
    </div>}
    {command && (snapshot?.layout === 'v2' || snapshot?.layout === 'new') && <RequestPreview key={`${sessionId}:${command}`} command={command} composer={composer} resume={progress.length === 1} issues={[...(snapshot?.issues || []), ...(command === 'goal' && !snapshot?.goalAvailable ? ['Project tabilet/GOAL.md is missing or unreadable; the skill must resolve this before executing.'] : [])]} close={closePreview} />}
  </section>;
}
function OpenDocument({ reader, path, snapshot, navigate, visible }: { reader: Reader; path: string; snapshot?: Snapshot; navigate: DashboardProps['navigate']; visible: boolean }) {
  const [doc, setDoc] = useState<Document>(), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController(); setLoading(true); setError('');
    void reader.document(path, controller.signal).then(d => {
      if (controller.signal.aborted) return;
      setDoc(d);
      if (/status-[A-Z]\d{2}\.md$/.test(path) && snapshot?.history.some(h => h.path === path)) {
        try {
          const record = retiredRecord(d.text, path.split('/').at(-1)!);
          const indexed = snapshot.history.find(h => h.path === path);
          if ((indexed?.outcome && indexed.outcome !== record.metadata.Outcome) || (indexed?.retired && indexed.retired !== record.metadata.Retired)) throw new Error('History index and record metadata conflict');
        } catch (e) { setError(`Invalid retired record: ${String(e)}`); }
      }
      setLoading(false);
    }, e => { if (!controller.signal.aborted) { setError(String(e)); setLoading(false); } });
    return () => controller.abort();
  }, [reader, path, snapshot, visible]);
  return <article className="mb-document"><h3>{path}</h3>{loading && <p role="status">Reading document — previous content may be stale</p>}{error && <p role="alert">{error}</p>}<button onClick={() => navigate(path)}>Open source ↗</button>{doc && <pre>{doc.text}</pre>}</article>;
}
function RequestPreview({ command, composer, resume, issues, close }: { command: Command; composer?: Composer; resume: boolean; issues: string[]; close(): void }) {
  const [order, setOrder] = useState(''), [completion, setCompletion] = useState(''), [policy, setPolicy] = useState<'task' | 'none'>('task');
  const [requestedChange, setRequestedChange] = useState(''), [review, setReview] = useState(''), [scope, setScope] = useState(''), [message, setMessage] = useState('');
  const revision = useRef(composer?.snapshot().draftRev ?? -1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  let text = '', problem = '';
  try { text = prepare(command, { order, completion, policy, requestedChange, review, scope, resume }); } catch (e) { problem = (e as Error).message; }
  return <div className="mb-overlay"><div ref={ref} className="mb-preview" role="dialog" aria-modal="true" aria-label={`Prepare ${command} request`} tabIndex={-1} onKeyDown={e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key !== 'Tab') return;
    const items = [...ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,[tabindex="0"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && index <= 0) { e.preventDefault(); items.at(-1)?.focus(); }
    else if (!e.shiftKey && (index < 0 || index === items.length - 1)) { e.preventDefault(); items[0]?.focus(); }
  }}><header className="mb-header"><h3>Prepare {command} request</h3><button onClick={close} aria-label="Close request preview">Close</button></header>
    <p>Review this request before inserting it. Send it normally from the conversation to start the skill.</p>
    {!!issues.length && <p className="mb-warning">Known ledger conflicts: {issues.join('; ')}</p>}
    {command === 'goal' && <><label>Milestone order<input autoComplete="off" value={order} onChange={e => setOrder(e.target.value)} placeholder="M01 -> M02" /></label><label>Completion conditions<textarea value={completion} onChange={e => setCompletion(e.target.value)} /></label><label>Commit policy<select value={policy} onChange={e => setPolicy(e.target.value as 'task' | 'none')}><option value="task">task — commit each task</option><option value="none">none — no commits</option></select></label><p>EXTERNAL_MUTATIONS: none</p></>}
    {command === 'propose' && <label>Requested change<textarea required value={requestedChange} onChange={e => setRequestedChange(e.target.value)} /></label>}
    {command === 'reconcile' && <label>Local review path or URL<input value={review} onChange={e => setReview(e.target.value)} /><small>The preview does not fetch this source. The skill retains its separate remote-fetch confirmation.</small></label>}
    {(command === 'init' || command === 'archive') && <label>Requested scope (optional)<textarea value={scope} onChange={e => setScope(e.target.value)} /></label>}
    {problem ? <p>{problem}</p> : <label>Request preview<textarea aria-label="Request preview" readOnly rows={9} value={text} /></label>}
    <div className="mb-actions"><button disabled={!text || !composer} onClick={() => setMessage(insertPrepared(composer, text, revision.current))}>Insert into empty draft</button><button disabled={!text} onClick={() => { void Promise.resolve().then(() => { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); return navigator.clipboard.writeText(text); }).then(() => setMessage('Request copied.'), () => setMessage('Clipboard unavailable. Select and copy the preview text.')); }}>Copy request</button></div>
    {!composer && <p>Composer capability unavailable. Copy the request preview.</p>}
    <p role="status">{message}</p>
  </div></div>;
}
const css = `
.mb-dashboard{height:100%;overflow:auto;padding:16px;box-sizing:border-box;font:13px/1.5 system-ui,sans-serif;color:inherit;min-width:0}.mb-dashboard *{box-sizing:border-box}.mb-dashboard button,.mb-dashboard input,.mb-dashboard select,.mb-dashboard textarea{font:inherit;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:7px;padding:7px 10px;max-width:100%}.mb-dashboard button{cursor:pointer;white-space:normal;text-align:left}.mb-dashboard button:hover{background:color-mix(in srgb,currentColor 7%,transparent)}.mb-dashboard button:disabled{opacity:.45;cursor:default}.mb-dashboard :focus-visible{outline:2px solid #629bed;outline-offset:2px}.mb-header{display:flex;justify-content:space-between;gap:10px;align-items:center}.mb-header strong{font-size:17px}.mb-dashboard small{display:block;opacity:.7;overflow-wrap:anywhere}.mb-freshness{font-size:11px;opacity:.7;margin:8px 0 14px}.mb-nav,.mb-actions{display:flex;flex-wrap:wrap;gap:6px}.mb-nav button{border:none;padding:6px 9px}.mb-nav button[aria-pressed=true]{background:color-mix(in srgb,#629bed 20%,transparent)}.mb-workflows{margin:16px 0;padding:10px;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:8px}.mb-workflows summary{cursor:pointer}.mb-counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:16px 0}.mb-counts b{display:block;font-size:24px}.mb-counts span{font-size:11px}.mb-record{padding:12px 0;border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent);overflow-wrap:anywhere}.mb-dashboard h3{font-size:14px;margin:12px 0 6px}.mb-dashboard p{margin:8px 0;overflow-wrap:anywhere}.mb-dashboard pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 ui-monospace,monospace;margin:10px 0}.mb-source{display:block;font-size:11px!important;margin-top:8px;color:#548edd!important}.mb-note{opacity:.7;font-size:11px;margin-top:20px!important}.mb-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}.mb-dashboard label{display:flex;flex-direction:column;gap:4px;margin:8px 0}.mb-dashboard textarea{resize:vertical;min-height:64px;width:100%}.mb-warning{padding:10px;border-left:3px solid #c78a31!important;background:color-mix(in srgb,#c78a31 10%,transparent)!important;overflow-wrap:anywhere}.mb-conflicts{width:100%;margin-bottom:10px}.mb-overlay{position:fixed;inset:0;z-index:10000;background:#0006;display:flex;align-items:center;justify-content:center;padding:18px}.mb-preview{background:Canvas;color:CanvasText;color-scheme:light dark;width:600px;max-width:100%;max-height:90vh;overflow:auto;padding:20px;border-radius:12px;box-shadow:0 14px 50px #0005}.mb-document{margin-top:14px}.mb-dashboard li{margin:8px 0;overflow-wrap:anywhere}@media(max-width:420px){.mb-dashboard{padding:10px}.mb-preview{padding:12px}.mb-header{align-items:flex-start}}
`;
