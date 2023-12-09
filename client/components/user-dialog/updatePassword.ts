import './updatePassword.css';

import { h } from '@/utils/dom';

import { openDialog } from '../dialog-root';
import showMessage from '../message';
import { updatePassword } from './api';

export function openUpdatePasswordDialog() {
  const updatePasswordDialog = openDialog({
    class: 'dl-dialog dl-dialog-confirm update-password-dialog',
    content: h(
      'form',
      {
        $ref: (form) => {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.hasAttribute('data-loading')) return;
            form.setAttribute('data-loading', 'true');
            const formData = new FormData(form);

            const oldPassword = formData.get('oldPassword')?.toString() ?? '';
            const newPassword = formData.get('newPassword')?.toString() ?? '';
            const newPasswordConfirm = formData.get('newPasswordConfirm')?.toString() ?? '';

            if (newPassword !== newPasswordConfirm) {
              showMessage('新密码不一致');
              return;
            }

            updatePassword({
              oldPassword,
              newPassword,
            })
              .then(() => {
                showMessage('修改完成');
                updatePasswordDialog.close();
              })
              .finally(() => {
                form.removeAttribute('data-loading');
              });
          });
        },
      },
      [
        h('div', { class: 'title' }, ['修改密码']),
        h('div', { class: 'content' }, [
          h('input', { autocomplete: 'username', name: 'username', hidden: true }),
          h('label', { class: 'update-password-label' }, [
            h('div', { class: 'label-name' }, ['旧密码:']),
            h('input', { autocomplete: 'current-password', name: 'oldPassword', maxlength: '64', type: 'password' }),
          ]),
          h('label', { class: 'update-password-label' }, [
            h('div', { class: 'label-name' }, ['新密码:']),
            h('input', { autocomplete: 'new-password', name: 'newPassword', maxlength: '64', type: 'password' }),
          ]),
          h('label', { class: 'update-password-label' }, [
            h('div', { class: 'label-name' }, ['确认新密码:']),
            h('input', { autocomplete: 'new-password', name: 'newPasswordConfirm', maxlength: '64', type: 'password' }),
          ]),
        ]),
        h('div', { class: 'footer' }, [
          h('button', null, ['确认']),
          h(
            'button',
            { type: 'button', $ref: (el) => el.addEventListener('click', () => updatePasswordDialog.close()) },
            ['取消'],
          ),
        ]),
      ],
    ),
  });
  return updatePasswordDialog;
}
