import './index.css';
import './ba-dialog-layout';

import { openDialog } from '@/components/dialog-root';
import { h } from '@/utils/dom';

export function openBaDialog({
  title,
  content,
  layoutClass,
}: {
  title: string;
  content: string | Node;
  layoutClass?: string;
}) {
  const dialog = openDialog({
    class: 'ba-dialog',
    content: h('div', { class: 'ba-dialog-container' }, [
      h(
        'ba-dialog-layout',
        {
          $ref(el) {
            el.addEventListener('close', () => dialog.close());
          },
          class: layoutClass,
        },
        [h('div', { slot: 'title' }, [title]), content],
      ),
    ]),
  });
  return dialog;
}
