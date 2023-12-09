import Router from '@koa/router';

import {
  addGroupMember,
  getGroupByGid,
  getGroupMembers,
  getGroupMsgList,
  getUserGroups,
  toClientGroup,
} from '../../../services/momotalk/group.js';
import { toClientUser } from '../../../services/user/index.js';
import BizError from '../../../utils/errors/BizError.js';

const router = new Router();

router.get('/momotalk/groupList', async (ctx) => {
  const groups = await getUserGroups(ctx.state.user.id);
  ctx.json(groups.map((it) => toClientGroup(it)));
});

router.get('/momotalk/groupMsgList', async (ctx) => {
  const { gid, cursor } = ctx.query;
  if (typeof gid !== 'string') throw new BizError('群聊不存在');
  const c = +(cursor ?? 0);
  const list = await getGroupMsgList(gid, c || undefined);
  ctx.json(list);
});

router.get('/momotalk/findGroup', async (ctx) => {
  const { gid = '' } = ctx.query;
  if (typeof gid !== 'string') {
    return ctx.json([]);
  }
  const group = await getGroupByGid(gid);
  ctx.json(group ? toClientGroup(group) : null);
});

router.post('/momotalk/joinGroup', async (ctx) => {
  const { gid } = ctx.request.body;
  if (typeof gid !== 'string') throw new BizError('群聊不存在');
  const group = await addGroupMember(gid, ctx.state.user.id);
  ctx.json(toClientGroup(group));
});

router.get('/momotalk/groupMembers', async (ctx) => {
  const { gid = '' } = ctx.query;
  if (typeof gid !== 'string') {
    return ctx.json([]);
  }
  const list = await getGroupMembers(gid);
  ctx.json(list.map((it) => toClientUser(it)));
});

export default router;
