import './index.css';

import { h } from '@/utils/dom';

import { openBaDialog } from '../components/ba-dialog';
import items from './docs';
import { MomotalkDocContentElement } from './momotalk-doc-content.ts';

export function openMomotalkDoc() {
  return openBaDialog({
    title: '文档',
    content: h(new MomotalkDocContentElement(), {
      $ref: (el) => {
        el.items = items;
      },
    }),
    layoutClass: 'momotalk-doc',
  });
}
