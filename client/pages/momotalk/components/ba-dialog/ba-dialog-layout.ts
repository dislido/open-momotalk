import { fragment, h } from '@/utils/dom';

import style from './ba-dialog-layout.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * ba对话框
 * ### slot
 * - default 对话框内容
 * - title 标题栏内容
 *
 * ### event
 * - close 关闭对话框
 */
export class BaDialogLayoutElement extends HTMLElement {
  #shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#shadowRoot.appendChild(
      fragment([
        h('div', { class: 'titlebar' }, [
          h('div', { class: 'title-container' }, [h('slot', { name: 'title' })]),
          h(
            'div',
            {
              class: 'close',
              $ref: (el) => {
                el.addEventListener('click', () => {
                  this.dispatchEvent(new CustomEvent('close'));
                });
              },
            },
            ['×'],
          ),
        ]),
        h('div', { class: 'content' }, [h('slot')]),
      ]),
    );
  }
}

customElements.define('ba-dialog-layout', BaDialogLayoutElement);
