import { createHmac } from 'crypto';

import loadConfig from '../../utils/loadConfig.js';

const config = await loadConfig();

interface IOSSPolicyCondition {
  /** Bucket名称 */
  bucket?: string;
  /** 传Object的最大允许大小，单位为字节。最大5G = 1G */
  maxLength?: number;
  /** 上传路径 */
  key: string;
  contentType: string[];
}

/** 请求上传基础接口 */
export function requestUpload({ key, contentType, bucket = config.aliyun.bucket, maxLength }: IOSSPolicyCondition) {
  const params: { expiration: string; conditions: ((string | number | string[])[] | Record<string, string>)[] } = {
    expiration: new Date(Date.now() + 60000).toISOString(),
    conditions: [
      { bucket },
      ['content-length-range', 1, maxLength ?? 1024 ** 3],
      ['eq', '$key', key],
      // 未知文件类型为 application/octet-stream
      ['in', '$Content-Type', ['application/octet-stream'].concat(contentType)],
    ],
  };

  const policy = Buffer.from(
    // doc https://help.aliyun.com/zh/oss/developer-reference/postobject#section-d5z-1ww-wdb
    JSON.stringify(params),
    'utf-8',
  ).toString('base64');

  const signature = createHmac('sha1', config.aliyun.accessKeySecret).update(policy).digest('base64');

  const uploadPolicyData = {
    accessid: config.aliyun.accessKeyID,
    host: config.aliyun.ossHost,
    policy,
    signature,
    expire: Math.floor(Date.now() / 1000) + 60,
    key,
  };
  return uploadPolicyData;
}
