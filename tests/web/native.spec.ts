import { test, expect, type Page } from '@playwright/test';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

let projects: Record<string, string>, sessions: Record<string, string> = {}, original: Record<string, string>;
let providerLog: string;
async function rpc(page: Page, method: string, args: object) {
  const response = await page.request.post(`http://127.0.0.1:3197/api/${method}`, { data: { type: 'client-request', rpcId: crypto.randomUUID(), method, payload: { args } } });
  const body = await response.json(); expect(body.result.ok, JSON.stringify(body)).toBe(true); return body.result.value;
}
async function hashTree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function walk(dir: string) {
    for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) result[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
    }
  }
  await walk(''); return result;
}
async function calls() { try { return (await readFile(providerLog, 'utf8')).trim().split('\n').filter(Boolean).map(s => JSON.parse(s)); } catch { return []; } }
const noticeHandled = new WeakSet<Page>();
async function open(page: Page, project = 'active') {
  if (!noticeHandled.has(page)) {
    await page.addLocatorHandler(page.getByRole('dialog', { name: 'Internal Testing Notice', exact: true }), async notice => {
      await notice.getByRole('button', { name: 'Continue', exact: true }).click();
    });
    noticeHandled.add(page);
  }
  await page.goto(await readFile('.acceptance/web-url.txt', 'utf8'));
  await page.getByRole('button', { name: 'New session', exact: true }).first().waitFor();
  const openSidebar = page.getByRole('button', { name: 'Open sidebar', exact: true });
  if (await openSidebar.isVisible()) await openSidebar.click();
  const workspace = page.getByRole('treeitem', { name: project, exact: true });
  await workspace.waitFor();
  const session = page.getByLabel('Sessions', { exact: true }).getByText(`Acceptance ${project}`, { exact: true });
  // The workspace can auto-expand while the initial session list loads. Check
  // its state and click in one browser turn so a late expansion is not closed.
  await workspace.evaluate(element => {
    if (element.getAttribute('aria-expanded') !== 'true') (element as HTMLElement).click();
  });
  await expect(workspace).toHaveAttribute('aria-expanded', 'true');
  await session.waitFor({ state: 'visible', timeout: 30000 });
  await session.click();
  await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click();
  await page.locator('[data-sidebar-right-guide-entry=memory-bank]').click();
  const panel = page.getByRole('region', { name: 'Memory Bank', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('status').first()).not.toContainText('Refreshing', { timeout: 20000 });
  return panel;
}
test.beforeAll(async ({ browser }) => {
  test.setTimeout(60000);
  projects = JSON.parse(await readFile('.acceptance/projects.json', 'utf8'));
  providerLog = (await readFile('.acceptance/provider-log.txt', 'utf8')).trim();
  const state = JSON.parse(await readFile('.acceptance/profile.json', 'utf8'));
  const seedPath = join(state.root, 'test-seeds.json');
  try { const seeded = JSON.parse(await readFile(seedPath, 'utf8')); sessions = seeded.sessions; original = seeded.original; return; } catch {}
  const page = await browser.newPage(); await page.goto(await readFile('.acceptance/web-url.txt', 'utf8'));
  // Only fixture setup sends these fixed seeds. The plugin never submits them.
  for (const [name, path] of Object.entries(projects)) {
    const { workspace } = await rpc(page, 'workspace/create', { request: { path } });
    const { sessionId } = await rpc(page, 'session/create', { request: { workspaceId: workspace.workspaceId } });
    sessions[name] = sessionId;
    await rpc(page, 'session/prompt', { request: { sessionId, requestId: crypto.randomUUID(), mode: 'queue', content: [{ type: 'text', text: `Fixture seed ${name}.` }] } });
    await rpc(page, 'session/rename', { request: { sessionId, title: `Acceptance ${name}` } });
  }
  await expect.poll(async () => (await calls()).length).toBeGreaterThanOrEqual(6);
  await page.waitForTimeout(1500);
  original = await hashTree(projects.active);
  await writeFile(seedPath, JSON.stringify({ sessions, original }));
  await page.close();
});
test('native packed plugin renders a large project with safe memory, full tasks, and winning sources without model requests or writes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const count = (await calls()).length; const panel = await open(page);
  await expect(panel.getByText('Active milestones', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('overview.png') });
  await expect(panel.locator('.mb-counts')).toContainText('119');
  await panel.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(panel.getByText('600 matching rows', { exact: true })).toBeVisible();
  await panel.getByLabel('Search', { exact: true }).fill('Build A01');
  await expect(panel.getByText('1 matching rows')).toBeVisible(); await expect(panel).toContainText('Preserve A | B');
  await panel.getByRole('button', { name: 'Acceptance', exact: true }).click();
  await expect(panel.getByText('2/10', { exact: true })).toHaveCount(120);
  await panel.getByRole('button', { name: 'Memory', exact: true }).click();
  const remote: string[] = []; page.on('request', r => { if (r.url().includes('example.invalid')) remote.push(r.url()); });
  await panel.getByRole('button', { name: 'product', exact: true }).click();
  await expect(panel.locator('.mb-document pre')).toContainText('<script>');
  expect(await page.evaluate(() => (globalThis as Record<string, unknown>).TABILET_UNSAFE)).toBeUndefined(); expect(remote).toEqual([]);
  await panel.getByRole('button', { name: 'Compatibility', exact: true }).click();
  await expect(panel.getByText('bundled · tabilet-skills', { exact: true })).toHaveCount(7);
  await expect(panel).not.toContainText('Skill catalog unavailable');
  await panel.getByRole('button', { name: 'SQLite', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Optional SQLite audit and lookup', exact: true })).toBeVisible();
  await expect(panel).toContainText('does not open or modify the database');
  await expect(panel.locator('pre').filter({ hasText: 'tabilet-audit audit runs --project /absolute/path/to/project' })).toBeVisible();
  await expect(panel.locator('pre').filter({ hasText: 'tabilet-audit explorer /absolute/path/to/project --port 8000' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Read the SQLite audit and lookup guide ↗' })).toHaveAttribute('href', 'https://github.com/tabilet/skills/blob/v2.1.0/docs/sqlite.md');
  expect((await calls()).length).toBe(count); expect(await hashTree(projects.active)).toEqual(original); expect(errors).toEqual([]);
});
test('external edits and linked canonical edits become visible within ten seconds', async ({ page }) => {
  const panel = await open(page); await panel.getByRole('button', { name: 'Tasks', exact: true }).click(); await panel.getByLabel('Search', { exact: true }).fill('external update');
  const path = join(projects.active, 'tabilet/memory-bank/status-A01.md'), before = await readFile(path, 'utf8');
  try {
    await writeFile(path, before.replace('Build A01', 'Build external update')); const start = Date.now();
    await expect(panel).toContainText('1 matching rows', { timeout: 10000 }); expect(Date.now() - start).toBeLessThan(10000);
  } finally { await writeFile(path, before); }
  await page.reload(); const linked = await open(page, 'linked');
  await linked.getByRole('button', { name: 'Tasks', exact: true }).click(); await expect(linked).toContainText('Linked canonical task');
  const canonical = join(projects.linked, '../canonical/status-M01.md'), old = await readFile(canonical, 'utf8');
  try { await writeFile(canonical, old.replace('Linked canonical task', 'Canonical external update')); await expect(linked).toContainText('Canonical external update', { timeout: 10000 }); }
  finally { await writeFile(canonical, old); }
});
test('legacy and all-retired projects are readable, and history bodies load only when opened', async ({ page }) => {
  let panel = await open(page, 'legacy');
  await expect(panel).toContainText('v1.5.0 project: read-only view');
  await expect(panel.getByText('Prepare a workflow request')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Compatibility', exact: true }).click(); await expect(panel).toContainText('Unsupported legacy status structure');
  const reads: string[] = [];
  page.on('request', r => { if (r.url().endsWith('/workspaceFiles/read')) reads.push(r.postData() || ''); });
  panel = await open(page, 'retired'); expect(reads.some(r => r.includes('history/status-M01.md'))).toBe(false);
  await panel.getByRole('button', { name: 'History', exact: true }).click();
  await panel.getByRole('button', { name: 'M01 — cancelled', exact: true }).click();
  await expect(panel.locator('.mb-document pre')).toContainText('## Milestone specification');
  await expect(panel.locator('.mb-document pre')).toContainText('**Outcome.** cancelled');
  await expect(panel).not.toContainText('Invalid retired record');
  expect(reads.some(r => r.includes('history/status-M01.md'))).toBe(true);
});
test('a new project can prepare Init while legacy workflow controls stay hidden', async ({ page }) => {
  const panel = await open(page, 'new');
  await panel.getByText('Prepare a workflow request', { exact: true }).click();
  await panel.getByRole('button', { name: 'Init', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Prepare init request' })).toBeVisible();
});
test('all seven previews are reviewable, keyboard accessible, and cause no submission', async ({ page }) => {
  const panel = await open(page), count = (await calls()).length;
  await panel.getByText('Prepare a workflow request', { exact: true }).click();
  for (const label of ['Resume', 'Goal', 'Propose', 'Reconcile', 'Upgrade', 'Init', 'Archive']) {
    await panel.locator('.mb-actions').getByRole('button', { name: label, exact: true }).click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    if (label === 'Goal') { await dialog.getByLabel('Milestone order').fill('A01 -> B01'); await dialog.getByLabel('Completion conditions').fill('Both milestones accepted'); await expect(dialog.getByLabel('Commit policy')).toHaveValue('task'); }
    if (label === 'Propose') {
      await expect(dialog).toContainText('Enter the requested change.');
      await expect(dialog.getByRole('button', { name: 'Insert into empty draft' })).toBeDisabled();
      await dialog.getByLabel('Requested change').fill('Add offline export\nKeep existing records.');
      await expect(dialog.getByLabel('Request preview', { exact: true })).toContainText('Add offline export\nKeep existing records.');
    }
    if (label === 'Reconcile') await dialog.getByLabel('Local review path or URL').fill('https://example.invalid/private-review');
    await expect(dialog.getByLabel('Request preview', { exact: true })).toHaveValue(/^\/memory-bank-/);
    await page.keyboard.press('Tab'); expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  }
  expect((await calls()).length).toBe(count); expect(await hashTree(projects.active)).toEqual(original);
});
test('the user sends a Propose request only after inserting it', async ({ page }) => {
  const panel = await open(page), count = (await calls()).length;
  await panel.getByText('Prepare a workflow request', { exact: true }).click();
  await panel.getByRole('button', { name: 'Propose', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Requested change').fill('Add offline export\nKeep existing records.');
  await dialog.getByRole('button', { name: 'Insert into empty draft' }).click();
  await expect(dialog).toContainText('Inserted into the draft');
  expect((await calls()).length).toBe(count);
  await dialog.getByRole('button', { name: 'Close request preview' }).click();
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect.poll(async () => (await calls()).length).toBeGreaterThan(count);
  const received = JSON.stringify((await calls()).slice(count));
  expect(received).toContain('/memory-bank-propose');
  expect(received).toContain('Keep existing records.');
  expect(received).toContain('<skill_instructions>');
  expect(await hashTree(projects.active)).toEqual(original);
});
test('insertion preserves existing drafts, attachments, and a changed draft revision', async ({ page }) => {
  const panel = await open(page); const editor = page.locator('[contenteditable=true][role=textbox]');
  await editor.fill('Keep my draft'); await panel.getByText('Prepare a workflow request', { exact: true }).click(); await panel.getByRole('button', { name: 'Resume', exact: true }).click();
  let dialog = page.getByRole('dialog'); await dialog.getByRole('button', { name: 'Insert into empty draft' }).click(); await expect(dialog).toContainText('preserved'); await expect(editor).toHaveText('Keep my draft');
  await dialog.getByRole('button', { name: 'Close request preview' }).click(); await editor.fill('');
  await panel.getByRole('button', { name: 'Resume', exact: true }).click(); dialog = page.getByRole('dialog');
  await editor.fill('Draft changed while preview was open', { force: true });
  await dialog.getByRole('button', { name: 'Insert into empty draft' }).click();
  await expect(dialog).toContainText('Session or draft changed'); await expect(editor).toHaveText('Draft changed while preview was open');
  await dialog.getByRole('button', { name: 'Close request preview' }).click(); await editor.fill('');
  // Use an independent session for the attachment fixture. DSH persists drafts
  // across reloads and clearing contenteditable can race edit normalization.
  const attachmentPanel = await open(page, 'draft');
  const attachmentEditor = page.locator('[contenteditable=true][role=textbox]');
  await expect(attachmentEditor).toHaveText('');
  await page.locator('input[type=file]').setInputFiles({ name: 'keep.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6CYkAAAAASUVORK5CYII=', 'base64') });
  await attachmentPanel.getByText('Prepare a workflow request', { exact: true }).click();
  await attachmentPanel.getByRole('button', { name: 'Resume', exact: true }).click(); dialog = page.getByRole('dialog'); await dialog.getByRole('button', { name: 'Insert into empty draft' }).click(); await expect(dialog).toContainText('preserved');
  expect((await attachmentEditor.innerText()).trim()).toBe('');
});
test('narrow layouts remain within the viewport and source links open in the same session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); const panel = await open(page);
  const bounds = await panel.boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  await panel.getByRole('button', { name: 'Tasks', exact: true }).click(); await panel.getByLabel('Search', { exact: true }).fill('Build A01');
  await panel.getByRole('button', { name: /memory-bank\/status-A01.md:/ }).click(); await expect(page.locator('body')).toContainText('status-A01.md');
  expect(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true);
});
test('session switching discards the old preview and displays only the selected project', async ({ page }) => {
  const panel = await open(page); await panel.getByText('Prepare a workflow request', { exact: true }).click(); await panel.getByRole('button', { name: 'Goal', exact: true }).click();
  // Native session selection is outside the modal; dismiss through Escape first.
  await page.keyboard.press('Escape');
  await page.getByRole('treeitem', { name: 'retired', exact: true }).click();
  await page.getByLabel('Sessions', { exact: true }).getByText('Acceptance retired', { exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Prepare goal request' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open right sidebar' }).click(); await page.locator('[data-sidebar-right-guide-entry=memory-bank]').click();
  await expect(page.getByRole('region', { name: 'Memory Bank' })).toHaveAttribute('data-session', sessions.retired);
});
test('the user sends a prepared request normally and DSH loads its skill into the model-free provider', async ({ page }) => {
  const panel = await open(page), count = (await calls()).length;
  await panel.getByText('Prepare a workflow request', { exact: true }).click(); await panel.getByRole('button', { name: 'Resume', exact: true }).click();
  const dialog = page.getByRole('dialog'); const prepared = await dialog.getByLabel('Request preview', { exact: true }).inputValue();
  await dialog.getByRole('button', { name: 'Insert into empty draft' }).click(); await expect(dialog).toContainText('Inserted into the draft');
  expect((await calls()).length).toBe(count);
  await dialog.getByRole('button', { name: 'Close request preview' }).click(); await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect.poll(async () => (await calls()).length).toBeGreaterThan(count);
  const received = JSON.stringify((await calls()).slice(count)); expect(received).toContain('/memory-bank-next'); expect(received).toContain('Resume the sole in-progress row'); expect(received).toContain('<skill_instructions>'); expect(received).toContain('Base directory for this skill:');
  expect(await hashTree(projects.active)).toEqual(original);
});
test('the packed headless profile loads a complete skill without the Web UI', async () => {
  const state = JSON.parse(await readFile('.acceptance/profile.json', 'utf8'));
  const before = await hashTree(projects.legacy), count = (await calls()).length;
  const output = execFileSync(process.execPath, [state.launcher || resolve('node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'headless', '/memory-bank-upgrade Compare the bundled contract and propose changes before writes.'], { env: state.env, cwd: projects.legacy, encoding: 'utf8', timeout: 30000 });
  expect(output).toContain('Model-free fixture received');
  const received = JSON.stringify((await calls()).slice(count)); expect(received).toContain('memory-bank-upgrade'); expect(received).toContain('<skill_instructions>');
  expect(await hashTree(projects.legacy)).toEqual(before);
});
