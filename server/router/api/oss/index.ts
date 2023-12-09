import Router from '@koa/router';

import { requestUpload } from '../../../services/oss/index.js';

const router = new Router();

/**
 * 通用上传文件接口
 * - content `string` 文件Content-Type
 * - ext `string?` 文件扩展名, 如'.jpg'
 */
router.post('通用上传文件', '/oss/requestUpload', async (ctx) => {
  const { md5, contentType, ext = '' } = ctx.request.body;
  if (typeof md5 !== 'string') throw new Error('缺少参数 md5: string');
  if (typeof contentType !== 'string') throw new Error('未指定文件Content-Type');
  const result = requestUpload({
    contentType: [contentType],
    key: `u/${md5.toLowerCase()}${ext}`,
  });
  ctx.json(result);
});

router.post('加密上传文件', '/oss/requestSUpload', async (ctx) => {
  const { md5, contentType, ext = '' } = ctx.request.body;
  if (typeof md5 !== 'string') throw new Error('缺少参数 md5: string');
  if (typeof contentType !== 'string') throw new Error('未指定文件Content-Type');
  const result = requestUpload({
    contentType: [contentType],
    key: `s/${md5.toLowerCase()}${ext}`,
  });
  ctx.json(result);
});

export default router;
