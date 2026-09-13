import type { Context } from '@deepseek-ai/cordis';
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type {} from '@deepseek-ai/dsh-session-query';
import type {} from '@deepseek-ai/dsh-agent';
import type {} from '@deepseek-ai/dsh-agent-presets';
import type {} from '@deepseek-ai/dsh-typert-registry';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import { remote, type SourceCatalog } from './remote.ts';

export class SourceCatalogService extends TypertRemoteService {
  static inject = ['skills', 'sessionQuery', 'agents', 'typert'];
  constructor(ctx: Context) {
    super(ctx, 'tabiletMemory');
    ctx.effect(() => ctx.typert.register({ package: remote.package, invocations: remote.descriptors, face: 'host', schemas: [], model: { services: [], events: [], objects: [] } }));
  }
  @Remote
  async sources(sessionId: SessionId, signal: AbortSignal): Promise<SourceCatalog> {
    // Match DSH's human skill catalog selection without activating an Agent.
    using observation = await this.ctx.sessionQuery.observeSession(sessionId);
    const cwd = observation.header.cwd;
    if (!cwd || !observation.projections) throw new RemoteError('gateway/internal', 'Session skill context is unavailable', {});
    const live = this.ctx.agents.get(sessionId), presets = this.ctx.get('agentPresets');
    const registry = (live && presets?.serviceFor(live, 'skills')) || this.ctx.skills;
    const scope = live ?? await presets?.standingKeyFor(observation.projections.values.agentPreset ?? undefined);
    const result = await registry.snapshot({ cwd, scope, signal });
    return { complete: result.complete, skills: result.skills.filter(s => s.name.startsWith('memory-bank-')).map(s => ({ name: s.name, source: s.source, provider: s.provider, ...(s.resourceBase?.kind === 'directory' ? { location: s.resourceBase.path } : {}) })) };
  }
}
