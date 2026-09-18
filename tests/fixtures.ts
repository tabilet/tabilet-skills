import type { FilePort } from '../src/reader.ts';
export function activeFixture(count = 2): Map<string, string> {
  const files = new Map<string, string>([['AGENTS.md', '# Project instructions\n'], ['tabilet/memory-bank/architecture.md', '# Architecture\n'], ['tabilet/memory-bank/product.md', '# Product\nShared project memory.\n'], ['tabilet/memory-bank/tech-stack.md', '# Stack\n'], ['tabilet/memory-bank/lessons.md', '# Lessons\n']]);
  const index = ['# Milestones', '| ID | Status |', '| --- | --- |'];
  for (let n = 0; n < count; n++) {
    const id = String.fromCharCode(65 + n % 17) + String(1 + Math.floor(n / 17)).padStart(2, '0');
    index.push(`| ${id} | [Tasks](status-${id}.md) |`);
    files.set(`tabilet/memory-bank/status-${id}.md`, `# ${id}\n\n**Review iterations.** 2\n**Verification.** Unit tests passed.\n\n| Item | State | Task | Notes |\n| --- | --- | --- | --- |\n| 1 | \`[${n === 0 ? '~' : ' '}]\` | Build ${id} | Preserve A \\| B |\n| 2 | \`[!]\` | Review ${id} | Waiting for evidence |\n| 3 | \`[+]\` | Discover ${id} | Recorded |\n| 4 | \`[X]\` | Cancel ${id} | Owner cancelled |\n| 5 | \`[-]\` | Superseded ${id} | successor: C01 |\n`);
  }
  index.push(...[...files.keys()].filter(p => /status-/.test(p)).map(p => `\n## ${p.slice(-6, -3)} — Delivery\n\nAcceptance: verify the feature.\n`));
  files.set('tabilet/memory-bank/milestone.md', index.join('\n'));
  return files;
}
export function memoryPort(files: Map<string, string>) {
  const reads: string[] = [], stats: string[] = [], listings: string[] = [];
  const value = (path: string) => {
    const text = files.get(path); if (text === undefined) throw new Error('workspace-file/not-found');
    return { text, version: text, bytes: new TextEncoder().encode(text).length, absolutePath: `/project/${path}` };
  };
  const port: FilePort = {
    async stat(path, signal) { signal.throwIfAborted(); stats.push(path); return value(path); },
    async read(path, signal) { signal.throwIfAborted(); reads.push(path); return value(path); },
    async list(path, signal) {
      signal.throwIfAborted(); listings.push(path);
      const children = [...files.keys()].filter(p => p.startsWith(`${path}/`)).map(p => p.slice(path.length + 1));
      if (!children.length) throw new Error('workspace-file/not-found');
      return { entries: [...new Set(children.map(p => p.split('/')[0]))].map(name => ({ name, type: children.includes(name) ? 'file' : 'directory' })), truncated: false };
    },
  };
  return { port, reads, stats, listings };
}
