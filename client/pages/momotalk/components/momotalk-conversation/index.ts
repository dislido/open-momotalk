import { globalContext } from '@/common/globalContext';
import showMessage from '@/components/message';
import type { IMomotalkMsg } from '@/shared/types/momotalk';
import { MomotalkWsReqType, MomotalkWsResType } from '@/shared/types/momotalk';
import { h } from '@/utils/dom';
import { formatBytes } from '@/utils/upload';

import { getGroupMsgList } from '../../api';
import { momotalkContext } from '../../momotalkContext';
import { msgStringify } from '../../utils/message';
import { BaButtonElement } from '../ba-button';
import style from './index.css?inline';
import { MomotalkInputElement } from './momotalk-input';
import type { MomotalkInputSubmitEventPayload } from './momotalk-input/type';
import { MomotalkMessageElement } from './momotalk-message';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 会话窗口
 */
export class MomotalkConversationElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #content: HTMLDivElement;
  #msgList?: HTMLDivElement;
  #sending: HTMLDivElement;
  #activeConversation?: string;
  #watches: (() => void)[] = [];
  #loadingPage = false;
  #pageEnd = false;

  #scrollBottom = 0;
  #lastScrollHeight = 0;
  #ro = new ResizeObserver(() => {
    this.scrollTop = this.scrollHeight - this.#scrollBottom;
    this.#lastScrollHeight = this.scrollHeight;
  });

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#content = h('div', { class: 'content' });
    this.#shadowRoot.appendChild(this.#content);
    this.#sending = h('div', { class: 'sending' }, []);

    this.addEventListener(
      'scroll',
      () => {
        if (this.scrollTop < 10) this.nextPage();
        setTimeout(() => {
          if (this.#lastScrollHeight !== this.scrollHeight) return; // 阻止由resize触发的scroll事件
          this.#lastScrollHeight = this.scrollHeight;
          this.#scrollBottom = this.scrollHeight - this.scrollTop;
        }, 0);
      },
      { passive: true },
    );
  }

  connectedCallback() {
    this.#watches.push(
      momotalkContext.watch('activeConversation', (gid) => {
        this.#activeConversation = gid;
        this.#pageEnd = false;
        if (!gid) {
          const newContent = h('div', { class: 'content none' }, ['请选择学生。']);
          this.#content.replaceWith(newContent);
          this.#content = newContent;
        } else {
          this.#scrollBottom = 0;
          this.#msgList = h('div', { class: 'message-list' }, []);
          const newContent = h('div', { class: 'content' }, [
            this.#msgList,
            this.#sending,
            h(new MomotalkInputElement(), {
              $ref: (el) => {
                el.addEventListener('submit', async (e: CustomEvent<MomotalkInputSubmitEventPayload>) => {
                  this.send(e.detail);
                });
              },
            }),
          ]);
          this.#ro.unobserve(this.#content);
          this.#content.replaceWith(newContent);

          this.#content = newContent;
          this.#ro.observe(this.#content);

          const conversations = momotalkContext.get('conversations');
          const conversation = conversations.get(gid);
          if (!conversation) return;
          const msgList = conversation.get('msgList');
          if (msgList.length === 0) {
            this.#loadingPage = true;
            getGroupMsgList({ gid })
              .then((it) => {
                const list = it.reverse();
                if (list.length < 20) this.#pageEnd = true;

                conversation.set('msgList', list.concat(conversation.get('msgList')));
                const lastMsg = conversation.get('msgList').at(-1);
                conversation.set('lastMsgText', lastMsg ? msgStringify(lastMsg.content) : '');
                this.unshift(...list);
                this.scrollTop = this.scrollHeight;
              })
              .finally(() => {
                this.#loadingPage = false;
              });
          }
          this.push(...conversation.get('msgList'));
        }
      }),
    );
    this.#watches.push(
      momotalkContext.watch('ws', (ws) => {
        if (!ws) return;
        ws.on(MomotalkWsResType.ReceiveGroupMsg, (data) => {
          if (data.gid === this.#activeConversation) {
            this.push(data);
          }
        });
        return { removeListener: true };
      }),
    );
  }

  disconnectedCallback() {
    this.#watches.forEach((it) => it());
    this.#ro.disconnect();
  }

  async send(msg: MomotalkInputSubmitEventPayload) {
    const gid = momotalkContext.get('activeConversation');
    if (!gid) return;
    const progressText = new Text('');
    const cancelButton = h(
      new BaButtonElement(),
      {
        class: 'send-cancel-btn',
        $ref: (el) => {
          el.addEventListener('click', () => {
            msg.abortController.abort();
          });
        },
      },
      ['❌'],
    );
    const progress = h('div', { slot: 'sending-side', class: 'msg-send-progress' }, [progressText, cancelButton]);
    const loadingMsg = h(new MomotalkMessageElement(), { uid: globalContext.get('user')?.id, sending: true }, [
      progress,
    ]);
    const unListen = msg.progress.watch('items', (items) => {
      if (!items.length) return;
      let total = 0;
      let loaded = 0;
      items.forEach((it) => {
        total += it.total;
        loaded += it.loaded;
      });
      progressText.textContent = `${formatBytes(loaded)}/${formatBytes(total)}`;
    });
    this.#sending.appendChild(loadingMsg);
    const shouldScroll = this.scrollHeight - this.clientHeight - this.scrollTop < 100;
    if (shouldScroll) {
      this.scrollTo({ top: this.scrollHeight });
    }
    try {
      const content = await msg.data;
      await momotalkContext.get('ws')?.call(MomotalkWsReqType.SendGroupMsg, {
        content,
        gid,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        showMessage('已取消发送');
      } else {
        showMessage(`发送消息失败: ${err}`);
      }
    } finally {
      loadingMsg.remove();
      unListen();
    }
  }

  push(...msgs: IMomotalkMsg[]) {
    const msgList = this.#msgList;
    if (!msgList) return;

    const shouldScroll = this.scrollHeight - this.clientHeight - this.scrollTop < 100;

    msgList.append(
      ...msgs.map((msg) =>
        h(new MomotalkMessageElement(), {
          uid: msg.sender.id,
          content: JSON.stringify(msg.content),
          avatar: msg.sender.avatar,
          nickname: msg.sender.nickname,
        }),
      ),
    );

    if (shouldScroll) {
      this.scrollTo({ top: this.scrollHeight });
    }
  }

  unshift(...msgs: IMomotalkMsg[]) {
    const msgList = this.#msgList;
    if (!msgList) return;

    msgList.prepend(
      ...msgs.map((msg) =>
        h(new MomotalkMessageElement(), {
          uid: msg.sender.id,
          content: JSON.stringify(msg.content),
          avatar: msg.sender.avatar,
          nickname: msg.sender.nickname,
        }),
      ),
    );
  }

  async nextPage() {
    if (this.#pageEnd || this.#loadingPage) return;
    const gid = momotalkContext.get('activeConversation');
    if (!gid) return;
    const conversation = momotalkContext.get('conversations').get(gid);
    if (!conversation) return;
    const msgList = conversation.get('msgList');
    this.#loadingPage = true;
    try {
      const data = await getGroupMsgList({ gid, cursor: msgList.length > 0 ? msgList[0].id : undefined });
      const list = data.reverse();
      if (list.length < 20) this.#pageEnd = true;
      conversation.set('msgList', list.concat(conversation.get('msgList')));
      this.unshift(...list);
    } finally {
      this.#loadingPage = false;
    }
  }
}

customElements.define('momotalk-conversation', MomotalkConversationElement);
