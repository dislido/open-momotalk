export interface WsRequestData<M, T extends keyof M> {
  type: T;
  data: M[T];
  reqId: number;
}

export interface WsResponseData<M, T extends keyof M> {
  type: T;
  data: M[T];
  reqId?: number;
}

export interface WsResponseErrorData<T> {
  type: T;
  data?: unknown;
  reqId: number;
  code: number;
}
