/** Modify from koa-connect */

import type { RequestHandler } from 'express';
import type { DefaultContext } from 'koa';
/**
 * Inject raw response, so we can know if middleware has responsed.
 */
function makeInjectedResponse(koaCtx: DefaultContext, whenEnded: (() => void) | (() => Promise<void>)) {
  const { res } = koaCtx;

  res.on('close', whenEnded).on('finish', whenEnded);

  const dummyRes = Object.create(res);
  ['setHeader', 'writeHead', 'write', 'end'].forEach((name) => {
    dummyRes[name] = function (...args: any) {
      res[name](...args);
      // koa2.0 initial assign statusCode to 404, reset to 200
      if (res.statusCode === 404) {
        res.statusCode = 200;
      }
    };
  });
  ['statusCode', 'statusMessage'].forEach((name) => {
    dummyRes.__defineSetter__(name, function (value: any) {
      res[name] = value;
    });
  });

  return dummyRes;
}

/**
 * The middleware function does include the `next` callback so only resolve
 * the Promise when it's called. If it's never called, the middleware stack
 * completion will stall
 */
function handler(ctx: DefaultContext, connectMiddleware: RequestHandler) {
  return new Promise((resolve, reject) => {
    const args = [
      ctx.req,
      makeInjectedResponse(ctx, () => {
        resolve(false);
      }),
      (err: any) => {
        if (err) reject(err);
        else resolve(true);
      },
    ] as const;
    connectMiddleware(...args);
  });
}

/**
 * Returns a Koa middleware function that varies its async logic based on if the
 * given middleware function declares at least 3 parameters, i.e. includes
 * the `next` callback function
 */
function koaConnect(connectMiddleware: RequestHandler) {
  return async (ctx: DefaultContext, next: (() => void) | (() => Promise<void>)) => {
    ctx.respond = false;
    try {
      const goNext = await handler(ctx, connectMiddleware);
      if (goNext) {
        ctx.respond = true;
        return next();
      }
    } catch (err) {
      ctx.respond = true;
      throw err;
    }
  };
}

export default koaConnect;
