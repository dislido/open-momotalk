import { h } from '@/utils/dom';

import { momotalkContext } from '../../momotalkContext';
import chatsImg from './chats.svg';
import style from './index.css?inline';
import studentImg from './student.svg';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

/**
 * momotalk 左侧tab
 *
 * event:
 * - `close`: 点击关闭按钮
 * - `heightChangeStart`: 组件高度开始从100%变化为标题栏高度
 */
export class LeftTabsElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #tabs: HTMLDivElement[];
  #unwatcher?: () => void;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#shadowRoot.append(
      ...(this.#tabs = [
        h('div', { 'data-key': 'chats', class: 'tab active' }, [h('img', { src: chatsImg })]),
        h('div', { 'data-key': 'students', class: 'tab' }, [h('img', { src: studentImg })]),
      ]),
    );
    this.addEventListener('click', (e) => {
      const target = e.composedPath()[0] as HTMLElement;
      if (target.dataset.key) momotalkContext.set('activeLeftTab', target.dataset.key as 'chats' | 'students');
    });
  }

  connectedCallback() {
    this.#unwatcher = momotalkContext.watch('activeLeftTab', (val, oldVal) => {
      this.#tabs.find((it) => it.dataset.key === oldVal)?.classList.remove('active');
      this.#tabs.find((it) => it.dataset.key === val)?.classList.add('active');
    });
  }

  disconnectedCallback() {
    this.#unwatcher?.();
  }
}

customElements.define('left-tabs', LeftTabsElement);
