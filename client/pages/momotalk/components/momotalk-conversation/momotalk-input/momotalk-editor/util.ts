import { MsgSegType } from '@/shared/types/momotalk';
import { h } from '@/utils/dom';

import { EditorSegmentElement } from './editor-segment';

/** @deprecated 使用`getMediaThumbnail` */
export function getMediaThemeColor(source: CanvasImageSource) {
  const canvasEl = h('canvas', { width: 1, height: 1 });
  const canvasCtx = canvasEl.getContext('2d');
  if (canvasCtx) {
    canvasCtx.imageSmoothingEnabled = true;
    canvasCtx.imageSmoothingQuality = 'high';
    canvasCtx.drawImage(source, 0, 0, 1, 1);
    const colorData = canvasCtx.getImageData(0, 0, 1, 1).data;
    const result = `#${[...colorData].map((it) => it.toString(16).padStart(2, '0')).join('')}`;
    return result.endsWith('ff') ? result.slice(0, -2) : result;
  }

  return '#0000';
}

const MAX_MEDIA_THUMBNAIL_SIDE = 24;
/** 获取媒体主题色和微型缩略图 */
export function getMediaThumbnail(source: CanvasImageSource, width: number, height: number) {
  const aspectRatio = width / height;
  const canvasSize: [number, number] =
    aspectRatio > 1
      ? [MAX_MEDIA_THUMBNAIL_SIDE, Math.round(MAX_MEDIA_THUMBNAIL_SIDE / aspectRatio)]
      : [Math.round(MAX_MEDIA_THUMBNAIL_SIDE * aspectRatio), MAX_MEDIA_THUMBNAIL_SIDE];
  const canvasEl = h('canvas', { width: canvasSize[0], height: canvasSize[1] });
  const canvasCtx = canvasEl.getContext('2d');
  if (canvasCtx) {
    canvasCtx.imageSmoothingEnabled = true;
    canvasCtx.imageSmoothingQuality = 'high';
    canvasCtx.drawImage(source, 0, 0, 1, 1);
    const themeColorData = canvasCtx.getImageData(0, 0, 1, 1).data;
    const themeColorResult = `#${[...themeColorData].map((it) => it.toString(16).padStart(2, '0')).join('')}`;
    const themeColor = themeColorResult.endsWith('ff') ? themeColorResult.slice(0, -2) : themeColorResult;

    let thumbDataResult: string;
    if (!canvasSize[0] || !canvasSize[1]) {
      thumbDataResult = '';
    } else {
      canvasCtx.drawImage(source, 0, 0, canvasSize[0], canvasSize[1]);
      thumbDataResult = canvasEl.toDataURL();
    }

    return { themeColor, thumbnail: thumbDataResult };
  }

  return { themeColor: '#0000', thumbnail: '' };
}

function isTextNode(el: Node): el is Text {
  return el.nodeType === Node.TEXT_NODE;
}

function isElementNode(el: Node): el is HTMLElement {
  return el.nodeType === Node.ELEMENT_NODE;
}

function isImgNode(el: Node): el is HTMLImageElement {
  return isElementNode(el) && el.tagName === 'IMG';
}

async function traversalHtml(root: HTMLElement): Promise<(string | EditorSegmentElement)[]> {
  const childs = [...root.childNodes];
  const resultPromises = childs.map(
    (it): Promise<null | string | EditorSegmentElement | (string | EditorSegmentElement)[]> => {
      if (isTextNode(it)) {
        return Promise.resolve(it.textContent);
      }
      if (!isElementNode(it)) return Promise.resolve(null);
      if (isImgNode(it)) {
        return new Promise<EditorSegmentElement | null>((resolve) => {
          if (!it.src) return resolve(null);
          fetch(it.src)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], blob.name, {
                type: blob.type,
              });
              return h(new EditorSegmentElement(), { type: MsgSegType.SFile, $ref: (el) => (el.data = file) });
            })
            .then(resolve)
            .catch(() => {
              // 直接忽略
            });
        });
      }

      if (it.childNodes.length) return traversalHtml(it);
      return Promise.resolve(null);
    },
  );

  const result = (await Promise.all(resultPromises)).flat();
  return result.filter((it): it is string | EditorSegmentElement => !!it);
}

export function transHtml(htmlStr: string) {
  const parser = new DOMParser();
  const html = parser.parseFromString(htmlStr, 'text/html');

  return traversalHtml(html.body);
}
