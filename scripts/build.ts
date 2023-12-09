import cp from 'node:child_process';
import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path/posix';

import { fileURLToPath } from 'url';
import { build, mergeConfig } from 'vite';

import pwaManifest from '../pwaManifest.js';
import viteConfig from '../vite.config.js';
import viteSwConfig from '../vite.sw.config.js';

export function getDirname(importMetaUrl: string, ...to: string[]) {
  const dir = dirname(fileURLToPath(importMetaUrl));
  return to.length > 0 ? resolve(dir, ...to) : dir;
}

const cacheRequests = ['/', '/momotalk', '/static/momotalk.webmanifest'];

const buildResult = await build(
  mergeConfig(viteConfig, {
    configFile: false,
  }),
);
if ('output' in buildResult) {
  const assets = buildResult.output.filter(
    (it) => !it.fileName.endsWith('.html') && !it.fileName.endsWith('.br') && !it.fileName.endsWith('.gz'),
  );
  cacheRequests.push(...assets.map((it) => `/static/${it.fileName}`));
}
cacheRequests.sort();

const commitId = cp.execSync('git rev-parse HEAD').toString('utf-8').trim();
const CACHE_NAME = `DLPWA-${commitId}`;

await fs.writeFile(getDirname(import.meta.url, '../static/momotalk.webmanifest'), JSON.stringify(pwaManifest));

await build(
  mergeConfig(viteSwConfig, {
    configFile: false,
    define: {
      APP_STATIC_RESOURCES: cacheRequests,
      CACHE_NAME: `"${CACHE_NAME}"`,
    },
  }),
);
