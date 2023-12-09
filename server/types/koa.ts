import type { Prisma } from '@prisma/client';

import type { RenderOptions } from '../extends/renderHtml.js';
import type { MomotalkServer } from '../index.js';

interface IApiResponse<T = void> {
  /** 更新token */
  newToken?: string;
  ok: boolean;
  data: T;
  /** 信息 */
  message?: string;
}
declare module 'koa' {
  interface DefaultState {
    /** 访问分支，默认'default' */
    branch: string;
    /** ApiResponse额外内容 */
    respExtra?: Record<string, unknown>;
    /** 当前用户 */
    user: Prisma.userGetPayload<object>;
    /** 页面pageConstants */
    pageConstants?: object;
  }
  interface DefaultContext {
    app: MomotalkServer;
    state: DefaultState;
    /** 渲染html */
    renderHtml(options: RenderOptions): Promise<string>;
    json<T>(data: T, meta?: Omit<Partial<IApiResponse<T>>, 'data'>): void;
  }
}
