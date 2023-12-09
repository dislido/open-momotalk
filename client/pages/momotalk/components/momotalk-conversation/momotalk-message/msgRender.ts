import { getConfig } from '@/common/globalContext';
import { decryptSFile } from '@/common/upload';
import type { IMsgSegment } from '@/shared/types/momotalk';
import { MsgSegType } from '@/shared/types/momotalk';
import { createAutoRevokeableObjectUrl } from '@/utils/blob-gc';
import { h } from '@/utils/dom';
import { formatBytes } from '@/utils/upload';

import { supportedImageType, supportedVideoType } from '../../../constants';
import { MomotalkFileMessageElement } from './momotalk-file-message';
import { createPlaceholderImg, getMetaThumbnail, observeIntersectOnce } from './util';

const renderMap: { [T in MsgSegType]: (msg: IMsgSegment<T>) => HTMLElement | Promise<HTMLElement> } = {
  [MsgSegType.Text]: (msg) => h('pre', null, [msg.text]),
  /** @deprecated @todo P3 改为新seg:File */
  [MsgSegType.Image]: (msg) =>
    h('img', {
      src: msg.url,
      loading: 'lazy',
      width: msg.width,
      height: msg.height,
      style: `--img-ratio: ${(msg.width ?? Infinity) / (msg.height ?? 0)}`,
    }),
  /** @todo P3 MomotalkSFileElement */
  [MsgSegType.SFile]: (msg) => {
    if (supportedImageType.includes(msg.mime)) {
      return h('div', { class: 'media' }, [
        h('img', {
          $ref: (el) => {
            // 图片加载完成前放一个尺寸相同的空图片占位
            if (msg.meta?.height) {
              el.src = createPlaceholderImg(msg.meta.width, msg.meta.height);
            }
            const maxSize = getConfig('msg.autoloadSize');
            if ((msg.size ?? 0) > maxSize) {
              el.classList.add('thumbnail');
              observeIntersectOnce(el, () => {
                getMetaThumbnail(msg.url).then((url) => {
                  if (url) {
                    el.style.backgroundImage = `url('${url}')`;
                  }
                });
              });
              el.addEventListener(
                'click',
                () => {
                  el.classList.remove('thumbnail');
                  el.classList.add('thumbnail-loading');
                  const loadingProgressEl = h('div', { class: 'loading-progress' }, ['加载中...']);
                  el.after(loadingProgressEl);
                  decryptSFile(msg.url, msg.mime, {
                    onProgress: (e) => {
                      loadingProgressEl.textContent = `加载中... ${formatBytes(e.loaded)}/${formatBytes(e.total)}`;
                    },
                  }).then((blob) => {
                    loadingProgressEl.remove();
                    const [url, blobRef] = createAutoRevokeableObjectUrl(blob);
                    Object.assign(el, {
                      src: url,
                      _blobRef: blobRef,
                    });
                    el.classList.remove('thumbnail-loading');
                  });
                },
                { once: true },
              );
            } else {
              observeIntersectOnce(el, () => {
                decryptSFile(msg.url, msg.mime).then((blob) => {
                  const [url, blobRef] = createAutoRevokeableObjectUrl(blob);
                  el.src = url;
                  Object.assign(el, {
                    src: url,
                    _blobRef: blobRef,
                  });
                });
              });
            }
          },
        }),
      ]);
    }

    if (supportedVideoType.includes(msg.mime)) {
      /**
       * @todo P2 使用MediaSource边下边播
       *  const ms = new MediaSource();
       *  const [url, ref] = createAutoRevokeableObjectUrl(ms);
       *  ms.addEventListener('sourceopen', () => {
       *    const buffer = ms.addSourceBuffer(mime);
       *    buffer.appendBuffer(data)
       *  })
       */
      return h('div', { class: 'media' }, [
        h('video', {
          $ref: (el) => {
            if (msg.meta?.height) {
              el.poster = createPlaceholderImg(msg.meta.width, msg.meta.height);
            }
            const maxSize = getConfig('msg.autoloadSize');
            if ((msg.size ?? Infinity) > maxSize) {
              el.classList.add('thumbnail');
              observeIntersectOnce(el, () => {
                getMetaThumbnail(msg.url).then((url) => {
                  if (url) {
                    el.style.backgroundImage = `url('${url}')`;
                  }
                });
              });
              el.addEventListener(
                'click',
                (e) => {
                  e.stopPropagation();
                  el.classList.remove('thumbnail');
                  el.classList.add('thumbnail-loading');
                  const loadingProgressEl = h('div', { class: 'loading-progress' }, ['加载中...']);
                  el.after(loadingProgressEl);
                  decryptSFile(msg.url, msg.mime, {
                    onProgress: (ev) => {
                      loadingProgressEl.textContent = `加载中... ${formatBytes(ev.loaded)}/${formatBytes(ev.total)}`;
                    },
                  }).then((blob) => {
                    loadingProgressEl.remove();
                    const [url, blobRef] = createAutoRevokeableObjectUrl(blob);
                    Object.assign(el, {
                      src: url,
                      controls: true,
                      _blobRef: blobRef,
                    });
                    el.classList.remove('thumbnail-loading');
                  });
                },
                { once: true },
              );
            } else {
              observeIntersectOnce(el, () => {
                decryptSFile(msg.url, msg.mime).then((blob) => {
                  const [url, blobRef] = createAutoRevokeableObjectUrl(blob);
                  Object.assign(el, {
                    src: url,
                    controls: true,
                    _blobRef: blobRef,
                  });
                });
              });
            }
          },
        }),
      ]);
    }

    return h(new MomotalkFileMessageElement(), { src: msg.url, mime: msg.mime, name: msg.name });
  },
};

export default function msgRender(msg: IMsgSegment) {
  return renderMap[msg.type](msg as never);
}
