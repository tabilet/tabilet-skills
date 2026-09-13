import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
test('locked components are rc.2, with one explicit rc.1 launcher reproduction', async () => {
  assert.equal(process.versions.node, '24.14.1');
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  let count = 0;
  for (const [path, info] of Object.entries(lock.packages) as [string, { version: string }][]) {
    if (!path.split('node_modules/').at(-1)!.startsWith('@deepseek-ai/dsh')) continue;
    assert.equal(info.version, '0.1.5-rc.2', path);
    assert.equal(JSON.parse(await readFile(`${path}/package.json`, 'utf8')).version, info.version); count++;
  }
  assert.ok(count > 100); assert.equal(lock.packages['node_modules/dsh-launcher-rc1'].version, '0.1.5-rc.1');
});
