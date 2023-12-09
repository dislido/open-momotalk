import { getUserInfo } from '@/common/user';
import type { IUserInfo } from '@/shared/types/model/user';
import { ObservableObject } from '@/utils/context';

interface IMomotalkConfig {
  /** 消息中的图片/视频自动加载原图的大小限制, 1M~6M = 6M */
  ['msg.autoloadSize']?: number;
}

export const globalContext = new ObservableObject<{
  /** 当前登录用户信息, 为null时代表token过期/网络异常等jwt存在但登录失败的情况 */
  user?: IUserInfo | null;
  /** 网络连接状态 */
  online: boolean;
  /** @todo P2 用户设置 */
  config: IMomotalkConfig;
}>({
  online: navigator.onLine,
  config: {},
});

if (localStorage.getItem('jwt')) {
  getUserInfo(undefined, {
    autoToast: false,
  })
    .then((user) => {
      globalContext.set('user', user);
    })
    .catch(() => {
      globalContext.set('user', null);
    });
}

window.addEventListener('online', () => {
  globalContext.set('online', true);
});

window.addEventListener('offline', () => {
  globalContext.set('online', false);
});

const defaultConfig: Required<IMomotalkConfig> = {
  'msg.autoloadSize': 1024 ** 2 * 6, // 6M
};

export function getConfig<K extends keyof IMomotalkConfig>(key: K): NonNullable<IMomotalkConfig[K]> {
  const config = globalContext.get('config');
  return config[key] ?? defaultConfig[key];
}
