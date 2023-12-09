import { FileUploadElement } from '@/components/file-upload';
import { h } from '@/utils/dom';

import { BaButtonElement } from '../../ba-button';
import style from './index.css?inline';
import { MomotalkEditorElement } from './momotalk-editor';
import type { MomotalkInputSubmitEventPayload } from './type';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

const dragOverListener = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
/**
 * momotalk 聊天输入框
 * ### event
 * - submit `MomotalkInputSubmitEventPayload` 发送消息,有图片等需要先进行异步处理的消息内容时为Promise类型
 */
export class MomotalkInputElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #editor: MomotalkEditorElement;

  #dropListener = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer?.files.length) return;
    const files = [...e.dataTransfer.files];
    this.#editor.insertSFile(...files);
  };

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#editor = h(new MomotalkEditorElement(), {
      class: 'reply-text',
      $ref: (el) => {
        el.addEventListener('submit', (e: CustomEvent<MomotalkInputSubmitEventPayload>) => {
          this.dispatchEvent(new CustomEvent('submit', { detail: e.detail }));
        });
      },
    });
    const content = h('div', null, [
      h('div', { class: 'reply-title' }, [
        h('p', null, ['回复']),
        h(
          new FileUploadElement(),
          {
            class: 'upload',
            title: '发送图片/文件',
            $ref: (el) => {
              el.addEventListener('change', async (e: CustomEvent<File[]>) => {
                const [file] = e.detail;
                el.value = [];
                this.#editor.insertSFile(file);
              });
            },
          },
          [h(new BaButtonElement(), null, ['⬆️'])],
        ),
        h(
          new BaButtonElement(),
          {
            $ref: (el) => {
              el.addEventListener('click', () => {
                this.#editor.submit();
              });
            },
          },
          ['发送'],
        ),
      ]),
      this.#editor,
    ]);
    this.#shadowRoot.appendChild(content);
  }

  connectedCallback() {
    this.addEventListener('drop', this.#dropListener);
    this.addEventListener('dragover', dragOverListener, { capture: true });
  }

  disconnectedCallback() {
    this.removeEventListener('drop', this.#dropListener);
    this.removeEventListener('dragover', dragOverListener, { capture: true });
  }
}

customElements.define('momotalk-input', MomotalkInputElement);
