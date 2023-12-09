import type { MomotalkServerConfig } from '../types/config';

// @init 数据库连接地址, 懒得写到pm2环境变量了
process.env.DATABASE_URL = 'mysql://username:password@host:3306/dbname';

// @init 配置
export default {
  PORT: 80,

  // 顺便输个字符串
  BCRYPT_SALT: '1145141919810',
  aliyun: {
    // 阿里云oss https://oss.console.aliyun.com/bucket
    // 你的阿里云oss的地址origin 如 https://xxx.oss-cn-hangzhou.aliyuncs.com/, 在bucket概览中查看
    ossHost: '',
    // Bucket 名称
    bucket: '',

    // 获取accessKey https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair/#task-2245479
    accessKeyID: '114',
    accessKeySecret: '514',
  },
} satisfies Partial<MomotalkServerConfig>;
