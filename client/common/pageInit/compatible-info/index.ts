import { h } from '@/utils/dom';

function isSupport() {
  return CSS.supports('selector(&)');
}

if (!isSupport()) {
  const dialog = h(
    'div',
    {
      style:
        'position:fixed;background:#c3ddf7cc;width:360px;max-width:100vw;box-sizing:border-box;word-break:break-word;top:50vh;left:0;transform:translate(0,-50%);z-index:100000',
      $ref(el) {
        el.addEventListener('click', () => dialog.remove());
      },
    },
    [
      h('div', {}, [
        '*本站使用了较激进的web技术,当前浏览器似乎无法正常浏览,请使用新版本浏览器访问 (需要Chrome/Edge>=112,Safari>=17,Firefox>=117)',
      ]),
    ],
  );
  document.body.append(dialog);
}
