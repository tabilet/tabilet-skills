/** One read-only metadata endpoint; shared strict Host/Client wire contract. */
import { z } from 'zod';
import type { TypertRemoteContribution, RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { SQLiteQuery, SQLiteView } from './sqlite.ts';
export const sourceSchema = z.object({ name: z.string(), source: z.string(), provider: z.string(), location: z.string().optional() });
export const catalogSchema = z.object({ complete: z.boolean(), skills: z.array(sourceSchema) });
export type SourceCatalog = z.infer<typeof catalogSchema>;
export const sqliteQuerySchema = z.object({ section: z.enum(['overview', 'runs', 'events', 'index']), offset: z.number().int().min(0).max(10000), runId: z.string().max(128).optional(), search: z.string().max(200).optional() });
export const sqliteViewSchema = z.object({
  state: z.enum(['ready', 'missing', 'unregistered', 'unsupported', 'error']), message: z.string(), projectRoot: z.string(), databasePath: z.string(),
  counts: z.object({ runs: z.number(), events: z.number(), documents: z.number() }),
  index: z.object({ refreshedAt: z.string().nullable(), complete: z.boolean().nullable(), diagnostics: z.array(z.string()) }).nullable(),
  entries: z.array(z.object({ id: z.string(), title: z.string(), meta: z.string(), detail: z.string().optional(), path: z.string().optional(), line: z.number().optional() })), more: z.boolean(),
});
export const remote: TypertRemoteContribution = {
  package: 'tabilet-skills', descriptors: [{
    id: 'tabilet-skills#tabiletMemory/sources', service: 'tabiletMemory', namespace: 'tabiletMemory', method: 'sources', invocation: { kind: 'direct' },
    parameters: [{ name: 'sessionId', wire: 'sessionId', source: 'json', codec: { mode: 'strict', typeSymbol: 'tabilet-skills#SessionId', schema: z.string().min(1) } }],
    cancellation: { parameter: 'signal' }, result: { mode: 'strict', typeSymbol: 'tabilet-skills#SourceCatalog', schema: catalogSchema },
  }, {
    id: 'tabilet-skills#tabiletMemory/sqlite', service: 'tabiletMemory', namespace: 'tabiletMemory', method: 'sqlite', invocation: { kind: 'direct' },
    parameters: [
      { name: 'sessionId', wire: 'sessionId', source: 'json', codec: { mode: 'strict', typeSymbol: 'tabilet-skills#SessionId', schema: z.string().min(1) } },
      { name: 'query', wire: 'query', source: 'json', codec: { mode: 'strict', typeSymbol: 'tabilet-skills#SQLiteQuery', schema: sqliteQuerySchema } },
    ],
    cancellation: { parameter: 'signal' }, result: { mode: 'strict', typeSymbol: 'tabilet-skills#SQLiteView', schema: sqliteViewSchema },
  }],
};
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    tabiletMemory: { sources(sessionId: SessionId, signal?: AbortSignal): Promise<RemoteResult<SourceCatalog>>; sqlite(sessionId: SessionId, query: SQLiteQuery, signal?: AbortSignal): Promise<RemoteResult<SQLiteView>> };
  }
}
