import { h } from '@/utils/dom';

import { getGroupList } from '../../api';
import { momotalkContext } from '../../momotalkContext';
import { GroupListItemElement } from './group-list-item';
import style from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 群聊列表
 */
export class GroupListElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #groupElMap = new Map<string, GroupListItemElement>();
  #groupListEl = h('div', { class: 'group-list' });

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));

    momotalkContext.watch('ws', async (ws) => {
      if (!ws) return;
      const gl = await getGroupList();
      momotalkContext.set('groupList', gl);
    });

    this.#shadowRoot.appendChild(this.#groupListEl);
    momotalkContext.watch('activeConversation', (newId, oldId) => {
      [...this.#groupListEl.children].forEach((it) => {
        if (it.tagName !== 'DIV') return;
        const gid = it.getAttribute('data-gid') ?? '';
        if (gid === newId) it.classList.toggle('talk-list-item-active', true);
        else if (gid === oldId) it.classList.toggle('talk-list-item-active', false);
      });
    });
  }

  connectedCallback() {
    momotalkContext.watch('groupList', (list) => {
      /** @todo P2 更新缓存群信息 */
      list.forEach((it) => {
        const item = h(new GroupListItemElement(), {
          gid: it.gid,
        });
        if (this.#groupElMap.has(it.gid)) {
          return;
        }
        this.#groupElMap.set(it.gid, item);
        this.#groupListEl.appendChild(item);
      });
    });
  }
}

customElements.define('group-list', GroupListElement);
