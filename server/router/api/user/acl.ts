import Router from '@koa/router';

import { getACL } from '../../../services/auth/index.js';
import BizError from '../../../utils/errors/BizError.js';

const router = new Router();

router.get('/user/acl', async (ctx) => {
  const { ns, nsId = '' } = ctx.request.query;
  if (typeof ns !== 'string' || typeof nsId !== 'string') {
    throw new BizError(`参数错误: ns:${ns}, nsId:${nsId}`);
  }
  const acl = await getACL(ctx.state.user.id, ns, nsId);
  ctx.json(acl.flatMap((it) => it.acl.key));
});

export default router;
