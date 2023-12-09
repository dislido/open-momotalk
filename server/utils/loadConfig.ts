import defaultConfig from '../config/config.default.js';
import type { MomotalkServerConfig } from '../types/config.js';
import { getDirname } from './dirname.js';

/** 默认配置,SERVER_ENV='production' */
export const defaultServerConfig: MomotalkServerConfig = {
  PORT: 80,
  HOST: process.env.HOST ?? '0.0.0.0',
  SERVER_ENV: 'production',
  HMR: false,

  aliyun: {
    bucket: '',
    ossHost: '',
    accessKeyID: '',
    accessKeySecret: '',
  },
};

let configCache: MomotalkServerConfig | null = null;

export default async function loadConfig(): Promise<MomotalkServerConfig> {
  if (configCache) return configCache;
  const path: string = getDirname(import.meta.url, '../config');
  let result = defaultServerConfig;
  try {
    result = { ...result, ...defaultConfig };
  } catch (e) {
    console.error(e);
  }

  const SERVER_ENV = process.env.SERVER_ENV ?? process.env.NODE_ENV;
  if (!SERVER_ENV) {
    configCache = result;
    return result;
  }
  try {
    const config = (await import(`../config/config.${SERVER_ENV}.js`)).default;
    result = { ...result, ...config };
    configCache = result;
    return result;
  } catch (e) {
    console.error(e);
    console.error(`加载 ${path}/config.${SERVER_ENV}.js 出错,正在使用default配置`);
    configCache = result;

    return result;
  }
}
