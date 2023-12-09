import type { DefaultContext } from 'koa';

import type { MomotalkServer } from '..';

/** 应用配置 */
export interface MomotalkServerConfig {
  /** 端口号 = 80 */
  readonly PORT?: number;
  /** 使用vite devServer */
  readonly HMR: boolean;

  readonly SERVER_ENV: string;

  /** 默认插入html模板的内容 */
  readonly defaultInjectHtml?: Record<string, string>;

  /** 默认的页面pageConstants */
  readonly defaultPageConstants?: object;

  /** 阿里云配置 */
  readonly aliyun: {
    ossHost: string;
    bucket: string;
    accessKeyID: string;
    accessKeySecret: string;
  };

  /** jwt的盐,修改它会使所有jwt失效 */
  readonly BCRYPT_SALT?: string;

  readonly onNotFound?: (ctx: DefaultContext) => void | Promise<void>;

  readonly [key: string]: any;
}
/** 应用配置 */
export interface MomotalkServerOptions {
  /** koa.listen回调 */
  onListen?: (app: MomotalkServer) => void;
}
