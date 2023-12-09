import path from 'node:path/posix';

import fs from 'fs/promises';

import type { MomotalkServer } from '../index.js';
import { getDirname } from '../utils/dirname.js';
import defaultRender from '../view/htmlRender.js';

export interface RenderOptions {
  /** 对应vite.config.ts中build.rollupOptions.input中的入口路径 */
  templatePath: string;
  /** 额外插入html中的内容 */
  inject?: Partial<Record<string, string>>;
  /** 页面pageConstants */
  pageConstants?: object;
}

/**
 * 合并renderSlot内容
 */
function mergeRenderParts(...items: (Partial<Record<string, string>> | undefined)[]) {
  const result: Partial<Record<string, string>> = {};

  items
    .filter((it): it is Partial<Record<string, string>> => !!it)
    .forEach((it) => {
      Object.entries(it).forEach(([slot, content]) => {
        if (typeof content !== 'string') return;
        if (!result[slot]) {
          result[slot] = content;
          return;
        }
        result[slot] = `${result[slot]}${content}`;
      });
    });
  return result;
}

export default async function withRenderHtml(app: MomotalkServer) {
  if (Object.hasOwn(app.context, 'renderHtml')) return;

  async function loadHtml(htmlFile: string) {
    const basePath = getDirname(import.meta.url, app.config.HMR ? '../..' : '../../static');
    const htmlPath = path.resolve(basePath, htmlFile);
    await fs.access(htmlPath);
    return (await fs.readFile(htmlPath)).toString('utf8');
  }

  app.context.renderHtml = async function (options: RenderOptions) {
    const { templatePath, inject } = options;
    const { state } = this;
    try {
      const template = await loadHtml(templatePath);
      const pageConstants = {
        ...app.config.defaultPageConstants,
        ...state.pageConstants,
      };
      const html = defaultRender(
        template,
        mergeRenderParts(
          app.config.defaultInjectHtml,
          {
            head: `<script>window.pageConstants=${JSON.stringify(pageConstants)}</script>`,
          },
          inject,
        ),
        {
          templatePath,
        },
      );

      this.type = 'html';
      this.body = html;

      return html;
    } catch (e) {
      console.error(e);
      this.status = 500;
      this.type = 'text/html';
      this.body = '<h1>500 服务器页面丢失</h1>';
      return this.body as string;
    }
  };
}
