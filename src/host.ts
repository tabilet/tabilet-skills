import type { Context } from '@deepseek-ai/cordis';
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem';
import { fileURLToPath } from 'node:url';
import { SourceCatalogService } from './catalog.ts';

export const name = 'tabilet-skills';
export const inject = ['skills'];
export function apply(ctx: Context): void {
  ctx.plugin(filesystem, {
    providerName: 'tabilet-skills', includeDefaultRoots: false,
    bundledSkillDir: fileURLToPath(new URL('../payload/skills', import.meta.url)),
    watch: false,
  });
  ctx.inject(['typert', 'sessionQuery', 'agents'], scope => { scope.plugin(SourceCatalogService); });
}
