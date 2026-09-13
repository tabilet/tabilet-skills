import { localLinks, reviewEvidence, statusMarkerProblems, statusRows, tableRows, unfencedLines, validId, type TaskRow } from './parser.ts';

export interface FileInfo { version: string; absolutePath: string; bytes?: number }
export interface FileText extends FileInfo { text: string }
export interface FilePort {
  stat(path: string, signal: AbortSignal): Promise<FileInfo>;
  read(path: string, signal: AbortSignal): Promise<FileText>;
  list(path: string, signal: AbortSignal): Promise<{ entries: readonly { name: string; type: string }[]; truncated: boolean }>;
  watch?(signal: AbortSignal, changed: () => void): Promise<void>;
}
export interface Document { path: string; text: string; version: string; absolutePath: string }
export interface Task extends TaskRow { id: string; path: string }
export interface Historical { id?: string; path: string; label: string; outcome?: string; retired?: string }
export interface Snapshot {
  documents: Document[]; tasks: Task[]; history: Historical[]; issues: string[];
  milestones: { id: string; path: string; title: string }[];
  refreshedAt: number; complete: boolean;
  goalAvailable: boolean;
}
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const activeName = /^status-([A-Z]\d{2})\.md$/;
const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1);
export class Reader {
  private cache = new Map<string, Document>();
  constructor(readonly port: FilePort) {}
  async document(path: string, signal: AbortSignal): Promise<Document> {
    const before = await this.port.stat(path, signal);
    if (before.bytes !== undefined && before.bytes > MAX_FILE_BYTES) throw new Error('File exceeds dashboard limit (2 MiB)');
    const cached = this.cache.get(path);
    if (cached?.version === before.version && cached.absolutePath === before.absolutePath) return cached;
    const value = await this.port.read(path, signal);
    signal.throwIfAborted();
    if (new TextEncoder().encode(value.text).length > MAX_FILE_BYTES) throw new Error('File exceeds dashboard limit (2 MiB)');
    if (value.text.includes('\0')) throw new Error('File is not complete valid text');
    const after = await this.port.stat(path, signal);
    if (value.version !== before.version || value.version !== after.version || before.absolutePath !== after.absolutePath) throw new Error('File changed while reading; refresh required');
    const doc = { ...value, path }; this.cache.set(path, doc); return doc;
  }
  async snapshot(signal: AbortSignal): Promise<Snapshot> {
    const documents: Document[] = [], issues: string[] = [], tasks: Task[] = [], history: Historical[] = [];
    const attempt = async (path: string, optional = false) => {
      try { const d = await this.document(path, signal); documents.push(d); return d; }
      catch (error) { signal.throwIfAborted(); if (!optional || !String(error).includes('workspace-file/not-found')) issues.push(`${path}: ${String(error)}`); }
    };
    const listing = async (path: string, optional = false) => {
      try {
        const result = await this.port.list(path, signal);
        if (result.truncated) issues.push(`${path}: directory listing truncated`);
        return result.entries;
      } catch (error) { signal.throwIfAborted(); if (!optional || !String(error).includes('workspace-file/not-found')) issues.push(`${path}: ${String(error)}`); return []; }
    };
    const [milestone, architecture, bankEntries, historyEntries, docsEntries] = await Promise.all([
      attempt('memory-bank/milestone.md'), attempt('memory-bank/architecture.md'),
      listing('memory-bank'), listing('docs/history', true), listing('docs', true),
    ]);
    await Promise.all(['product', 'tech-stack', 'lessons'].map(n => attempt(`memory-bank/${n}.md`)));
    await attempt('AGENTS.md');
    let goalAvailable = false;
    try { await this.port.stat('GOAL.md', signal); goalAvailable = true; } catch { signal.throwIfAborted(); }
    const historyLink = milestone && localLinks(milestone.text, milestone.path).find(l => /(?:^|\/)history\/index\.md$/.test(l.path));
    const historyIndex = await attempt(historyLink?.path || 'docs/history/index.md', true);
    const activePaths = new Set(bankEntries.filter(e => activeName.test(e.name)).map(e => `memory-bank/${e.name}`));
    for (const link of milestone ? localLinks(milestone.text, milestone.path) : []) if (activeName.test(basename(link.path))) activePaths.add(link.path);
    const milestones: Snapshot['milestones'] = [];
    for (const path of [...activePaths].sort()) {
      const id = basename(path).match(activeName)![1];
      if (!validId.test(id)) issues.push(`${path}: invalid permanent ID`);
      const title = milestone && unfencedLines(milestone.text).find(([, s]) => new RegExp('^## ' + id + '(?:\\s|$)').test(s))?.[1].slice(3);
      milestones.push({ id, path, title: title || id });
    }
    // Bounded parallelism keeps large ledgers responsive without flooding Remote.
    const activeDocuments = new Map<string, Document>();
    for (let offset = 0; offset < milestones.length; offset += 12) {
      await Promise.all(milestones.slice(offset, offset + 12).map(async ({ path }) => {
        const doc = await attempt(path); if (doc) activeDocuments.set(path, doc);
      }));
    }
    // An indexed absolute path and directory discovery may name the same file.
    // Only the host's file identity can establish this; matching contents cannot.
    const identities = new Set<string>(), aliases = new Set<string>();
    for (const { id, path } of milestones) {
      const doc = activeDocuments.get(path); if (!doc) continue;
      const identity = JSON.stringify([id, doc.absolutePath]);
      if (identities.has(identity)) { aliases.add(path); continue; }
      identities.add(identity);
      const rows = statusRows(doc.text);
      issues.push(...statusMarkerProblems(doc.text).map(p => `${path}: ${p}`));
      if (!rows.length) issues.push(`${path}: no recognized task rows`);
      const items = new Set<string>();
      for (const row of rows) {
        if (items.has(row.item)) issues.push(`${path}: duplicate row identity ${row.item}`);
        items.add(row.item); tasks.push({ ...row, id, path });
        if (row.state === 'historical' && !/\bsuccessor\b\s*:?\s+\S/i.test(row.cells.slice(2).join(' '))) issues.push(`${path}:${row.line}: historical row has no named successor`);
      }
    }
    for (let i = milestones.length - 1; i >= 0; i--) if (aliases.has(milestones[i].path)) milestones.splice(i, 1);
    for (let i = documents.length - 1; i >= 0; i--) if (aliases.has(documents[i].path)) documents.splice(i, 1);
    const indexedHistory = new Set<string>();
    if (historyIndex) for (const row of tableRows(historyIndex.text)) {
      if (!/^[A-Z]\d{2}$/.test(row.cells[0])) continue;
      const id = row.cells[0];
      if (indexedHistory.has(id)) issues.push(`Duplicate history index ID: ${id}`);
      indexedHistory.add(id);
      const link = localLinks(row.cells.join(' | '), historyIndex.path).find(l => activeName.test(basename(l.path)));
      if (!validId.test(id) || row.cells.length !== 5 || !['completed', 'cancelled', 'superseded'].includes(row.cells[1]) || !link || basename(link.path) !== `status-${id}.md`) issues.push(`Invalid history index entry: ${id}`);
      if (link) {
        history.push({ id, path: link.path, label: `${id} — ${row.cells[1]}`, outcome: row.cells[1], retired: row.cells[2] });
        try { await this.port.stat(link.path, signal); } catch (e) { signal.throwIfAborted(); issues.push(`${link.path}: ${String(e)}`); }
      }
    }
    for (const e of historyEntries) if (activeName.test(e.name)) {
      const id = e.name.match(activeName)![1];
      if (!validId.test(id)) issues.push(`${e.name}: invalid retired permanent ID`);
      if (!indexedHistory.has(id)) { issues.push(`${id}: retired record is missing from history index`); history.push({ id, path: `docs/history/${e.name}`, label: `${id} — unindexed` }); }
    }
    for (const e of historyEntries) if (/^status.*\.md$/.test(e.name) && !activeName.test(e.name)) issues.push(`Unsupported retired status filename: docs/history/${e.name}`);
    for (const { id } of milestones) if (history.some(h => h.id === id)) issues.push(`Duplicate active/retired ID: ${id}; retirement may be interrupted`);
    if (milestone) {
      const declared = new Set<string>();
      for (const [, s] of unfencedLines(milestone.text)) {
        const m = s.match(/^## ([A-Z]\d{2})(?:\s|$)/); if (m) declared.add(m[1]);
      }
      for (const row of tableRows(milestone.text)) {
        const id = row.cells[0].replace(/^`|`$/g, '').match(/^(?:\[)?([A-Z]\d{2})(?:\]\(.*\))?$/)?.[1]; if (id) declared.add(id);
      }
      for (const id of declared) {
        if (!milestones.some(m => m.id === id && documents.some(d => d.path === m.path))) issues.push(`${id}: active specification/index has no active status file`);
        if (indexedHistory.has(id)) issues.push(`${id}: retired ID remains in active milestone index/specification`);
      }
    }
    for (const e of bankEntries) if (/^status.*\.md$/.test(e.name) && !activeName.test(e.name)) issues.push(`Unsupported legacy status structure: memory-bank/${e.name}`);
    const ids = new Set<string>();
    for (const m of milestones) { if (ids.has(m.id)) issues.push(`Duplicate active ID: ${m.id}`); ids.add(m.id); }
    if (tasks.filter(t => t.state === 'in_progress').length > 1) issues.push('Multiple rows are in progress; reconcile the ledger before selecting work');
    if (!milestones.length && !indexedHistory.size) issues.push('No active or indexed retired milestones found');
    const extra = new Map<string, Historical>();
    for (const doc of [architecture, historyIndex]) if (doc) for (const l of localLinks(doc.text, doc.path)) {
      if (/archive-[A-Z]\d{2}\.md$|knowledge\.md$/.test(l.path)) extra.set(l.path, l);
    }
    for (const e of docsEntries) if (/^archive-[A-Z]\d{2}\.md$/.test(e.name)) extra.set(`docs/${e.name}`, { path: `docs/${e.name}`, label: e.name });
    if (historyEntries.some(e => e.name === 'knowledge.md')) extra.set('docs/history/knowledge.md', { path: 'docs/history/knowledge.md', label: 'Knowledge history' });
    history.push(...extra.values());
    for (const d of documents.filter(d => activeName.test(basename(d.path)))) if (reviewEvidence(d.text).counter === 'Conflicting or invalid') issues.push(`${d.path}: conflicting or invalid review counter`);
    // A second metadata sweep detects relocation or edits during the complete read.
    await Promise.all(documents.map(async d => {
      try { if ((await this.port.stat(d.path, signal)).version !== d.version) issues.push(`${d.path}: changed during refresh`); }
      catch (e) { signal.throwIfAborted(); issues.push(`${d.path}: disappeared or became unreadable during refresh`); }
    }));
    signal.throwIfAborted();
    return { documents, tasks: tasks.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line), history, milestones, issues, refreshedAt: Date.now(), complete: !issues.length, goalAvailable };
  }
}
