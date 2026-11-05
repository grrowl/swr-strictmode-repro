import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
const fixed = resolve('.build/swr-fixed');
await cp('node_modules/swr', fixed, { recursive: true });
let patched = 0;
for (const file of await readdir(`${fixed}/dist`)) {
  if (!/^config-context-.*\.(mjs|js)$/.test(file)) continue;
  const path = `${fixed}/dist/${file}`;
  const source = await readFile(path, 'utf8');
  const result = source.replace('const EVENT_REVALIDATORS = Object.create(null);', `const EVENT_REVALIDATORS = Object.create(null);
        const MUTATION = Object.create(null);
        const FETCH = Object.create(null);
        const PRELOAD = Object.create(null);`).replace(`EVENT_REVALIDATORS,
                    Object.create(null),
                    Object.create(null),
                    Object.create(null),`, `EVENT_REVALIDATORS,
                    MUTATION,
                    FETCH,
                    PRELOAD,`);
  if (result === source) throw new Error(`Pinned SWR patch no longer matches ${file}`);
  await writeFile(path, result);
  patched++;
}
if (patched !== 2) throw new Error(`Expected ESM and CommonJS patch targets, found ${patched}`);
for (const version of ['unpatched', 'fixed']) {
  const root = version === 'fixed' ? fixed : resolve('node_modules/swr');
  await build({
    entryPoints: ['src/main.jsx'], outfile: `dist/${version}.js`, bundle: true, format: 'esm', sourcemap: true,
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'exact-swr-package', setup(builder) {
      builder.onResolve({ filter: /^swr(?:\/mutation)?$/ }, ({ path }) => ({ path: `${root}/dist/${path === 'swr' ? 'index' : 'mutation'}/index.mjs` }));
    } }]
  });
}
console.log('Built original SWR 2.5.1 and the same package with the registry-identity fix.');
