import '@/common/pageInit';
import './components/momotalk-titlebar';
import './components/left-tabs';
import './components/group-list';
import './components/member-list';
import './components/momotalk-conversation';
import './components/ba-button';
import './components/group-search-content';
import './index.css';
import './ws';

import { h } from '@/utils/dom';

import { openBaDialog } from './components/ba-dialog';

const titlebar = document.getElementById('titlebar')!;
const app = document.getElementById('app')!;

titlebar.addEventListener('heightChangeStart', () => {
  app.setAttribute('ready', '');
});

document.getElementById('search-group')!.addEventListener('click', () => {
  const dialog = openBaDialog({
    title: '加入群聊',
    content: h('group-search-content', {
      $ref(el) {
        el.addEventListener('close', () => {
          dialog.close();
        });
      },
    }),
  });
});

const dropListener = async (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
document.body.addEventListener('drop', dropListener);
document.body.addEventListener('dragover', dropListener, { capture: true });
