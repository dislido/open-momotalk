import type { MomotalkServerConfig } from '../types/config';

export default {
  SERVER_ENV: 'production',
  PORT: Number(process.env.PORT) || 80,
  defaultPageConstants: {
    env: 'production',
  },
} satisfies Partial<MomotalkServerConfig>;
