import type { Context, Middleware } from 'koa';
import BizError from 'server/utils/errors/BizError.js';

import { checkACL } from '../services/auth/index.js';

export function checlAclMiddleware(acls: { nsId?: (ctx: Context) => string; key: string }[]): Middleware {
  return async (ctx, next) => {
    const userId = ctx.state.user.id;

    const hasAcl = await checkACL(
      userId,
      acls.map((it) => ({
        key: it.key,
        nsId: it.nsId ? it.nsId(ctx) : '',
      })),
    );

    if (!hasAcl) {
      throw new BizError('权限不足');
    }

    return next();
  };
}
