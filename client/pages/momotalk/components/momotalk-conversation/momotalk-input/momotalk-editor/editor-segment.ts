import { commonUploadEncrypted } from '@/common/upload';
import type { IMsgSegment } from '@/shared/types/momotalk';
import { MsgSegType } from '@/shared/types/momotalk';
import { createAutoRevokeableObjectUrl } from '@/utils/blob-gc';
import type { ObservableObject } from '@/utils/context';
import { h } from '@/utils/dom';

import { supportedImageType, supportedVideoType } from '../../../../constants';
import type { MomoText } from './MomoText';
import { getMediaThumbnail } from './util';

const renderMap: Record<string, (data: unknown) => Promise<HTMLElement | null>> = {
  async [`${MsgSegType.SFile}`](this: EditorSegmentElement, file: unknown) {
    if (!(file instanceof File)) return null;
    if (supportedImageType.includes(file.type)) {
      const buf = await file.arrayBuffer();
      const blob = new Blob([buf], { type: file.type });
      const [src, blobRef] = createAutoRevokeableObjectUrl(blob);
      this.objUrls.push(src);
      return h('img', {
        class: 'seg-img',
        src,
        $ref(el) {
          Object.assign(el, {
            _blobRef: blobRef,
          });
        },
      });
    }
    if (supportedVideoType.includes(file.type)) {
      const buf = await file.arrayBuffer();
      const blob = new Blob([buf], { type: file.type });
      const [src, blobRef] = createAutoRevokeableObjectUrl(blob);
      this.objUrls.push(src);
      return h('video', {
        class: 'seg-video',
        src,
        preload: 'auto',
        $ref(el) {
          Object.assign(el, {
            _blobRef: blobRef,
          });
        },
      });
    }
    return h('div', { class: 'seg-file' }, [
      h('div', { class: 'file-name' }, [file.name]),
      h('div', { class: 'file-mime' }, [file.type || '未知类型']),
    ]);
  },
  async [`${MsgSegType.Text}`](this: EditorSegmentElement, text: unknown) {
    if (typeof text !== 'string') return null;

    return h('span', { class: 'seg-text' }, [text]);
  },
};

interface ISegmentFileMeta {
  segmentMeta?: IMsgSegment<MsgSegType.SFile>['meta'];
  ossMeta?: Record<string, string>;
}
const MIN_THUMBNAIL_CALC_SIZE = 1024 ** 2;

/**
 * 编辑器中的消息内容块
 * render时若没有提供正确数据则会自动移除
 * ### 无shadowRoot
 * ### attr
 * - type `MsgSegType` 消息类型
 *
 * ### prop
 * - get msgSegment `IMsgSegment` 消息块对象
 */
export class EditorSegmentElement extends HTMLElement {
  data: unknown;
  objUrls: string[] = [];
  bindMomoText?: MomoText;

  #rendered = false;
  #fileMeta?: Promise<ISegmentFileMeta>;

  constructor() {
    super();
    this.setAttribute('contenteditable', 'false');
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.bindMomoText?.remove();
    this.objUrls.forEach((it) => URL.revokeObjectURL(it));
  }

  /** 发送前获取MsgSegment */
  async getSegment(options: {
    uploads: ObservableObject<{
      items: {
        name: string;
        total: number;
        loaded: number;
      }[];
    }>;
    signal?: AbortSignal;
  }): Promise<IMsgSegment | null> {
    const { uploads, signal } = options;
    const type = +(this.getAttribute('type') ?? NaN) as MsgSegType;
    if (Number.isNaN(type)) return null;
    if (type === MsgSegType.SFile) {
      const f = this.data as File;
      const progressData = {
        name: f.name,
        total: f.size,
        loaded: 0,
      };
      const items = uploads.get('items');
      uploads.set('items', items.concat([progressData]));

      let fileMeta: ISegmentFileMeta | undefined;
      const extraFormData: Record<string, string> = {};
      if (this.#fileMeta) {
        fileMeta = await this.#fileMeta;
        if (fileMeta.ossMeta) {
          Object.entries(fileMeta.ossMeta).forEach(([k, v]) => {
            extraFormData[`x-oss-meta-${k}`] = v;
          });
        }
      }

      return commonUploadEncrypted(f, {
        onProgress: (e) => {
          progressData.loaded = e.loaded;
          progressData.total = e.total;
          uploads.set('items', [...uploads.get('items')]);
        },
        signal,
        extraFormData,
      })
        .then<IMsgSegment<MsgSegType.SFile>>((url) => {
          const seg: IMsgSegment<MsgSegType.SFile> = {
            type: MsgSegType.SFile,
            url,
            name: f.name,
            mime: f.type,
            size: f.size,
          };
          if (fileMeta?.segmentMeta) seg.meta = fileMeta.segmentMeta;
          return seg;
        })
        .catch((err) => {
          if (err instanceof Error && err.name === 'AbortError') {
            return Promise.reject(err);
          }
          return Promise.reject(new Error(`文件上传失败:${f.name}(${err})`, { cause: err }));
        });
    }
    return null;
  }

  async render() {
    const type = this.getAttribute('type');
    if (!type || !(type in renderMap)) return this.remove();
    if (this.#rendered) return;
    this.#rendered = true;
    const el = await renderMap[type].call(this, this.data);
    if (el instanceof HTMLImageElement) {
      this.#fileMeta = new Promise((resolve) => {
        el.addEventListener('load', () => {
          const img = new Image();
          img.addEventListener('load', () => {
            const { thumbnail, themeColor } = getMediaThumbnail(el, el.width, el.height);
            resolve({
              segmentMeta: { width: img.width, height: img.height, themeColor },
              ossMeta: thumbnail && (this.data as File).size > MIN_THUMBNAIL_CALC_SIZE ? { thumbnail } : undefined,
            });
          });
          img.src = el.src;
        });
      });
    } else if (el instanceof HTMLVideoElement) {
      this.#fileMeta = new Promise((resolve) => {
        el.addEventListener(
          'loadeddata',
          () => {
            const { thumbnail, themeColor } = getMediaThumbnail(el, el.videoWidth, el.videoHeight);
            resolve({
              segmentMeta: { width: el.videoWidth, height: el.videoHeight, themeColor },
              ossMeta: thumbnail && (this.data as File).size > MIN_THUMBNAIL_CALC_SIZE ? { thumbnail } : undefined,
            });
          },
          { once: true },
        );
      });
    }
    if (!el) return this.remove();
    this.appendChild(el);
  }
}

customElements.define('editor-segment', EditorSegmentElement);
