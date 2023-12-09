import { h } from '@/utils/dom';

import style from './message-log-host.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * @todo P2 有历史记录的message窗口
 * @todo P3 log level
 * ### attribute
 * maxlength = 10
 */
export class MessageLogElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #messageListEl: HTMLDivElement;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#messageListEl = h('div', { class: 'message-list' }, []);
    this.#shadowRoot.appendChild(
      h('div', { class: 'container' }, [
        h('div', { class: 'toolbar' }, [
          h(
            'button',
            {
              $ref: (el) => {
                el.addEventListener('click', () => {
                  this.dispatchEvent(new CustomEvent('close'));
                });
              },
            },
            ['x'],
          ),
        ]),
        this.#messageListEl,
      ]),
    );
  }

  /** 添加一条消息 */
  log(content: string | Node) {
    const newItem = h('div', { class: 'message-item' }, [
      h(
        'div',
        {
          class: 'message-item-content',
        },
        [content],
      ),
    ]);

    this.#messageListEl.prepend(newItem);
    newItem.style.height = `${newItem.scrollHeight}px`;
    // const maxLength = +(this.getAttribute('maxlength') ?? '10');
    // const { children } = this.#messageListEl;
    // if (maxLength < children.length) children[children.length - 1].remove();
  }
}

customElements.define('message-log', MessageLogElement);
