import { fragment, h } from '@/utils/dom';

import style from './member-list-item.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 群成员列表项
 * ### attr
 * - name `string` 昵称
 * - avatar `string` 头像
 */
export class MemberListItemElement extends HTMLElement {
  #shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const name = this.getAttribute('name') ?? '';
    const avatar = this.getAttribute('avatar') ?? '';

    this.#shadowRoot.appendChild(
      fragment([
        h('img', { class: 'avatar', src: avatar }),
        h('div', { class: 'content' }, [h('div', { class: 'title' }, [name])]),
      ]),
    );
  }
}

customElements.define('member-list-item', MemberListItemElement);
