import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, symlinkSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// The helper creates fresh DSH_HOME/DSH_AGENTS_HOME and installs the actual pack.
execFileSync('npm', ['pack', '--ignore-scripts'], { stdio: 'ignore' });
execFileSync(process.execPath, ['scripts/acceptance-profile.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['--import', 'tsx', 'scripts/create-fixtures.ts'], { stdio: 'inherit' });
const state = JSON.parse(readFileSync('.acceptance/profile.json'));
state.env.DEEPSEEK_API_KEY = 'model-free-fixture';
state.env.DEEPSEEK_BASE_URL = 'http://127.0.0.1:3198';
if (process.env.TABILET_MIXED === '1') {
  const mixed = join(state.root, 'mixed/node_modules'); mkdirSync(mixed, { recursive: true });
  // Alias is locked in package-lock.json: only launcher rc.1, all shared components rc.2.
  cpSync(resolve('node_modules/dsh-launcher-rc1'), join(mixed, '@deepseek-ai/dsh'), { recursive: true });
  for (const entry of readdirSync('node_modules', { withFileTypes: true })) {
    if (entry.name.startsWith('@')) {
      mkdirSync(join(mixed, entry.name), { recursive: true });
      for (const name of readdirSync(join('node_modules', entry.name))) {
        if (entry.name === '@deepseek-ai' && name === 'dsh') continue;
        symlinkSync(resolve('node_modules', entry.name, name), join(mixed, entry.name, name));
      }
    } else if (entry.name !== 'dsh-launcher-rc1') symlinkSync(resolve('node_modules', entry.name), join(mixed, entry.name));
  }
  state.launcher = join(mixed, '@deepseek-ai/dsh/lib/bin.js');
}
writeFileSync('.acceptance/profile.json', JSON.stringify(state, null, 2));
const children = [];
const stop = () => { for (const child of children) child.kill('SIGTERM'); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
try {
  const provider = spawn(process.execPath, ['scripts/fixture-provider.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] }); children.push(provider);
  await ready(provider, 'provider ready');
  const host = spawn(process.execPath, ['scripts/start-web.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] }); children.push(host);
  await ready(host, 'DSH Web ready');
  const run = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
  const code = await new Promise(resolve => run.once('exit', resolve));
  const mode = process.env.TABILET_MIXED === '1' ? 'mixed' : 'rc2';
  cpSync('.acceptance/web-results.json', `.acceptance/web-results-${mode}.json`);
  process.exitCode = typeof code === 'number' ? code : 1;
} finally { stop(); }
function ready(child, marker) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${marker}`)), 60000);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`${marker} exited ${code}`)); });
    child.stdout.on('data', chunk => { process.stdout.write(chunk); if (chunk.toString().includes(marker)) { clearTimeout(timer); resolve(); } });
  });
}
