import type { IUserInfo } from '@/shared/types/model/user';
import { defineApi } from '@/utils/request';

/** 获取当前登录用户信息 */
export const getUserInfo = defineApi<undefined, IUserInfo>({
  url: '/api/user/info',
});

/**
 * 获取用户权限
 * @param ns 权限namespace
 * @param nsId 权限namespace id
 */
export const getUserAcl = defineApi<{ ns: string; nsId?: string }, string[]>({
  url: '/api/user/acl',
});
