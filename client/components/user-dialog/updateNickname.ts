import './updateNickname.css';

import { globalContext } from '@/common/globalContext';
import { h } from '@/utils/dom';

import { openDialog } from '../dialog-root';
import showMessage from '../message';
import { updateNickname } from './api';

export function openUpdateNicknameDialog() {
  const updateNicknameDialog = openDialog({
    class: 'dl-dialog dl-dialog-confirm update-nickname-dialog',
    content: h(
      'form',
      {
        $ref: (form) => {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.hasAttribute('data-loading')) return;
            form.setAttribute('data-loading', 'true');
            const formData = new FormData(form);
            const nickname = formData.get('nickname')?.toString() ?? '';

            if (!nickname) {
              showMessage('昵称不能为空');
              return;
            }

            updateNickname({
              nickname,
            })
              .then((user) => {
                showMessage('修改完成');
                globalContext.set('user', user);
                updateNicknameDialog.close();
              })
              .finally(() => {
                form.removeAttribute('data-loading');
              });
          });
        },
      },
      [
        h('div', { class: 'title' }, ['修改昵称']),
        h('div', { class: 'content' }, [
          h('label', { class: 'update-nickname-label' }, [
            h('div', { class: 'label-name' }, ['昵称:']),
            h('input', {
              autocomplete: 'nickname',
              name: 'nickname',
              maxlength: '16',
              $ref: (el) => {
                el.value = globalContext.get('user')?.nickname ?? '';
              },
            }),
          ]),
        ]),
        h('div', { class: 'footer' }, [
          h('button', null, ['确认']),
          h(
            'button',
            { type: 'button', $ref: (el) => el.addEventListener('click', () => updateNicknameDialog.close()) },
            ['取消'],
          ),
        ]),
      ],
    ),
  });
  return updateNicknameDialog;
}
