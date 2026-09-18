import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { initProfile, PROFILE_TEMPLATES } from '@deepseek-ai/dsh-app-boot';
const root = await mkdtemp(join(tmpdir(), 'tabilet-skills-acceptance-'));
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const env = { PATH: process.env.PATH, DSH_HOME: join(root, 'dsh'), DSH_AGENTS_HOME: join(root, 'agents'), DSH_TELEMETRY_DISABLED: '1', NO_COLOR: '1' };
await mkdir(env.DSH_AGENTS_HOME);
for (const profile of ['web', 'headless']) {
  const dir = join(env.DSH_HOME, 'profiles', profile), template = PROFILE_TEMPLATES[profile];
  initProfile(dir, template.bundles, template.patchReload);
  execFileSync(process.execPath, [resolve('node_modules/@deepseek-ai/dsh/lib/bin.js'), 'plugin', '--profile', profile, 'add', resolve(`tabilet-skills-${version}.tgz`), '--ignore-scripts'], { env, stdio: 'inherit' });
}
await mkdir('.acceptance', { recursive: true });
await writeFile('.acceptance/profile.json', JSON.stringify({ root, env }, null, 2));
console.log(`Disposable profiles: ${root}`);
