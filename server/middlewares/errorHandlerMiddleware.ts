import type { Middleware } from 'koa';

import BizError from '../utils/errors/BizError.js';

/**
 * @todo P3 错误注册响应表 Record<string(error.name), (e, ctx) => void>
 */
const errorHandlerMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
    if (!ctx.body) {
      ctx.status = 404;
      ctx.body = '404 Not Found';
      ctx.app.config.onNotFound?.(ctx);
    }
  } catch (e) {
    ctx.headers['content-type'] = 'application/json';

    if (!(e instanceof Error)) {
      console.error('未知错误', e);
      ctx.json(undefined, { ok: false, message: '未知错误' });
      ctx.status = 500;
      return;
    }

    if (e instanceof BizError) {
      ctx.json(undefined, { ok: false, message: e.message });
      ctx.status = 400;
      return;
    }

    if (e.name === 'PrismaClientInitializationError') {
      ctx.json(undefined, { ok: false, message: '服务器异常:数据库掉线了,请稍后重试' });
      ctx.status = 500;
      return;
    }

    // 未捕获的数据库错误
    if (e.name === 'PrismaClientKnownRequestError') {
      ctx.json(undefined, { ok: false, message: '服务器异常,请稍后重试' });
      ctx.status = 500;
      return;
    }

    console.error('未知错误', e);
    ctx.json(undefined, { ok: false, message: e.message });
    ctx.status = 500;
  }
};

export default errorHandlerMiddleware;
