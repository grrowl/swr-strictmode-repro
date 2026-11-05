import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT ?? 4173);
createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = path.split('/').at(-1) || 'index.html';
  if (!['index.html', 'unpatched.js', 'fixed.js', 'unpatched.js.map', 'fixed.js.map'].includes(file)) { response.writeHead(404).end(); return; }
  try {
    response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/javascript');
    response.end(await readFile(`dist/${file}`));
  } catch { response.writeHead(404).end('Run npm run build first.'); }
}).listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`Demo: http://127.0.0.1:${port}`));
