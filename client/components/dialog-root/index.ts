import './theme.css';

import { fragment, h, setAttributes, toBooleanAttr } from '@/utils/dom';

import style from './index.css?inline';
import html from './index.html?template';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>${html}`;

const validTypes = ['center', 'top', 'bottom', 'left', 'right'];

/**
 * 弹窗组件
 *
 * `<dialog-root open type="center">dialog content</dialog-root>`
 * ### attr
 * - open 是否打开 = false
 * - type 弹出位置 'top' | 'bottom' | 'left' | 'right' | 'center' = 'center'
 * - animation-duration 开启/关闭动画持续时间 = '200'
 * - mask 是否展示mask = true
 * - mask-closable 点击mask关闭弹窗 = true
 * ### event
 * - close 关闭
 * - closed 关闭完成
 * - open 打开
 * - opened 打开完成
 * ### css part
 * - mask
 * - content
 * - container
 * ### css var
 * - --dialog-z-index = 1000
 * - --dialog-background = #fff
 */
export class DialogRootElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #dialogRoot: HTMLDivElement;
  #mask: HTMLDivElement;
  #animationTimer = 0;

  static get observedAttributes() {
    return ['open', 'animation-duration', 'type'];
  }

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#dialogRoot = this.#shadowRoot.getElementById('dialog-root') as HTMLDivElement;
    this.#mask = this.#shadowRoot.getElementById('mask') as HTMLDivElement;
    this.#mask.addEventListener('click', () => {
      if (!(toBooleanAttr(this.getAttribute('mask-closable')) ?? true)) return;
      this.removeAttribute('open');
    });
    this.#dialogRoot.remove();
  }

  connectedCallback() {
    if (!this.hasAttribute('type')) {
      this.setAttribute('type', 'center');
    }
  }

  #open() {
    this.#shadowRoot.appendChild(this.#dialogRoot);
    this.classList.add('opening');
    this.dispatchEvent(new CustomEvent('open'));
    window.clearTimeout(this.#animationTimer);
    this.#animationTimer = window.setTimeout(() => {
      this.classList.remove('opening');
      this.dispatchEvent(new CustomEvent('opened'));
    }, +(this.getAttribute('animation-duration') ?? 200));
    if (this.getAttribute('mask') !== 'false') {
      document.body.style.overflow = 'hidden';
    }
  }

  #close() {
    this.classList.add('closing');
    this.dispatchEvent(new CustomEvent('close'));
    window.clearTimeout(this.#animationTimer);
    this.#animationTimer = window.setTimeout(() => {
      this.#dialogRoot.remove();
      this.classList.remove('closing');
      document.body.style.overflow = '';
      this.dispatchEvent(new CustomEvent('closed'));
    }, +(this.getAttribute('animation-duration') ?? 200));
  }

  /**
   * 打开窗口
   * @param fromEl todo: 从指定元素打开窗口,仅type=center时有效
   */
  open(fromEl?: HTMLElement) {
    if (fromEl) {
      const rect = fromEl.getBoundingClientRect();
      rect.toJSON();
    }

    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'open') {
      if (newValue === 'true' || newValue === '') {
        this.#open();
      } else {
        this.#close();
      }
      return;
    }

    if (name === 'animation-duration') {
      this.#dialogRoot.setAttribute('style', `--animation-duration: ${newValue ?? 200}ms`);
      return;
    }

    if (name === 'type') {
      if (!newValue || !validTypes.includes(newValue)) {
        this.setAttribute('type', 'center');
      }
    }
  }
}

customElements.define('dialog-root', DialogRootElement);

export interface IOpenDialogOptions {
  content: string | Node;
  type?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  animationDuration?: number;
  maskClosable?: boolean;
  mask?: boolean;
  class?: string;
}

/** 打开对话框 */
export function openDialog(options: IOpenDialogOptions) {
  const dialog = document.createElement('dialog-root') as DialogRootElement;

  dialog.append(options.content);

  setAttributes(dialog, {
    type: options.type,
    'animation-duration': options.animationDuration,
    'mask-closable': options.maskClosable,
    mask: options.mask,
    class: options.class,
  });
  dialog.addEventListener('closed', () => {
    dialog.remove();
  });
  dialog.hasAttribute('open');
  document.body.append(dialog);
  dialog.open();
  return dialog;
}

export function confirm({
  title,
  content,
  footer,
  onConfirm,
  onCancel,
  ...options
}: IOpenDialogOptions & {
  title?: string | Node;
  content?: string | Node;
  footer?: (string | Node)[];
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}) {
  return new Promise<boolean>((resolve) => {
    const dialog = openDialog({
      ...options,
      class: 'dl-dialog dl-dialog-confirm',
      content: fragment([
        h('div', { class: 'title' }, [title ?? '确认']),
        h('div', { class: 'content' }, [content]),
        h(
          'div',
          { class: 'footer' },
          footer ?? [
            h(
              'button',
              {
                $ref(el) {
                  el.addEventListener('click', async () => {
                    await onConfirm?.();
                    resolve(true);
                    dialog.close();
                  });
                },
              },
              ['确认'],
            ),
            h(
              'button',
              {
                $ref(el) {
                  el.addEventListener('click', async () => {
                    await onCancel?.();
                    resolve(false);
                    dialog.close();
                  });
                },
              },
              ['取消'],
            ),
          ],
        ),
      ]),
    });
    dialog.addEventListener('close', () => resolve(false));
  });
}
