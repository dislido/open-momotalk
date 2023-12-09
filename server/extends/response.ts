import type { MomotalkServer } from 'server';

export default async function withResponceContext(app: MomotalkServer) {
  if (Object.hasOwn(app.context, 'renderHtml')) return;

  app.context.json = async function (data: unknown, meta?: Record<string, unknown>) {
    this.body = {
      ok: true,
      data,
      ...this.state.respExtra,
      ...meta,
    };
    this.status = 200;
    this.type = 'json';
  };
}
