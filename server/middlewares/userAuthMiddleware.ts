import type { Middleware } from 'koa';

import { getUserByToken } from '../services/user/index.js';

export function userAuth(whiteList: string[]): Middleware {
  return async (ctx, next) => {
    if (whiteList.includes(ctx.URL.pathname)) return next();
    const auth = ctx.header.authorization;
    if (!auth) {
      ctx.json(undefined, { ok: false, message: '用户未登录' });
      ctx.status = 403;
      return;
    }

    const data = await getUserByToken(auth.slice(7));
    if (!data) {
      ctx.json(undefined, { ok: false, message: '登录已失效' });
      ctx.status = 403;
      return;
    }

    if (data.newToken) {
      if (!ctx.state.respExtra) ctx.state.respExtra = {};
      ctx.state.respExtra.newToken = data.newToken;
    }

    ctx.state.user = data.user;

    await next();
  };
}
