import type { IUserInfo } from '@/shared/types/model/user';
import type { IMomotalkMsg } from '@/shared/types/momotalk';
import { defineApi } from '@/utils/request';

export interface IMomoGroup {
  avatar: string;
  createdAt: number;
  gid: string;
  name: string;
}

/** 获取已加入的群列表 */
export const getGroupList = defineApi<never, IMomoGroup[]>({
  url: '/api/momotalk/groupList',
});

/** 获取群消息列表, 固定20条 */
export const getGroupMsgList = defineApi<
  {
    gid: string;
    cursor?: number;
  },
  IMomotalkMsg[]
>({
  url: '/api/momotalk/groupMsgList',
});

/** 用gid查找群 */
export const findGroup = defineApi<
  {
    gid: string;
  },
  IMomoGroup | null
>({
  url: '/api/momotalk/findGroup',
});

/** 加入群 */
export const joinGroup = defineApi<
  {
    gid: string;
  },
  IMomoGroup
>({
  url: '/api/momotalk/joinGroup',
  method: 'POST',
});

/** 获取群成员列表 */
export const getGroupMembers = defineApi<
  {
    gid: string;
  },
  IUserInfo[]
>({
  url: '/api/momotalk/groupMembers',
});
