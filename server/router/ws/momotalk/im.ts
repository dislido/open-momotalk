import type { MomotalkWsReq } from '../../../../shared/types/momotalk.js';
import { MomotalkWsReqType, MomotalkWsResType } from '../../../../shared/types/momotalk.js';
import { addGroupMsg, getGroupMembers } from '../../../services/momotalk/group.js';
import { connections, type MomotalkWs } from './index.js';

export default {
  async [MomotalkWsReqType.SendGroupMsg](ws, req) {
    const msg = await addGroupMsg({
      senderId: ws.$data.user.id,
      gid: req.data.gid,
      content: req.data.content,
    });
    const members = await getGroupMembers(req.data.gid);
    members.forEach((it) => {
      const conns = connections.get(it.id);
      if (conns?.length) {
        conns.forEach((conn) => {
          conn.push(MomotalkWsResType.ReceiveGroupMsg, msg, conn === ws ? req.reqId : undefined);
        });
      }
    });
  },
} satisfies {
  [T in MomotalkWsReqType]?: (ws: MomotalkWs, req: MomotalkWsReq<T>) => Promise<void> | void;
};
