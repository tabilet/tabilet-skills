/** Read-only port of the canonical Python table and retirement reader. */
export const markers = {
  '`[ ]`': 'pending', '`[+]`': 'completed', '`[~]`': 'in_progress',
  '`[!]`': 'blocked', '`[X]`': 'cancelled', '`[-]`': 'historical',
} as const;
export type State = typeof markers[keyof typeof markers];
export interface TableRow { cells: string[]; line: number }
export interface TaskRow extends TableRow { item: string; state: State }
export const validId = /^[A-Z](?:0[1-9]|[1-9][0-9])$/;
const linesOf = (text: string) => text.split(/\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]/);
export function unfencedLines(text: string): [number, string][] {
  let char = '', length = 0;
  const result: [number, string][] = [];
  linesOf(text).forEach((line, i) => {
    const stripped = line.replace(/^ */, '');
    const indent = line.length - stripped.length;
    const fence = indent <= 3 ? stripped.match(/^(`{3,}|~{3,})/) : null;
    if (fence) {
      const token = fence[1];
      if (!char) { char = token[0]; length = token.length; }
      else if (token[0] === char && token.length >= length && !stripped.slice(token.length).trim()) char = '';
    } else if (!char && indent <= 3) result.push([i + 1, stripped]);
  });
  return result;
}
export function tableCells(line: string): string[] {
  const cells: string[] = []; let current = '';
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && line[i + 1] === '|') { current += '|'; i++; }
    else if (line[i] === '|') { cells.push(current.trim()); current = ''; }
    else current += line[i];
  }
  cells.push(current.trim());
  if (!cells[0]) cells.shift();
  if (!cells.at(-1)) cells.pop();
  return cells;
}
export function tableRows(text: string): TableRow[] {
  return unfencedLines(text).filter(([, s]) => s.startsWith('|'))
    .map(([line, s]) => ({ line, cells: tableCells(s) })).filter(r => r.cells.length >= 2);
}
export function statusRows(text: string): TaskRow[] {
  return tableRows(text).flatMap(r => {
    const state = Object.hasOwn(markers, r.cells[1]) ? markers[r.cells[1] as keyof typeof markers] : undefined;
    return state ? [{ ...r, item: r.cells[0], state }] : [];
  });
}
export function statusMarkerProblems(text: string): string[] {
  let inTable = false, previous = 0; const problems: string[] = [];
  for (const { line, cells } of tableRows(text)) {
    if (line !== previous + 1) inTable = false;
    previous = line; const state = cells[1];
    if (state.toLowerCase() === 'state') { inTable = true; continue; }
    if (cells.every(c => /^:?-+:?$/.test(c))) continue;
    if ((inTable || /\[[^\]]*\]/.test(state)) && !Object.hasOwn(markers, state))
      problems.push(`line ${line}: unknown or non-backticked state marker`);
  }
  return problems;
}
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function splitKeepEnds(text: string): string[] {
  return text.match(/[^\r\n\v\f\x1c-\x1e\x85\u2028\u2029]*(?:\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]|$)/g)?.filter(Boolean) || [];
}
function fencedDocument(text: string): string {
  const lines = splitKeepEnds(text.trim());
  const token = lines[0]?.trim().match(/^(`{3,}|~{3,})markdown$/)?.[1];
  requireThat(token && lines.length >= 3, 'expected one fenced markdown document');
  const closing = new RegExp('^' + token[0] + '{' + token.length + ',}\\s*$');
  requireThat(closing.test(lines.at(-1)!) && !lines.slice(1, -1).some(l => closing.test(l)), 'document fence closes early or is missing');
  return lines.slice(1, -1).join('');
}
export interface RetiredRecord { metadata: Record<string, string>; specification: string; status: string }
export function retiredRecord(text: string, name: string): RetiredRecord {
  const id = name.match(/^status-([A-Z](?:0[1-9]|[1-9][0-9]))\.md$/)?.[1];
  requireThat(id, 'invalid retired status ID; use 01 through 99');
  const lines = splitKeepEnds(text);
  const headings = unfencedLines(text).filter(([, s]) => s.startsWith('## '));
  requireThat(headings.length === 2 && headings[0][1] === '## Milestone specification' && headings[1][1] === '## Status record', 'expected Milestone specification and Status record sections');
  const metadata: Record<string, string> = Object.create(null);
  for (const [, line] of unfencedLines(lines.slice(0, headings[0][0] - 1).join(''))) {
    const match = line.match(/^\*\*([\w ]+)\.\*\* (.+)$/);
    if (!match) continue;
    requireThat(!Object.hasOwn(metadata, match[1]), `duplicate retirement field: ${match[1]}`);
    metadata[match[1]] = match[2].trim();
  }
  const required = ['Milestone', 'Outcome', 'Retired', 'Source status', 'Source specification', 'Evidence', 'Worktree', 'Review', 'Review iterations', 'Verification', 'Consolidated into'];
  requireThat(required.every(k => metadata[k]), 'missing retirement metadata');
  requireThat(metadata.Milestone === id, 'retired milestone ID does not match its filename');
  requireThat([`memory-bank/${name}`, `tabilet/memory-bank/${name}`].includes(metadata['Source status']), 'source status path does not match the retired ID');
  requireThat(/^(?:tabilet\/)?memory-bank\/milestone\.md#\S+$/.test(metadata['Source specification']), 'missing original milestone specification anchor');
  requireThat(['completed', 'cancelled', 'superseded'].includes(metadata.Outcome), 'invalid retirement outcome');
  requireThat(/^\d{4}-\d{2}-\d{2}$/.test(metadata.Retired) && !metadata.Retired.startsWith('0000') && Number.isFinite(Date.parse(metadata.Retired)) && new Date(metadata.Retired).toISOString().slice(0, 10) === metadata.Retired, 'retirement date must use YYYY-MM-DD');
  requireThat(/^(?:[0-9a-f]{40}|[0-9a-f]{64}|unversioned)$/.test(metadata.Evidence), 'evidence must be a full commit or unversioned');
  requireThat(['clean', 'includes uncommitted changes', 'unversioned'].includes(metadata.Worktree), 'invalid worktree provenance');
  requireThat((metadata.Evidence === 'unversioned') === (metadata.Worktree === 'unversioned'), 'inconsistent unversioned provenance');
  requireThat(metadata.Review === 'passed' && /^(?:[1-9]|10)$/.test(metadata['Review iterations']), 'retirement requires a passed review within 10 iterations');
  requireThat(metadata.Outcome === 'completed' || metadata.Disposition, 'cancellation or supersession needs its authorized disposition');
  requireThat(metadata.Outcome !== 'superseded' || metadata.Successor, 'supersession needs its accepted successor');
  const specification = fencedDocument(lines.slice(headings[0][0], headings[1][0] - 1).join(''));
  const status = fencedDocument(lines.slice(headings[1][0]).join(''));
  requireThat(specification.trim() && status.trim(), 'retired source documents are empty');
  const specHeadings = unfencedLines(specification).filter(([, s]) => s.startsWith('## '));
  requireThat(specHeadings.length === 1 && new RegExp('^## ' + id + '(?:\\s|$)').test(specHeadings[0][1]), 'retired specification does not match its milestone ID');
  const problems = statusMarkerProblems(status), rows = statusRows(status);
  requireThat(!problems.length, 'retired task has an ' + problems.join('; '));
  requireThat(rows.length && rows.every(r => !['pending', 'in_progress', 'blocked'].includes(r.state)), 'retired status must contain only closed task rows');
  requireThat(rows.every(r => r.state !== 'historical' || /\bsuccessor\b\s*:?\s+\S/i.test(r.cells.slice(2).join(' '))), 'closed-historical row has no named successor');
  return { metadata, specification, status };
}

/** Local Markdown links only; never fetch external resources or interpret HTML. */
export function localLinks(text: string, source: string): { label: string; path: string }[] {
  const links: { label: string; path: string }[] = [];
  for (const [, line] of unfencedLines(text)) for (const m of line.matchAll(/(?<!!)\[([^\]]+)\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const raw = m[2].replace(/^<|>$/g, '').split('#')[0];
    if (!raw || /^[a-z][a-z\d+.-]*:|^\/\//i.test(raw)) continue;
    let decoded: string; try { decoded = decodeURIComponent(raw); } catch { continue; }
    if (/[\x00-\x1f\\]/.test(decoded)) continue;
    const parts = (decoded.startsWith('/') ? decoded : source.slice(0, source.lastIndexOf('/') + 1) + decoded).split('/');
    const stack: string[] = [];
    for (const p of parts) { if (p === '..' && stack.length && stack.at(-1) !== '..') stack.pop(); else if (p !== '.' && p !== '') stack.push(p); }
    links.push({ label: m[1], path: (decoded.startsWith('/') ? '/' : '') + stack.join('/') });
  }
  return links;
}

export function reviewEvidence(text: string) {
  const evidence = unfencedLines(text).filter(([, s]) => /review|verif|acceptance|consolidat/i.test(s));
  // Only explicit current fields qualify; dated log entries remain evidence.
  const counters = unfencedLines(text).flatMap(([line, s]) => {
    const m = s.match(/^(?:\*\*)?(?:Current review iteration|Review iterations|Review iteration|Review counter)(?:\.\*\*|\*\*:|:|\.)\s*(\d+)(?:\s*\/\s*10)?\s*$/i);
    return m ? [{ line, value: Number(m[1]) }] : [];
  });
  const values = [...new Set(counters.map(c => c.value))];
  return { evidence, counter: values.length === 1 && values[0] >= 1 && values[0] <= 10 ? `${values[0]}/10` : values.length ? 'Conflicting or invalid' : 'Unknown' };
}
