import { dirname, resolve } from 'node:path/posix';

import { fileURLToPath } from 'url';

export function getDirname(importMetaUrl: string, ...to: string[]) {
  const dir = dirname(fileURLToPath(importMetaUrl));
  return to.length > 0 ? resolve(dir, ...to) : dir;
}

export const projectRoot = getDirname(import.meta.url, '../..');
