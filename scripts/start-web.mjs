import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const {env,launcher}=JSON.parse(readFileSync('.acceptance/profile.json'));
const child=spawn(process.execPath,[launcher || 'node_modules/@deepseek-ai/dsh/lib/bin.js','web','--no-open','--port','3197'],{env,stdio:['ignore','pipe','pipe']});
writeFileSync('.acceptance/web.pid',String(child.pid));
child.stdout.on('data',chunk=>{const text=chunk.toString();const url=text.match(/http:\/\/127\.0\.0\.1:3197\/\?token=\S+/)?.[0];if(url){writeFileSync('.acceptance/web-url.txt',url);console.log('Disposable DSH Web ready on port 3197');}else process.stdout.write(chunk)});
child.stderr.pipe(process.stderr); child.on('exit',code=>process.exit(code??1));
process.on('SIGTERM',()=>child.kill('SIGTERM'));
