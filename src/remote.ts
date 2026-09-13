/** One read-only metadata endpoint; shared strict Host/Client wire contract. */
import { z } from 'zod';
import type { TypertRemoteContribution, RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
export const sourceSchema = z.object({ name: z.string(), source: z.string(), provider: z.string(), location: z.string().optional() });
export const catalogSchema = z.object({ complete: z.boolean(), skills: z.array(sourceSchema) });
export type SourceCatalog = z.infer<typeof catalogSchema>;
export const remote: TypertRemoteContribution = {
  package: 'tabilet-skills', descriptors: [{
    id: 'tabilet-skills#tabiletMemory/sources', service: 'tabiletMemory', namespace: 'tabiletMemory', method: 'sources', invocation: { kind: 'direct' },
    parameters: [{ name: 'sessionId', wire: 'sessionId', source: 'json', codec: { mode: 'strict', typeSymbol: 'tabilet-skills#SessionId', schema: z.string().min(1) } }],
    cancellation: { parameter: 'signal' }, result: { mode: 'strict', typeSymbol: 'tabilet-skills#SourceCatalog', schema: catalogSchema },
  }],
};
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    tabiletMemory: { sources(sessionId: SessionId, signal?: AbortSignal): Promise<RemoteResult<SourceCatalog>> };
  }
}
