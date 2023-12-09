import showMessage from '@/components/message';
import type { IMsgSegment } from '@/shared/types/momotalk';
import { MsgSegType } from '@/shared/types/momotalk';
import { ObservableObject } from '@/utils/context';
import { h } from '@/utils/dom';

import type { MomotalkInputSubmitEventPayload } from '../type';
import { EditorSegmentElement } from './editor-segment';
import style from './index.css?inline';
import { MomoText } from './MomoText';
import { insertToSelection } from './selection';
import { transHtml } from './util';

const template = document.createElement('template');
template.innerHTML = `<style>${style}</style>`;

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

/**
 * momotalk富文本编辑器
 * ### event
 * - submit `MomotalkInputSubmitEventPayload` 发送
 */
export class MomotalkEditorElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  #editor: HTMLDivElement;
  #compositioning = false;
  #mutObs = new MutationObserver((records) => {
    if (this.#compositioning) return;
    const filteredRecords = records.filter((it) => {
      return (it.type === 'characterData' && it.target.parentNode === this.#editor) || it.target === this.#editor;
    });
    if (!filteredRecords.length) return;

    if (this.#editor.childNodes.length > 0 && !(this.#editor.childNodes[0] instanceof MomoText)) {
      this.#editor.prepend(new MomoText('\ufeff', { emptyNode: true }));
    }

    records.forEach((it) => {
      if (it.type === 'characterData' && it.target instanceof MomoText && it.target.textContent !== '\ufeff') {
        const sepText = it.target.data.replace('\ufeff', '');
        it.target.textContent = '\ufeff';
        if (sepText) {
          const text = new Text(sepText);
          it.target.after(text);
          document.getSelection()?.collapse(text, sepText.length);
        }
      } else if (it.type === 'childList' && it.removedNodes.length > 0) {
        it.removedNodes.forEach((rm) => {
          if (rm instanceof MomoText && rm.bindSegment) {
            rm.bindSegment.remove();
          }
        });
      }
    });

    if (records.every((it) => it.type === 'characterData')) return;

    [...this.#editor.childNodes].forEach((it, index) => {
      if (index > 0 && it instanceof MomoText && it.emptyNode) {
        it.remove();
        return;
      }
      if (!isElement(it)) return;

      // SF
      if (it.tagName === 'BR') {
        it.remove();
        return;
      }
    });

    if (this.#editor.childNodes.length === 0) {
      const emptyNode = new MomoText('\ufeff', { emptyNode: true });
      this.#editor.append(emptyNode);
      document.getSelection()?.collapse(emptyNode, 1);
      return;
    }
  });

  #lastRange: Range | null = null;
  #selectionListener = () => {
    const sel = this.getSelectionAndRange();
    if (!sel) {
      this.#lastRange = null;
      return;
    }
    const [selection, range] = sel;

    if (range.collapsed) {
      if (range.startContainer instanceof MomoText && range.startOffset === 0) {
        if (
          this.#lastRange &&
          this.#lastRange.startContainer === range.startContainer &&
          this.#lastRange.startOffset === 1 &&
          range.startContainer.bindSegment
        ) {
          const prev = range.startContainer.bindSegment.previousSibling ?? range.startContainer.bindSegment;
          selection.collapse(prev, prev.textContent?.length);
          this.#lastRange = range;
          return;
        }
        selection.collapse(range.startContainer, 1);
        this.#lastRange = range;
        return;
      }
    }
    // @todo P3 非collapsed时处理
    this.#lastRange = range;
  };

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    this.#shadowRoot.appendChild(template.content.cloneNode(true));
    this.#editor = h('div', { contenteditable: true, class: 'editor', spellcheck: false }, [
      new MomoText('\ufeff', { emptyNode: true }),
    ]);
    this.#shadowRoot.append(this.#editor);

    this.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        if (e.metaKey || e.altKey || e.ctrlKey) {
          this.submit();
        }
      }
    });

    this.#editor.addEventListener('compositionstart', () => {
      this.#compositioning = true;
    });
    this.#editor.addEventListener('compositionend', () => {
      this.#compositioning = false;
    });
    this.#editor.addEventListener(
      'beforeinput',
      (e) => {
        if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
          // @todo P2 监听快捷键处理undo/redo
          e.preventDefault();
          showMessage('暂不支持撤销/重做功能');
        }
      },
      { capture: true },
    );
    // file > html > text
    this.#editor.addEventListener('paste', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.clipboardData) return showMessage('剪贴板里没找到可以粘贴的东西');
      const items = [...e.clipboardData.items].filter((it) => it.kind === 'file');
      if (items.length > 0) {
        try {
          const files = items
            .map((it) => {
              const entry = it.webkitGetAsEntry();
              if (entry?.isDirectory) {
                throw new Error('暂不支持粘贴文件夹');
              }
              return it.getAsFile();
            })
            .filter((it): it is File => !!it);
          const segs = files.map((it) =>
            h(new EditorSegmentElement(), { type: MsgSegType.SFile, $ref: (el) => (el.data = it) }),
          );
          this.insert(...segs);
          return;
        } catch (err) {
          if (err instanceof Error) {
            showMessage(err.message);
          }
        }
      }
      const html = e.clipboardData.getData('text/html');
      if (html) {
        transHtml(html).then((data) => this.insert(...data));
        return;
      }

      const text = e.clipboardData.getData('text');
      this.insert(text);
    });
  }

  connectedCallback() {
    this.#mutObs.observe(this.#editor, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });
    document.addEventListener('selectionchange', this.#selectionListener);
    this.#editor.focus();
  }

  disconnectedCallback() {
    this.#mutObs.disconnect();
    document.removeEventListener('selectionchange', this.#selectionListener);
  }

  getSelectionAndRange() {
    let selection = document.getSelection();
    if (!selection) return null;

    // `typeof`只是为了处理ts
    // 规范 getComposedRanges, CH--FF--SF17
    if ('getComposedRanges' in selection && typeof selection.getComposedRanges === 'function') {
      const [firstRange] = selection.getComposedRanges(this.#shadowRoot);
      if (!firstRange || !this.#editor.contains(firstRange.startContainer)) return null;

      const range = document.createRange();
      range.setStart(firstRange.startContainer, firstRange.startOffset);
      range.setEnd(firstRange.endContainer, firstRange.endOffset);
      return [selection, range] as const;
    }

    if (selection.type === 'None') {
      return null;
    }

    // shadowRoot.getSelection() CH53FF--SF--
    if ('getSelection' in this.#shadowRoot && typeof this.#shadowRoot.getSelection === 'function') {
      selection = this.#shadowRoot.getSelection();
      if (selection.type === 'None') return null;
      return [selection, selection.getRangeAt(0)] as const;
    }

    // selection 可穿透shadowRoot CH--FF??SF--
    if (selection.anchorNode === this.#editor || this.#editor.contains(selection.anchorNode)) {
      return [selection, selection.getRangeAt(0)] as const;
    }

    return null;
  }

  insertSFile(...files: File[]) {
    this.insert(
      ...files.map((it) => {
        return h(new EditorSegmentElement(), { type: MsgSegType.SFile, $ref: (setEl) => (setEl.data = it) });
      }),
    );
  }

  insert(...items: (EditorSegmentElement | string)[]) {
    if (!items.length) return;
    const nodes = items.map((it) => (typeof it === 'string' ? new Text(it) : it));

    const sel = this.getSelectionAndRange();
    if (sel) {
      insertToSelection(sel[0], nodes, sel[1]);
    } else {
      this.#editor.append(...nodes);
    }
  }

  async submit() {
    this.#editor.normalize();

    const nodes = [...this.#editor.childNodes];

    const uploads = new ObservableObject({ items: [] as { name: string; total: number; loaded: number }[] });
    const abortController = new AbortController();

    const segmentsPromises = nodes
      .map<Promise<IMsgSegment | null> | IMsgSegment | null>((it) => {
        if (it.nodeType === Node.TEXT_NODE) {
          const text = it.textContent?.replaceAll('\ufeff', '');
          if (!text) return null;
          return { type: MsgSegType.Text, text };
        }

        if (it instanceof EditorSegmentElement) {
          return it.getSegment({ uploads, signal: abortController.signal });
        }
        return null;
      })
      .filter((it): it is Promise<IMsgSegment | null> | IMsgSegment => !!it);

    this.#editor.innerHTML = '';
    if (segmentsPromises.length === 0) return;
    try {
      const segments = Promise.all(segmentsPromises).then((segs) => segs.filter((it): it is IMsgSegment => !!it));
      this.dispatchEvent(
        new CustomEvent<MomotalkInputSubmitEventPayload>('submit', {
          detail: { data: segments, progress: uploads, abortController },
        }),
      );
    } catch (e) {
      showMessage(`${e}`);
      throw e;
    }
  }
}

customElements.define('momotalk-editor', MomotalkEditorElement);
