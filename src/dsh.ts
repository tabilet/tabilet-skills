import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-api-remotes/client';
import type {} from '@deepseek-ai/dsh-api-workspace-files/remote';
import type {} from '@deepseek-ai/dsh-api-session-controller/remote';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { FilePort, FileInfo } from './reader.ts';
import type { Composer } from './requests.ts';

export function unwrap<T>(r: RemoteResult<T>): T {
  if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`);
  return r.value;
}
export function filePort(ctx: Context, sessionId: SessionId): FilePort {
  const api = ctx.remote.workspaceFiles, seen = new Map<string, string>();
  const remember = <T extends FileInfo>(v: T): T => { seen.set(v.absolutePath, v.version); return v; };
  return {
    stat: async (path, signal) => remember(unwrap(await api.stat(sessionId, path, signal))),
    list: async (path, signal) => unwrap(await api.list(sessionId, path, signal)),
    read: async (path, signal) => {
      let text = '', version: string | undefined, offset = 1;
      for (;;) {
        signal.throwIfAborted();
        const page = unwrap(await api.read(sessionId, path, { offset, limit: 5000 }, signal));
        if (version !== undefined && version !== page.version) throw new Error('File changed during paged read');
        version = page.version; text += page.text;
        if (new TextEncoder().encode(text).length > 2 * 1024 * 1024) throw new Error('File exceeds dashboard limit (2 MiB)');
        if (page.eof) return remember({ text, version, absolutePath: page.absolutePath, bytes: page.bytes });
        if (!page.lines) throw new Error('Truncated file response did not advance');
        text += '\n'; offset += page.lines;
      }
    },
    watch: async (signal, changed) => {
      for await (const frame of api.changes(sessionId, signal)) {
        signal.throwIfAborted();
        if (frame.kind !== 'change') continue;
        const change = frame.change;
        if ('absent' in change) { if (seen.delete(change.absolutePath)) changed(); }
        else if (seen.get(change.absolutePath) !== change.version) { seen.set(change.absolutePath, change.version); changed(); }
      }
    },
  };
}
export function composerPort(ctx: Context, sessionId: SessionId): Composer | undefined {
  const scoped = ctx.sessions.scope(sessionId);
  const conversation = ctx.get('conversation');
  if (!scoped || !conversation?.input) return;
  const input = conversation.input.for(scoped);
  return {
    snapshot: () => input.state.getSnapshot(),
    isCurrent: () => ctx.sessions.list.getSnapshot().current === sessionId,
    insert: (text, draftRev) => {
      if (/[\uE100-\uE11D\uFFFC]/u.test(text)) return false;
      const before = input.state.getSnapshot();
      if (ctx.sessions.list.getSnapshot().current !== sessionId || before.draftRev !== draftRev || before.phase !== 'plain' || before.draft !== '' || before.attachmentIds.length || before.occurrences.length || before.claim) return false;
      // The public programmatic draft setter commits synchronously. No await
      // separates the empty-draft/revision check from the write.
      input.setDraft(text);
      return input.state.getSnapshot().draft === text;
    },
  };
}
export interface SkillSource { name: string; source: string; provider?: string; location?: string }
export async function skillSources(ctx: Context, sessionId: SessionId, signal: AbortSignal): Promise<SkillSource[]> {
  const result = unwrap(await ctx.remote.tabiletMemory.sources(sessionId, signal));
  if (!result.complete) throw new Error('Skill discovery is incomplete; refresh before relying on sources');
  return result.skills;
}
