import { OSSFMeta } from '@/common/upload';

export function createPlaceholderImg(width?: number, height?: number) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`,
  )}`;
}

export const intersectionObs = new IntersectionObserver((e) => {
  e.forEach((it) => {
    if (!it.isIntersecting) return;
    it.target.dispatchEvent(new CustomEvent('intersect-view'));
  });
});

export function observeIntersectOnce(el: HTMLElement, cb: () => void) {
  intersectionObs.observe(el);
  el.addEventListener(
    'intersect-view',
    () => {
      cb();
      intersectionObs.unobserve(el);
    },
    { once: true },
  );
}

export async function getMetaThumbnail(url: string, signal?: AbortSignal) {
  const meta = await OSSFMeta(url, { signal });
  return meta?.get('X-Oss-Meta-Thumbnail') ?? null;
}
