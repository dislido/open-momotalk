import Router from '@koa/router';

import apiRouter from './api/index.js';
import pagesRouter from './pages/index.js';

const router = new Router();

router.use('/api', apiRouter.routes(), apiRouter.allowedMethods());
router.use(pagesRouter.routes(), pagesRouter.allowedMethods());
export default router;
