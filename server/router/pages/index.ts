import Router from '@koa/router';

const router = new Router();

router.use((ctx, next) => {
  ctx.res.setHeader('Cache-Control', 'no-store');
  ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
  ctx.res.setHeader('Service-Worker-Allowed', '/');
  return next();
});

router.get('/momotalk', async (ctx) =>
  ctx.renderHtml({
    templatePath: 'client/pages/momotalk/index.html',
    pageConstants: {
      wsUrl: ctx.app.config.WS_URL,
    },
  }),
);
router.get('/', async (ctx) => {
  ctx.redirect('/momotalk');
});

export default router;
