import fs from 'fs/promises';
import { minify } from 'html-minifier-terser';
import type { Plugin } from 'rollup';

function importTemplate(): Plugin {
  return {
    name: 'importTemplate',

    load(id) {
      // 加?template避免build时与vite内置html plugin冲突
      if (!id.endsWith('.html?template')) return null;
      this.addWatchFile(id);
      return fs
        .readFile(id.replace(/\?template$/, ''), { encoding: 'utf-8' })
        .then((html) =>
          minify(html, { collapseWhitespace: true, collapseInlineTagWhitespace: true, noNewlinesBeforeTagClose: true }),
        )
        .then((html) => {
          const code = `export default \`${html}\`;\n`;
          return code;
        });
    },
  };
}

export default importTemplate;
