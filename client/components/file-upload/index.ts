import { toBooleanAttr } from '@/utils/dom';
import { formatBytes } from '@/utils/upload';

import showMessage from '../message';
import style from './index.css?inline';
import html from './index.html?template';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>${html}`;

export enum FileUploadErrorCode {
  /** 选择文件大小超过最大限制 */
  MAX_SIZE_EXCEED = 1,
  /** 请求上传信息失败 */
  UPLOAD_REQUEST_ERROR = 2,
  /** 上传OSS失败 */
  UPLOAD_OSS_ERROR = 3,
}

/** 默认最大文件大小, 5G */
const DEFAULT_MAX_SIZE = 5368709120;

/**
 * 文件上传表单控件
 *
 * ### slot
 * - default 上传按钮内容
 *
 * ### attribute
 * - multiple 多选 = false
 * - accept 可接受的文件类型 只支持Content-Type格式 = '*'
 * - name 表单控件name
 * - max-size 最大文件大小(字节)
 *
 * ### event
 * change detail: File[] 选择的文件列表
 * error detail: { code: FileUploadErrorCode; message: string } 错误
 *
 * ### props
 * - value 获取/设置值
 *
 * @todo P2 拖拽上传/从剪贴板上传
 */
export class FileUploadElement extends HTMLElement {
  static formAssociated = true;

  #shadowRoot: ShadowRoot;
  #input: HTMLInputElement;
  #value: File[] = [];

  #internals: ElementInternals;

  #formResetListener = () => {
    this.#value = [];
  };

  get value(): File[] {
    return this.#value;
  }

  set value(newVal: File[]) {
    this.#value = newVal;
    const name = this.getAttribute('name');
    if (!name) return;
    const formData = new FormData(this.#internals.form ?? undefined);
    formData.delete(name);
    newVal.forEach((it) => formData.append(name, it));
    this.#internals.setFormValue(formData);
  }

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.append(template.content.cloneNode(true));
    this.#input = this.#shadowRoot.getElementById('input') as HTMLInputElement;
  }

  connectedCallback() {
    if (this.#internals.form) {
      this.#internals.form.addEventListener('reset', this.#formResetListener);
    }
    const accept = this.getAttribute('accept');
    this.#input.multiple = toBooleanAttr(this.getAttribute('multiple')) ?? false;
    if (accept) {
      this.#input.setAttribute('accept', accept);
    }
    this.addEventListener(
      'click',
      () => {
        this.#input.click();
      },
      { capture: true },
    );

    this.#input.addEventListener('change', () => {
      const { files } = this.#input;
      if (!files) {
        this.value = [];
      } else {
        const maxSize = parseInt(this.getAttribute('max-size') ?? `${DEFAULT_MAX_SIZE}`) || DEFAULT_MAX_SIZE;
        this.value = new Array(files.length)
          .fill(0)
          .map((_, index) => files.item(index))
          .filter((it): it is File => {
            if (!it) return false;
            if (it.size > maxSize) {
              showMessage(`文件"${it.name}"超过大小限制(${formatBytes(maxSize)})`);
              return false;
            }
            return true;
          });
      }
      this.#input.value = '';
      this.dispatchEvent(new CustomEvent('change', { detail: this.value }));
    });
  }

  disconnectedCallback() {
    this.#internals.form?.removeEventListener('reset', this.#formResetListener);
  }
}

customElements.define('file-upload', FileUploadElement);
