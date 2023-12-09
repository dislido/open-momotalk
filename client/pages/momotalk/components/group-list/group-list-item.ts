import { fragment, h } from '@/utils/dom';

import { momotalkContext } from '../../momotalkContext';
import style from './group-list-item.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 群聊列表项
 * ### attr
 * - gid `string` 群id
 */
export class GroupListItemElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #watches: (() => void)[] = [];

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const gid = this.getAttribute('gid') ?? '';
    this.addEventListener('click', () => {
      momotalkContext.set('activeConversation', this.getAttribute('gid') ?? '');
    });
    const conversations = momotalkContext.get('conversations');
    const conversation = conversations.get(gid);
    if (!conversation) return;

    this.#shadowRoot.appendChild(
      fragment([
        h('img', { class: 'avatar', src: conversation.get('group').avatar }),
        h('div', { class: 'content' }, [
          h('div', { class: 'title' }, [conversation.get('group').name]),
          h(
            'div',
            {
              class: 'message',
              $ref: (el) => {
                this.#watches.push(
                  conversation.watch('lastMsgText', (text) => {
                    el.textContent = text ?? null;
                  }),
                );
              },
            },
            [''],
          ),
        ]),
        h('div', {
          class: 'unread',
          $ref: (el) => {
            this.#watches.push(
              conversation.watch('unread', (unread) => {
                el.setAttribute('data-unread', `${unread}`);
              }),
            );
          },
        }),
      ]),
    );

    this.#watches.push(
      momotalkContext.watch('activeConversation', (activeId) => {
        this.classList.toggle('active', activeId === gid);
        if (activeId === gid) {
          conversation.set('unread', 0);
        }
      }),
    );
  }

  disconnectedCallback() {
    this.#watches.forEach((it) => it());
  }
}

customElements.define('group-list-item', GroupListItemElement);
