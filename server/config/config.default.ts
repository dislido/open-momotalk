// 基础配置文件, 其他的config.xxx.ts会继承此文件配置(1层浅拷贝)
import type { MomotalkServerConfig } from '../types/config';

// @init 配置
export default {
  PORT: 80,

  // bcrypt salt, 执行`node -e "console.log(require('bcryptjs').genSaltSync())"`生成一个
  // 大概长这样: '$2a$10$/BLiEFQTKloNX.PFjHz1Q.' <- 你也可以直接用这个
  // 没正确配置会报JsonWebTokenError/invalid signature
  BCRYPT_SALT: '123123',

  // 阿里云配置, 没有正确配置会导致无法上传文件,发送图片
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

  // https证书文件位置, 如果你使用nginx提供https,这里可以不填
  // 没有https应该不影响基本功能使用
  // cert: {
  //   key: '/etc/letsencrypt/live/xxx.com/fullchain.pem',
  //   cert: '/etc/letsencrypt/live/xxx.com/privkey.pem',
  // },
} satisfies Partial<MomotalkServerConfig>;
