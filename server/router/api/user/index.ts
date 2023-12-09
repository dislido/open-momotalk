import Router from '@koa/router';

import {
  createUser,
  toClientUser,
  updateUserAvatar,
  updateUserNickname,
  updateUserPassword,
  userLogin,
} from '../../../services/user/index.js';
import BizError from '../../../utils/errors/BizError.js';
import aclRoutes from './acl.js';

const router = new Router();

router.get('/user/info', async (ctx) => {
  ctx.json(toClientUser(ctx.state.user));
});

router.post('/user/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  const { token, user } = await userLogin({ username, password });
  ctx.json(toClientUser(user), { newToken: token });
});

router.post('/user/register', async (ctx) => {
  const { username, password, nickname } = ctx.request.body;

  const { user, token } = await createUser({ username, password, nickname });

  ctx.json(toClientUser(user), { newToken: token });
});

router.post('/user/updateAvatar', async (ctx) => {
  const { url } = ctx.request.body;
  if (!url) throw new BizError('未上传头像');
  const user = await updateUserAvatar(ctx.state.user.id, url);
  ctx.json(toClientUser(user));
});

router.post('/user/updatePassword', async (ctx) => {
  const { oldPassword, newPassword } = ctx.request.body;
  const { user, token } = await updateUserPassword(ctx.state.user.id, oldPassword, newPassword);
  ctx.json(toClientUser(user), { newToken: token });
});

router.post('/user/updateNickname', async (ctx) => {
  const { nickname } = ctx.request.body;
  const user = await updateUserNickname(ctx.state.user.id, nickname);
  ctx.json(toClientUser(user));
});

router.use(aclRoutes.routes(), aclRoutes.allowedMethods());

export default router;
