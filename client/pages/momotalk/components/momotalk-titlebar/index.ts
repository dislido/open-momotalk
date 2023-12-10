import { globalContext } from '@/common/globalContext';
import { openUserDialog } from '@/components/user-dialog';
import { isMac } from '@/utils/env';
import { sleep, waitAnimation } from '@/utils/transition';

import { openMomotalkDoc } from '../../doc';
import { momotalkContext } from '../../momotalkContext';
import closeIconImg from './close-icon.svg';
import style from './index.css?inline';
import html from './index.html?template';
import momotalkIconImg from './momotalk-icon.svg';
import momotalkTextImg from './momotalk-text.svg';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>${html}`;

function closeMomotalk() {
  if (window.history.length > 1) window.history.back();
  else window.location.replace('/');
}

function showLogin() {
  const dialog = openUserDialog();
  dialog.classList.add('app-region-no-drag');
  dialog.setAttribute('mask-closable', 'false');
  dialog.addEventListener('close', () => {
    const user = globalContext.get('user');
    if (!user) {
      closeMomotalk();
    }
  });
}

/**
 * momotalk titlebar
 *
 * event:
 * - `close`: 点击关闭按钮
 * - `heightChangeStart`: 组件高度开始从100%变化为标题栏高度
 */
export class MomotalkTitlebarElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #momotalkIcon: HTMLImageElement;
  #momotalkText: HTMLImageElement;
  #closeIcon: HTMLImageElement;
  #content: HTMLDivElement;

  checkPwawnd = () => {
    if (window.innerHeight === window.outerHeight) {
      this.style.paddingLeft = '88px';
    } else {
      this.style.paddingLeft = '';
    }
  };

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#content = this.#shadowRoot.querySelector<HTMLImageElement>('[part=content]')!;
    this.#momotalkIcon = this.#shadowRoot.querySelector<HTMLImageElement>('.momotalk-icon')!;
    this.#momotalkIcon.src = momotalkIconImg;
    this.#momotalkText = this.#shadowRoot.querySelector<HTMLImageElement>('.momotalk-text')!;
    this.#momotalkText.src = momotalkTextImg;
    this.#closeIcon = this.#shadowRoot.querySelector<HTMLImageElement>('.close-icon')!;
    this.#closeIcon.src = closeIconImg;
    this.#closeIcon.style.display = 'none';
    this.#content.className = 'titlebar-login';
    this.#closeIcon.addEventListener('click', closeMomotalk);
    const docButton = this.#shadowRoot.querySelector<HTMLDivElement>('.momotalk-doc-btn')!;
    docButton.addEventListener('click', openMomotalkDoc);
  }

  async connectedCallback() {
    if (isMac) {
      window.addEventListener('resize', this.checkPwawnd, { passive: true });
      this.checkPwawnd();
    }
    const fadeinAnimateEv = await waitAnimation(
      this.#content.animate(
        [
          {
            filter: 'opacity(0)',
            transform: 'scale(0.5)',
          },

          {
            filter: 'opacity(0.8)',
            transform: 'scale(1.1)',
            offset: 0.8,
          },
          {
            filter: 'opacity(1)',
            transform: 'scale(1)',
          },
        ],
        { duration: 350, fill: 'forwards' },
      ),
    );
    fadeinAnimateEv.target.cancel();

    await new Promise((resolve) => {
      if (!window.localStorage.getItem('jwt')) {
        showLogin();
      } else {
        globalContext.watch('user', (val) => {
          if (val === undefined) return;
          if (val === null) {
            showLogin();
          }
          return {
            removeListener: true,
          };
        });
      }
      momotalkContext.watch('ws', (ws) => {
        if (ws) {
          resolve(true);
          return {
            removeListener: true,
          };
        }
      });
    });

    const fadeoutAnimateEv = await waitAnimation(
      this.#content.animate([{ filter: 'opacity(1)' }, { filter: 'opacity(0)' }], {
        duration: 350,
        fill: 'forwards',
      }),
    );
    this.#content.className = 'titlebar-title';
    this.#closeIcon.style.display = '';

    this.dispatchEvent(new CustomEvent('heightChangeStart'));
    this.animate([{ height: '100%' }, { height: '40px' }], { duration: 350, fill: 'forwards', easing: 'ease-out' });
    await sleep(200);
    fadeoutAnimateEv.target.cancel();
    this.#content.animate([{ top: '8px' }, { top: 0 }], { duration: 300, fill: 'forwards' });
    this.#momotalkIcon.addEventListener('click', () => {
      const userDialog = openUserDialog();
      userDialog.addEventListener('logout', () => location.reload());
    });
  }
}

customElements.define('momotalk-titlebar', MomotalkTitlebarElement);
