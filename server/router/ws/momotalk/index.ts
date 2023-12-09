import timer from 'node:timers/promises';

import type { Prisma } from '@prisma/client';
import type { WebSocket } from 'ws';

import type {
  IMomotalkWsResDataMap,
  MomotalkWsErr,
  MomotalkWsReq,
  MomotalkWsRes,
} from '../../../../shared/types/momotalk.js';
import { MomotalkWsReqType, MomotalkWsResType, WsCloseCode } from '../../../../shared/types/momotalk.js';
import { getUserByToken, toClientUser } from '../../../services/user/index.js';
import imRoutes from './im.js';

/** 已登录的连接 Map<userId, ws[]> */
export const connections = new Map<number, MomotalkWs[]>();
/** 未登录的连接 */
export const unAuthedConnections = new Set<WebSocket>();

export interface MomotalkWs extends WebSocket {
  $data: {
    user: Prisma.userGetPayload<object>;
  };

  /** 推送消息 */
  push<T extends MomotalkWsResType>(this: WebSocket, type: T, data: IMomotalkWsResDataMap[T], reqId?: number): void;
}

function setMomotalkWs(ws: WebSocket, user: Prisma.userGetPayload<object>) {
  Object.assign(ws, {
    $data: {
      user,
    },
    push<T extends MomotalkWsResType>(this: WebSocket, type: T, data: IMomotalkWsResDataMap[T], reqId?: number) {
      this.send(
        JSON.stringify({
          type,
          data,
          reqId,
        }),
      );
    },
  });
  return ws as MomotalkWs;
}
async function auth(ws: WebSocket, req: MomotalkWsReq<MomotalkWsReqType.Auth>) {
  const data = await getUserByToken(req.data.jwt);
  if (!data) {
    ws.send(
      JSON.stringify({
        code: 403,
        reqId: req.reqId,
        type: MomotalkWsResType.Auth,
      } satisfies MomotalkWsErr),
    );
    return;
  }
  const momoWs = setMomotalkWs(ws, data.user);
  momoWs.send(
    JSON.stringify({
      reqId: req.reqId,
      type: MomotalkWsResType.Auth,
      data: {
        user: toClientUser(data.user),
      },
    } satisfies MomotalkWsRes<MomotalkWsResType.Auth>),
  );
  unAuthedConnections.delete(momoWs);
  const list = connections.get(data.user.id);
  momoWs.on('close', () => {
    const conns = connections.get(data.user.id);
    if (!conns) return;
    if (conns.length === 1 && conns[0] === momoWs) {
      connections.delete(data.user.id);
      return;
    }
    connections.set(
      data.user.id,
      conns.filter((it) => it !== momoWs),
    );
  });
  if (!list) {
    connections.set(data.user.id, [momoWs]);
  } else {
    list.push(momoWs);
  }
}

const router: {
  [T in MomotalkWsReqType]: (ws: MomotalkWs, req: MomotalkWsReq<T>) => Promise<void> | void;
} = {
  [MomotalkWsReqType.Auth]: auth,
  [MomotalkWsReqType.HeartBeat]: (ws, req) => {
    ws.push(MomotalkWsResType.HeartBeat, undefined, req.reqId);
  },
  ...imRoutes,
};

export function registerWs(ws: WebSocket) {
  unAuthedConnections.add(ws);
  timer.setTimeout(10000).then(() => {
    if (unAuthedConnections.has(ws)) {
      ws.close(WsCloseCode.AuthTimeout);
      unAuthedConnections.delete(ws);
    }
  });

  ws.on('error', (e) => console.error('momotalk ws error', e));
  // ws.on('close', console.log);
  ws.on('message', (dataBuf: Buffer) => {
    try {
      const data = JSON.parse(dataBuf.toString('utf-8')) as MomotalkWsReq;
      if (!('$data' in ws) && data.type !== MomotalkWsReqType.Auth) {
        ws.send(
          JSON.stringify({
            code: 403,
            reqId: data.reqId,
            type: MomotalkWsResType.Auth,
          } satisfies MomotalkWsErr),
        );
        return;
      }
      router[data.type](ws as MomotalkWs, data as never);
    } catch (e) {
      console.error('momotalk ws error: ', e);
    }
    // wsServer.clients.forEach(function each(client) {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(data, { binary: isBinary });
    //   }
    // });
  });
}
