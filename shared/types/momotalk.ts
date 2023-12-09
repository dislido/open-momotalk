import type { IUserInfo } from './model/user.js';
import type { WsRequestData, WsResponseData, WsResponseErrorData } from './ws.js';

export enum MomotalkWsReqType {
  /** 登录 */
  Auth = 0,
  /** 心跳包 */
  HeartBeat = 1,
  /** 发送群消息 */
  SendGroupMsg = 2,
}

// 作为MomotalkWsReq的响应时,值与MomotalkWsReqType对应类型相同,名称后加Res
export enum MomotalkWsResType {
  /** 登录 */
  Auth = 0,
  /** 心跳包 */
  HeartBeat = 1,
  /** 收到群消息 */
  ReceiveGroupMsg = 2,
}

/** momotalk消息类型 */
export enum MsgSegType {
  Text = 1,
  Image = 2,
  SFile = 3,
}

export interface MomotalkWsReqResMap {
  [MomotalkWsReqType.Auth]: MomotalkWsResType.Auth;
  [MomotalkWsReqType.SendGroupMsg]: MomotalkWsResType.ReceiveGroupMsg;
  [MomotalkWsReqType.HeartBeat]: MomotalkWsResType.HeartBeat;
}

export interface IMomotalkMsg {
  content: IMsgSegment[];
  createdAt: number;
  gid: string;
  id: number;
  sender: {
    id: number;
    avatar: string;
    nickname: string;
  };
}

/** momotalk消息数据块Map */
export interface IMsgSegmentMap {
  [MsgSegType.Text]: {
    type: MsgSegType.Text;
    text: string;
  };
  [MsgSegType.Image]: {
    type: MsgSegType.Image;
    url: string;
    size?: number;
    width?: number;
    height?: number;
  };
  [MsgSegType.SFile]: {
    type: MsgSegType.SFile;
    url: string;
    /** 文件类型 */
    mime: string;
    /** 文件名 */
    name: string;
    /** 文件大小(字节) @todo P4 旧文件过期后改为required */
    size?: number;
    /** 文件额外信息 */
    meta?: {
      /** 图片/视频宽度 */
      width?: number;
      /** 图片/视频高度 */
      height?: number;
      /** 视频封面url */
      poster?: string;
      /** 主题色,用作加载前展示 */
      themeColor?: string;
    };
  };
}

/** momotalk消息数据块 */
export type IMsgSegment<T extends MsgSegType = MsgSegType> = IMsgSegmentMap[T];

export interface IMomotalkWsReqDataMap {
  [MomotalkWsReqType.Auth]: {
    jwt: string;
  };
  [MomotalkWsReqType.SendGroupMsg]: {
    content: IMsgSegment[];
    gid: string;
  };
  [MomotalkWsReqType.HeartBeat]: undefined;
}

export interface IMomotalkWsResDataMap {
  [MomotalkWsResType.Auth]: {
    user: IUserInfo;
  };
  [MomotalkWsResType.ReceiveGroupMsg]: IMomotalkMsg;
  [MomotalkWsResType.HeartBeat]: undefined;
}

export type MomotalkWsReq<T extends MomotalkWsReqType = MomotalkWsReqType> = WsRequestData<IMomotalkWsReqDataMap, T>;
export type MomotalkWsRes<T extends MomotalkWsResType = MomotalkWsResType> = WsResponseData<IMomotalkWsResDataMap, T>;
export type MomotalkWsErr = WsResponseErrorData<MomotalkWsResType>;

/** ws关闭状态码 https://developer.mozilla.org/zh-CN/docs/Web/API/CloseEvent#status_codes */
export enum WsCloseCode {
  /** 正常关闭 */
  CLOSE_NORMAL = 1000,
  CLOSE_NO_STATUS = 1005,
  /** 非正常关闭, nginx默认60秒无消息会发送此code */
  CLOSE_ABNORMAL = 1006,

  // 业务code 4000 - 4999
  /** 正常退出 */
  Exit = 4000,
  /** 建立连接后没有在指定时间内完成登录 */
  AuthTimeout = 4001,
}
