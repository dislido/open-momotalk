import Router from '@koa/router';
import { koaBody } from 'koa-body';

import { userAuth } from '../../middlewares/userAuthMiddleware.js';
import momotalkRouter from './momotalk/index.js';
import ossRouter from './oss/index.js';
import userRouter from './user/index.js';

const router = new Router();
router.use(koaBody());
router.use(
  userAuth(['/api/user/register', '/api/user/login']),
  userRouter.routes(),
  userRouter.allowedMethods(),
  ossRouter.routes(),
  ossRouter.allowedMethods(),
  momotalkRouter.routes(),
  momotalkRouter.allowedMethods(),
);

export default router;
