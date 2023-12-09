import { globalContext } from '@/common/globalContext';
import { type IMsgSegment, MsgSegType } from '@/shared/types/momotalk';
import { fragment, h, toBooleanAttr } from '@/utils/dom';
import { formatBytes } from '@/utils/upload';

import style from './index.css?inline';
import msgRender from './msgRender';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 消息
 * ### attr
 * - content `IMsgSegment[]` 消息内容
 * - avatar `string` 发送人头像url
 * - nickname `string` 发送人昵称
 * - uid `string` 发送人id
 * - sending `boolean` 发送中消息
 * ### slot
 * - sending-side 发送中消息气泡左边
 */
export class MomotalkMessageElement extends HTMLElement {
  #shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uid = this.getAttribute('uid');
    const avatar = this.getAttribute('avatar');
    const sending = toBooleanAttr(this.getAttribute('sending')) ?? false;
    const content = JSON.parse(this.getAttribute('content') ?? '[]') as IMsgSegment[];

    if (+(uid ?? 0) === globalContext.get('user')?.id) {
      this.classList.toggle('self-msg', true);
    }
    this.#shadowRoot.appendChild(
      fragment([
        h('img', { class: 'avatar', src: avatar ?? undefined }),
        h('div', { class: 'content' }, [
          !!avatar && h('div', { class: 'sender-name' }, [this.getAttribute('nickname')]),
          sending &&
            h('div', { class: 'my-sending' }, [
              h('slot', { name: 'sending-side' }),
              h('div', { class: 'bubble' }, [h('div', { class: 'sending' }, [h('div', { class: 'sending-dot' })])]),
            ]),
          ...content.map((it) => {
            const suspendEl = h('div', { class: 'sending' }, [h('div', { class: 'sending-dot' })]);
            Promise.resolve(msgRender(it))
              .then((el) => {
                suspendEl.replaceWith(el);
              })
              .catch(() => {
                /** @todo P2 展示错误消息 */
                suspendEl.remove();
              });

            const thumbnailText: { style?: string } = {};
            if (it.type === MsgSegType.SFile) {
              thumbnailText.style = `--thumbnail-content: '点击加载 ${it.name}(${
                it.size ? formatBytes(it.size) : '未知大小'
              })';--media-theme-color: ${it.meta?.themeColor ?? '#fff0'}`;
            }
            return h('div', { class: 'bubble', ...thumbnailText }, [suspendEl]);
          }),
        ]),
      ]),
    );
  }

  disconnectedCallback() {
    [...this.#shadowRoot.children].forEach((it) => {
      if (it.tagName !== 'STYLE') it.remove();
    });
  }
}

customElements.define('momotalk-message', MomotalkMessageElement);
