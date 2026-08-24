import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'public');
const mediaTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
};

createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const candidate = normalize(join(root, relative));
    const insideRoot = candidate === root || candidate.startsWith(`${root}${sep}`);
    const file = insideRoot && existsSync(candidate) && statSync(candidate).isFile()
        ? candidate
        : join(root, 'index.html');

    response.setHeader('Content-Type', mediaTypes[extname(file)] ?? 'application/octet-stream');
    createReadStream(file)
        .on('error', () => {
            response.writeHead(404);
            response.end('Not found');
        })
        .pipe(response);
}).listen(Number(process.env.PORT ?? 8080), '0.0.0.0');
