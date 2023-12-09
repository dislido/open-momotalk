import { h } from '@/utils/dom';

import style from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk文档窗口内容
 * ### prop
 * - items `{ tab: string; content: string }[]`
 */
export class MomotalkDocContentElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #tabs: HTMLDivElement;
  #content: HTMLDivElement;
  #activeItem?: HTMLDivElement;

  items: { tab: string; content: string }[] = [];

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#shadowRoot.appendChild(
      h('div', { class: 'main' }, [
        (this.#tabs = h('div', { class: 'tabs' })),
        (this.#content = h('div', { class: 'content' })),
      ]),
    );
  }

  connectedCallback() {
    // 渲染items
    this.items.forEach((it, index) => {
      this.#tabs.append(
        h(
          'div',
          {
            class: 'tab',
            $ref: (el) => {
              const setActive = () => {
                if (this.#activeItem === el) return;
                if (this.#activeItem) {
                  this.#activeItem.classList.remove('active');
                }
                this.#activeItem = el;
                el.classList.add('active');
                this.#content.innerHTML = it.content;
              };
              if (index === 0) setActive();
              el.addEventListener('click', setActive);
            },
          },
          [h('div', { class: 'tab-content' }, [it.tab])],
        ),
      );
    });
  }
}

customElements.define('momotalk-doc-content', MomotalkDocContentElement);
