import { globalContext } from '@/common/globalContext';
import showMessage from '@/components/message';
import type { IUserInfo } from '@/shared/types/model/user';
import type {
  IMomotalkWsReqDataMap,
  IMomotalkWsResDataMap,
  MomotalkWsReq,
  MomotalkWsReqResMap,
  MomotalkWsRes,
} from '@/shared/types/momotalk';
import { MomotalkWsReqType, MomotalkWsResType, WsCloseCode } from '@/shared/types/momotalk';

import { momotalkContext } from '../momotalkContext';

window.addEventListener(
  'load',
  () => {
    document.body.classList.toggle('loaded', true);
  },
  { once: true },
);
let reqId = 0;
const WS_REQ_TIMEOUT = 10000;
/** 心跳包interval nginx默认60秒无消息自动断开,code=1006 */
const WS_HEARTBEAT_INTERVAL = 25000;
const WS_HEARTBEAT_MAX_RETRY = 3;

function isSuccessRes(data: object): data is MomotalkWsRes {
  return !('code' in data);
}

export class MomotalkWs {
  #eventHost: {
    [T in MomotalkWsResType]?: Set<(data: IMomotalkWsResDataMap[T]) => void | Promise<void>>;
  } = {};
  #ws: WebSocket;
  #heartBeatTimer = 0;
  #heartBeatRetryTime = 0;

  #refreshHeartBeat = async () => {
    window.clearInterval(this.#heartBeatTimer);
    this.#heartBeatTimer = window.setTimeout(() => {
      this.call(MomotalkWsReqType.HeartBeat, undefined).catch(() => {
        if (this.#heartBeatRetryTime >= WS_HEARTBEAT_MAX_RETRY) {
          this.#ws.close();
          return;
        }
        this.#heartBeatRetryTime++;
      });
      this.#refreshHeartBeat();
    }, WS_HEARTBEAT_INTERVAL);
  };

  constructor(public url: string | URL) {
    this.#ws = new WebSocket(url);
  }

  async connect(jwt: string) {
    return new Promise<{ user: IUserInfo }>((resolve) => {
      const authListener = (data: IMomotalkWsResDataMap[MomotalkWsResType.Auth]) => {
        resolve(data);
        this.off(MomotalkWsResType.Auth, authListener);
      };
      this.on(MomotalkWsResType.Auth, authListener);

      this.#ws.addEventListener('error', () => {
        // ws error事件不会提供任何error有关的信息
        showMessage('连接发生未知错误: ws error');
      });

      this.#ws.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        if (isSuccessRes(data)) {
          this.#eventHost[data.type]?.forEach((cb) => cb(data.data as never));
        }
      });

      this.#ws.addEventListener(
        'open',
        () => {
          this.call(MomotalkWsReqType.Auth, { jwt });
          this.#refreshHeartBeat();
        },
        { once: true },
      );
      this.#ws.addEventListener(
        'close',
        (e) => {
          if (e.code === WsCloseCode.AuthTimeout) {
            showMessage('登录超时');
            return;
          }

          // @todo P3 重连后触发sync
          // @todo P2 增加断线事件
          // @todo P2 重连失败次数上限
          setTimeout(() => {
            this.#ws = new WebSocket(this.url);
            this.connect(jwt);
          }, 3000);
        },
        { once: true },
      );
    });
  }

  async call<T extends MomotalkWsReqType>(type: T, data: IMomotalkWsReqDataMap[T]) {
    const id = ++reqId;
    this.#ws.send(
      JSON.stringify({
        type,
        reqId: id,
        data,
      } satisfies MomotalkWsReq<T>),
    );
    this.#refreshHeartBeat();
    return new Promise<IMomotalkWsResDataMap[MomotalkWsReqResMap[T]]>((resolve, reject) => {
      let timeout = 0;
      const listener = (e: MessageEvent) => {
        const res = JSON.parse(e.data);
        if (res.reqId !== id) return;
        this.#heartBeatRetryTime = 0;
        clearTimeout(timeout);
        if (isSuccessRes(res)) {
          this.#ws.removeEventListener('message', listener);
          resolve(res.data as IMomotalkWsResDataMap[MomotalkWsReqResMap[T]]);
          return;
        }
        this.#ws.removeEventListener('message', listener);
        reject(new Error('请求错误', { cause: res }));
      };
      timeout = window.setTimeout(() => {
        this.#ws.removeEventListener('message', listener);
        reject(new Error('请求超时'));
      }, WS_REQ_TIMEOUT);
      this.#ws.addEventListener('message', listener);
    });
  }

  on<T extends MomotalkWsResType>(type: T, cb: (data: IMomotalkWsResDataMap[T]) => void | Promise<void>) {
    if (!this.#eventHost[type]) this.#eventHost[type] = new Set<never>();
    this.#eventHost[type]?.add(cb);
  }

  off<T extends MomotalkWsResType>(type: T, cb: (data: IMomotalkWsResDataMap[T]) => void | Promise<void>) {
    if (!this.#eventHost[type]) return;
    this.#eventHost[type]?.delete(cb);
  }
}

// MomotalkWs应为单例
async function initWs(jwt?: string) {
  if (!jwt) throw new Error('403 Unauthorized');
  const url = new URL(location.href);
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/momotalk';
  const ws = new MomotalkWs(url);
  await ws.connect(jwt);
  momotalkContext.set('ws', ws);
}

if (globalContext.get('user')) {
  const jwt = localStorage.getItem('jwt');
  if (jwt) initWs(jwt);
} else {
  globalContext.watch('user', (user) => {
    if (user) {
      const jwt = localStorage.getItem('jwt');
      if (jwt) initWs(jwt);
      return { removeListener: true };
    }
  });
}
