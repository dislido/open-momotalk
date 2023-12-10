import http from 'node:http';
import http2 from 'node:http2';
import type { Server } from 'node:net';
import path from 'node:path';

import fs from 'fs/promises';
import Koa from 'koa';
import koaMount from 'koa-mount';
import koaStatic from 'koa-static';
import { createServer } from 'vite';

import withRenderHtml from './extends/renderHtml.js';
import withResponceContext from './extends/response.js';
import { withWsServer } from './extends/wsServer.js';
import errorHandlerMiddleware from './middlewares/errorHandlerMiddleware.js';
import router from './router/index.js';
import type { MomotalkServerConfig, MomotalkServerOptions } from './types/config.js';
import connect from './utils/connect.js';
import { getDirname, projectRoot } from './utils/dirname.js';
import loadConfig from './utils/loadConfig.js';

export class MomotalkServer extends Koa {
  root = getDirname(import.meta.url, '..');
  constructor(
    public config: Partial<MomotalkServerConfig> = {},
    koaConfig?: ConstructorParameters<typeof Koa>[0],
    public options: MomotalkServerOptions = {},
  ) {
    super(koaConfig);
    this.context.app = this;
  }
}

const config = await loadConfig();

const app = new MomotalkServer(config, {
  env: config.SERVER_ENV,
});

await withResponceContext(app);
await withRenderHtml(app);
if (app.config.HMR) {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(connect(vite.middlewares));
  app.use(async (ctx, next) => {
    await next();

    if (ctx.type === 'text/html') {
      ctx.body = await vite.transformIndexHtml(ctx.request.url, ctx.body);
    }
  });
}

app.use(
  koaMount(
    '/static',
    koaStatic(path.resolve(projectRoot, './static'), {
      maxage: 259200000,
      index: false,
      setHeaders(res) {
        if (
          (res.req.url && res.req.url === '/sw.js') ||
          res.req.url?.startsWith('build') ||
          res.req.url?.startsWith('assets')
        ) {
          res.setHeader('Cache-Control', 'no-store');
        } else {
          res.setHeader('Cache-Control', 'max-age=31536000, immutable');
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Service-Worker-Allowed', '/');
      },
    }),
  ),
);
app.use(errorHandlerMiddleware);
app.use(router.routes()).use(router.allowedMethods());

let server: Server;
if (app.config.cert) {
  const [key, cert] = await Promise.all([fs.readFile(app.config.cert.key), fs.readFile(app.config.cert.cert)]);
  server = http2.createSecureServer({ key, cert });
} else {
  server = http.createServer(app.callback());
}
withWsServer(server);

server.listen(Number(app.config.PORT), '0.0.0.0', () => {
  console.info(`server start http://localhost${app.config.PORT === 80 ? '' : `:${app.config.PORT}`}`);
});
