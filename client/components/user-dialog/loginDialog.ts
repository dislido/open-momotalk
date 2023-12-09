import './loginDialog.css';

import { fragment, h } from '@/utils/dom';

import { globalContext } from '../../common/globalContext';
import { openDialog } from '../dialog-root';
import showMessage from '../message';
import { login, register } from './api';

export function openLoginDialog() {
  const refs: Record<string, HTMLElement> = {};
  const loginDialog = openDialog({
    class: 'dl-dialog dl-login-dialog',
    content: fragment([
      h('div', { class: 'title' }, [
        h(
          'div',
          {
            class: 'title-login',
            $ref(el) {
              el.addEventListener('click', () => {
                loginDialog.setAttribute('data-type', 'login');
              });
            },
          },
          ['登录'],
        ),
        h(
          'div',
          {
            class: 'title-register',
            $ref(el) {
              el.addEventListener('click', () => {
                loginDialog.setAttribute('data-type', 'register');
              });
            },
          },
          ['注册'],
        ),
      ]),
      h('div', { class: 'content' }, [
        h(
          'form',
          {
            id: 'login-form',
            'data-type': 'login',
            $ref(el: HTMLFormElement) {
              refs.loginForm = el;
              el.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(el, e.submitter);

                if (refs.loginBtn.hasAttribute('data-loading')) return;
                refs.loginBtn.setAttribute('data-loading', '');
                try {
                  const userInfo = await login({
                    username: formData.get('username')?.toString() ?? '',
                    password: formData.get('password')?.toString() ?? '',
                  });
                  globalContext.set('user', userInfo);
                  loginDialog.close();
                  showMessage('登录成功');
                } finally {
                  refs.loginBtn.removeAttribute('data-loading');
                }
              });
            },
          },
          [
            h('label', null, [
              h('div', { class: 'label-name' }, ['用户名:']),
              h('input', {
                name: 'username',
                autocomplete: 'username',
                maxlength: '16',
              }),
            ]),
            h('label', null, [
              h('div', { class: 'label-name' }, ['密码:']),
              h('input', {
                name: 'password',
                type: 'password',
                autocomplete: 'current-password',
                maxlength: 64,
              }),
            ]),
          ],
        ),
        h(
          'form',
          {
            id: 'register-form',
            'data-type': 'login',
            $ref(el: HTMLFormElement) {
              refs.loginForm = el;
              el.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(el, e.submitter);
                if (refs.registerBtn.hasAttribute('data-loading')) return;
                refs.registerBtn.setAttribute('data-loading', '');
                try {
                  const username = formData.get('username')?.toString() ?? '';
                  const password = formData.get('password')?.toString() ?? '';
                  const nickname = formData.get('nickname')?.toString();

                  if (!username) throw new Error('用户名不能为空');
                  if (username.length > 16) throw new Error('用户名最多16个字符');
                  if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new Error('用户名允许使用的字符:a-z A-Z 0-9 _');
                  if (nickname && nickname.length > 16) throw new Error('昵称最多16个字符');
                  if (password.length < 6) throw new Error('密码至少为6位');
                  if (password.length > 64) throw new Error('密码最多为64位');

                  const userInfo = await register(
                    {
                      username,
                      password,
                      nickname,
                    },
                    { autoToast: false },
                  );
                  globalContext.set('user', userInfo);
                  loginDialog.close();
                  showMessage('注册成功');
                } catch (err) {
                  if (err instanceof Error) {
                    showMessage(err.message);
                  }
                } finally {
                  refs.registerBtn.removeAttribute('data-loading');
                }
              });
            },
          },
          [
            h('label', null, [
              h('div', { class: 'label-name' }, ['用户名:']),
              h('input', {
                name: 'username',
                autocomplete: 'username',
                maxlength: '16',
                placeholder: '1-16位',
                $ref(el) {
                  el.addEventListener('input', () => {
                    refs.registerNickname.setAttribute('placeholder', el.value);
                  });
                },
              }),
            ]),
            h('label', null, [
              h('div', { class: 'label-name' }, ['密码:']),
              h('input', {
                name: 'password',
                type: 'password',
                placeholder: '6-64位',
                autocomplete: 'new-password',
                maxlength: '64',
              }),
            ]),
            h('label', null, [
              h('div', { class: 'label-name' }, ['昵称:']),
              h('input', {
                name: 'nickname',
                autocomplete: 'nickname',
                placeholder: '',
                maxlength: '16',
                $ref(el) {
                  refs.registerNickname = el;
                },
              }),
            ]),
          ],
        ),
      ]),

      h('div', { class: 'footer' }, [
        h(
          'button',
          {
            form: 'login-form',
            $ref(el) {
              refs.loginBtn = el;
            },
          },
          ['登录'],
        ),
        h(
          'button',
          {
            form: 'register-form',
            $ref(el) {
              refs.registerBtn = el;
            },
          },
          ['注册'],
        ),
        h(
          'button',
          {
            type: 'button',
            $ref(el) {
              el.addEventListener('click', () => loginDialog.close());
            },
          },
          ['取消'],
        ),
      ]),
    ]),
  });
  loginDialog.setAttribute('data-type', 'login');
  return loginDialog;
}
