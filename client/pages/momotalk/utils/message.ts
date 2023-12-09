import type { IMsgSegment } from '@/shared/types/momotalk';
import { MsgSegType } from '@/shared/types/momotalk';

export function msgStringify(msg: IMsgSegment[]) {
  return msg
    .map((it) => {
      if (it.type === MsgSegType.Text) {
        return it.text;
      }
      if (it.type === MsgSegType.Image) {
        return `[图片]`;
      }
      if (it.type === MsgSegType.SFile) {
        if (it.mime.startsWith('image/')) return `[图片]`;
        return `[文件]`;
      }
      return `[未知消息类型]`;
    })
    .join('');
}
