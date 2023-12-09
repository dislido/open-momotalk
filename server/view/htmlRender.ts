import path from 'node:path/posix';

interface HtmlRenderOptions {
  // html文件相对路径
  templatePath: string;
}

/** 超敷衍的模板引擎 */
export default function htmlRender(
  template: string,
  parts: Partial<Record<string, string>> = {},
  options: HtmlRenderOptions,
) {
  return template
    .replace(
      /<script ([^>]* |)src="([^"]+)"/g,
      (...args) => `<script ${args[1]}src="${path.resolve(path.parse(options.templatePath).dir, args[2])}"`,
    )
    .replace(/<!-- renderSlot:([\w$]+) -->/g, (_, partName) => parts[partName] ?? '');
}
