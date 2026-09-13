/** Credential-free HTTP test provider. Never forwards requests to a model. */
import { createServer } from 'node:http';
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { root } = JSON.parse(readFileSync('.acceptance/profile.json'));
const log = join(root, 'provider-requests.jsonl');
writeFileSync('.acceptance/provider-log.txt', log);
const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) { res.writeHead(404); res.end(); return; }
  let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4 * 1024 * 1024) { res.writeHead(413); res.end(); return; } }
  appendFileSync(log, JSON.stringify({ at: Date.now(), request: JSON.parse(body) }) + '\n');
  const text = 'Model-free fixture received the prepared request.';
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
  res.write('data: ' + JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'fixture', choices: [{ index: 0, delta: { role: 'assistant', content: text }, finish_reason: null }] }) + '\n\n');
  res.write('data: ' + JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'fixture', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }) + '\n\n');
  res.end('data: [DONE]\n\n');
});
server.listen(3198, '127.0.0.1', () => { writeFileSync('.acceptance/provider.pid', String(process.pid)); console.log('Model-free fixture provider ready on port 3198'); });
