import type { MomotalkServerConfig } from '../types/config';

export default {
  SERVER_ENV: 'development',
  HMR: true,
  PORT: Number(process.env.PORT) || 80,
  defaultPageConstants: {
    env: 'development',
  },
} satisfies Partial<MomotalkServerConfig>;
