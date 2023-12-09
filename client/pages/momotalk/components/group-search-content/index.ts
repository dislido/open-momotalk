import { h } from '@/utils/dom';

import { findGroup, joinGroup } from '../../api';
import { momotalkContext } from '../../momotalkContext';
import { BaButtonElement } from '../ba-button';
import style from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

export class GroupSearchContentElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #findGroupEl?: HTMLDivElement;
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#shadowRoot.appendChild(
      h(
        'form',
        {
          class: 'search-group-field',
          $ref: (el) => {
            el.addEventListener('submit', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const formData = new FormData(el, e.submitter);
              if (el.hasAttribute('data-loading')) return;
              el.setAttribute('data-loading', '');
              try {
                const group = await findGroup({
                  gid: formData.get('gid')?.toString() ?? '',
                });
                if (!group) {
                  this.#findGroupEl?.remove();
                  this.#findGroupEl = undefined;
                  return;
                }

                this.#findGroupEl?.remove();
                this.#findGroupEl = h('div', { class: 'group-card' }, [
                  h('img', { class: 'avatar', src: group.avatar }),
                  h('div', {}, [group.name]),
                  momotalkContext.get('conversations').get(group.gid)
                    ? h('div', { class: 'group-joined' }, ['已加入'])
                    : h(
                        new BaButtonElement(),
                        {
                          $ref: (btn) => {
                            btn.addEventListener('click', async () => {
                              const joinedGroup = await joinGroup({ gid: group.gid });
                              const groupList = momotalkContext.get('groupList');
                              if (groupList.some((it) => it.gid === group.gid)) {
                                this.dispatchEvent(new CustomEvent('close'));
                                momotalkContext.set('activeConversation', group.gid);
                                return;
                              }
                              momotalkContext.set('groupList', groupList.concat([joinedGroup]));
                              momotalkContext.set('activeConversation', group.gid);
                              this.dispatchEvent(new CustomEvent('close'));
                            });
                          },
                        },
                        ['加入'],
                      ),
                ]);
                this.#shadowRoot.append(this.#findGroupEl);
              } finally {
                el.removeAttribute('data-loading');
              }
            });
          },
        },
        [
          h('input', { class: 'search-group-input', name: 'gid', placeholder: '输入群id' }),
          h(new BaButtonElement(), { type: 'submit' }, ['🔍']),
        ],
      ),
    );
  }
}

customElements.define('group-search-content', GroupSearchContentElement);
