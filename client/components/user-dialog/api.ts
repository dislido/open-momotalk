import type { IUserInfo } from '@/shared/types/model/user';
import { defineApi } from '@/utils/request';

export interface ILoginParams {
  username: string;
  password: string;
}

/** 登录 */
export const login = defineApi<ILoginParams, IUserInfo>({
  url: '/api/user/login',
  method: 'POST',
});

export interface IRegisterArgs {
  username: string;
  password: string;
  nickname?: string;
}
/** 注册 */
export const register = defineApi<IRegisterArgs, IUserInfo>({
  url: '/api/user/register',
  method: 'POST',
});

export const updateAvatar = defineApi<{ url: string }, IUserInfo>({
  url: '/api/user/updateAvatar',
  method: 'POST',
});

export const updatePassword = defineApi<{ oldPassword: string; newPassword: string }, IUserInfo>({
  url: '/api/user/updatePassword',
  method: 'POST',
});

export const updateNickname = defineApi<{ nickname: string }, IUserInfo>({
  url: '/api/user/updateNickname',
  method: 'POST',
});
