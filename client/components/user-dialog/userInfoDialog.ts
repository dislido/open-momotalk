import './userInfoDialog.css';
import '@/components/file-upload';

import { globalContext } from '@/common/globalContext';
import { commonUpload } from '@/common/upload';
import type { FileUploadElement } from '@/components/file-upload';
import { fragment, h } from '@/utils/dom';

import { confirm, openDialog } from '../dialog-root';
import showMessage from '../message';
import { updateAvatar } from './api';
import { openLoginDialog } from './loginDialog';
import { openUpdateNicknameDialog } from './updateNickname';
import { openUpdatePasswordDialog } from './updatePassword';

export function openUserInfoDialog() {
  const user = globalContext.get('user');
  if (!user) return openLoginDialog();
  let avatarRef: HTMLImageElement | undefined;
  const unWatch = globalContext.watch('user', (newVal) => {
    if (!newVal || !avatarRef) return;
    avatarRef.src = newVal.avatar;
  });

  const userDialog = openDialog({
    class: 'dl-dialog dl-user-dialog',
    content: fragment([
      h('div', { class: 'title' }, ['用户']),
      h('div', { class: 'content' }, [
        h('div', { class: 'item avatar' }, [
          h('img', {
            src: user.avatar,
            $ref(el) {
              avatarRef = el;
            },
          }),
          h<FileUploadElement>(
            'file-upload',
            {
              accept: 'image/png, image/jpeg, image/gif',
              $ref(el) {
                el.addEventListener('change', async (e) => {
                  const [img] = (e as CustomEvent<File[]>).detail;
                  try {
                    const url = await commonUpload(img);
                    const newUser = await updateAvatar({
                      url,
                    });
                    showMessage('修改完成');
                    globalContext.set('user', newUser);
                  } catch (err) {
                    if (err instanceof Error) {
                      showMessage(err.message);
                    }
                    throw err;
                  }
                });
              },
            },
            [h('button', { class: 'user-dialog-button' }, ['修改头像'])],
          ),
        ]),
        h('div', { class: 'item' }, [`用户名:${user.username}`]),
        h('div', { class: 'item' }, [`昵称:${user.nickname}`]),
        h('div', { class: 'item' }, [`uid:${user.id}`]),
        h('div', { class: 'operations' }, [
          h(
            'button',
            {
              class: 'user-dialog-button',
              $ref: (el) => {
                el.addEventListener('click', () => openUpdatePasswordDialog());
              },
            },
            ['修改密码'],
          ),
          h(
            'button',
            {
              class: 'user-dialog-button',
              $ref: (el) => {
                el.addEventListener('click', () => openUpdateNicknameDialog());
              },
            },
            ['修改昵称'],
          ),
        ]),
      ]),

      h('div', { class: 'footer' }, [
        h(
          'button',
          {
            type: 'button',
            $ref(el) {
              el.addEventListener('click', () => {
                confirm({
                  content: '确认退出登录?',
                  onConfirm: () => {
                    localStorage.removeItem('jwt');
                    globalContext.set('user', undefined);
                    userDialog.dispatchEvent(new CustomEvent('logout'));
                    userDialog.close();
                    showMessage('已退出登录');
                  },
                });
              });
            },
          },
          ['退出登录'],
        ),
        h(
          'button',
          {
            type: 'button',
            $ref(el) {
              el.addEventListener('click', () => userDialog.close());
            },
          },
          ['关闭'],
        ),
      ]),
    ]),
  });
  userDialog.setAttribute('data-type', 'login');
  userDialog.addEventListener('close', () => {
    unWatch();
  });
  return userDialog;
}
