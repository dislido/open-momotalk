import type { IFetchProgress } from '@/common/upload';
import { decryptSFile } from '@/common/upload';
import showMessage from '@/components/message';
import { h } from '@/utils/dom';
import { formatBytes } from '@/utils/upload';

import { BaButtonElement } from '../../../ba-button';
import style from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk文件下载消息
 * ### attr
 * - src 文件url
 * - mime 文件mimetype
 * - name 文件名
 *
 * ### event
 * - download 点击下载按钮
 * - cancel 点击取消按钮
 * - progress `IFetchProgress` 下载进度变更
 * - done 下载完成
 */
export class MomotalkFileMessageElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #containerEl: HTMLDivElement;
  #fileNameEl: HTMLDivElement;
  #fileMimeEl: HTMLDivElement;
  #downloadBtnEl: BaButtonElement;
  #abortController?: AbortController;

  #downloaded?: File;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#fileNameEl = h('div', { class: 'file-name' });
    this.#fileMimeEl = h('div', { class: 'file-mime' });
    this.#downloadBtnEl = h(
      new BaButtonElement(),
      {
        class: 'download-btn',
        'data-state': 'download',
        $ref: (el) => {
          el.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent(el.dataset.state ?? 'download'));
          });

          this.addEventListener('download', () => {
            el.textContent = '取消';
            el.setAttribute('data-state', 'cancel');

            const src = this.getAttribute('src') ?? '';
            const mime = this.getAttribute('mime') ?? '*/*';
            const name = this.getAttribute('name') ?? '文件';
            this.#abortController = new AbortController();
            decryptSFile(src, mime, {
              onProgress: (prog) => {
                this.dispatchEvent(new CustomEvent('progress', { detail: prog }));
              },
              fetchOptions: {
                signal: this.#abortController.signal,
              },
            })
              .then((blob) => {
                const file = new File([blob], name, {
                  type: mime,
                });
                this.#downloaded = file;
                this.dispatchEvent(new CustomEvent('done'));
              })
              .catch((e) => {
                if (e instanceof DOMException && e.name === 'AbortError') {
                  return;
                }
                showMessage(`${e}`);
              });
          });

          this.addEventListener('cancel', () => {
            el.textContent = '下载';
            el.setAttribute('data-state', 'download');
            this.#abortController?.abort();
          });

          this.addEventListener('done', () => {
            el.textContent = '已下载';
            el.setAttribute('data-state', 'done');
          });
        },
      },
      ['下载'],
    );
    this.#containerEl = h('div', { class: 'container' }, [
      h('div', { class: 'file-detail' }, [this.#fileNameEl, this.#fileMimeEl]),
      this.#downloadBtnEl,
    ]);
    this.#shadowRoot.appendChild(this.#containerEl);
    this.#shadowRoot.appendChild(
      h(
        'div',
        {
          class: 'progress',
          $ref: (el) => {
            this.addEventListener('progress', (e: CustomEvent<IFetchProgress>) => {
              el.textContent = `${formatBytes(e.detail.loaded)}/${formatBytes(e.detail.total)}`;
            });
            this.addEventListener('cancel', () => {
              el.textContent = '';
            });
          },
        },
        [],
      ),
    );

    this.addEventListener('done', () => {
      if (!this.#downloaded) return;
      const name = this.getAttribute('name') ?? '文件';
      const url = URL.createObjectURL(this.#downloaded);
      const downloadEl = h('a', { href: url, download: name, class: 'tmp-link' });
      this.#shadowRoot.append(downloadEl);
      downloadEl.click();
      downloadEl.remove();
      URL.revokeObjectURL(url);
    });
  }
  connectedCallback() {
    this.#fileNameEl.textContent = this.getAttribute('name') ?? '';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    this.#fileMimeEl.textContent = this.getAttribute('mime') || '未知类型';
  }
}

customElements.define('momotalk-file-message', MomotalkFileMessageElement);
