import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = ['index.html', 'app.js', 'style.css', 'games/bouncykoen/index.html', 'games/conciergedienst/index.html', 'games/uavpilot/index.html', 'games/de-achterkamers/index.html'];
let checked = 0;
for (const name of files) {
  const path = resolve(root, name);
  const source = await readFile(path, 'utf8');
  if (name.endsWith('.html')) {
    for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      const url = match[1];
      if (/^(?:https?:|data:|#|\/\/|mailto:)/i.test(url)) continue;
      if (url.startsWith('/')) throw new Error(`Root-relative path breaks Pages project URLs: ${name}: ${url}`);
      await stat(resolve(dirname(path), decodeURIComponent(url.split(/[?#]/)[0])));
      checked++;
    }
  }
}
const app = await readFile(resolve(root, 'app.js'), 'utf8');
for (const match of app.matchAll(/(?:image|url):'([^']+)'/g)) { await stat(resolve(root, match[1])); checked++; }
console.log(`Validated ${files.length} entry files and ${checked} local references for Pages subpath hosting.`);
