import { h } from '@/utils/dom';

import { getGroupMembers } from '../../api';
import { momotalkContext } from '../../momotalkContext';
import style from './index.css?inline';
import html from './index.html?template';
import { MemberListItemElement } from './member-list-item';

const template = document.createElement('template');
template.innerHTML = `${html}<style>${style}</style>`;

export class MemberListElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #gid?: string;
  #cachedGid?: string;
  #ac?: AbortController;
  #listEl: HTMLDivElement = h('div', { class: 'list' });
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.append(template.content.cloneNode(true), this.#listEl);

    momotalkContext.watch('activeLeftTab', (val) => {
      if (val !== 'students') {
        this.style.display = 'none';
        return;
      }

      this.style.display = 'flex';
      if (!this.#gid || this.#cachedGid === this.#gid) return;
      this.#listEl.remove();
      if (this.#ac) this.#ac.abort();
      this.#ac = new AbortController();
      getGroupMembers({ gid: this.#gid }, { signal: this.#ac.signal }).then((data) => {
        this.#ac = undefined;
        this.#cachedGid = this.#gid;
        const newListEl = h(
          'div',
          { class: 'list' },
          data.map((it) => h(new MemberListItemElement(), { name: it.nickname, avatar: it.avatar })),
        );
        this.#shadowRoot.append(newListEl);
        this.#listEl = newListEl;
      });
    });
    momotalkContext.watch('activeConversation', (val) => {
      this.#gid = val;
    });
  }
}

customElements.define('member-list', MemberListElement);
