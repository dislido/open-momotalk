import type { MomotalkServerConfig } from '../types/config';

export default {
  SERVER_ENV: 'production',
  PORT: Number(process.env.PORT) || 1919,
  defaultPageConstants: {
    env: 'production',
  },
} satisfies Partial<MomotalkServerConfig>;
