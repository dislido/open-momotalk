import { h } from '@/utils/dom';

import style from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 按钮
 *
 * ### attr
 * - `type` `string = 'submit'` 按钮类型, `'submit' | 'button' | 'reset'`
 *
 * ### part
 * - `bg` 按钮背景
 *
 * ### slot
 * - `default` 按钮内容
 */
export class BaButtonElement extends HTMLElement {
  static formAssociated = true;
  #shadowRoot: ShadowRoot;
  #internals: ElementInternals;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#shadowRoot.appendChild(h('div', { class: 'button-bg', part: 'bg' }, []));
    this.#shadowRoot.appendChild(h('slot', null, []));
  }

  connectedCallback() {
    this.addEventListener('click', () => {
      const type = this.getAttribute('type') ?? 'submit';
      if (type === 'submit') this.#internals.form?.requestSubmit();
      if (type === 'reset') this.#internals.form?.reset();
    });
  }
}

customElements.define('ba-button', BaButtonElement);
