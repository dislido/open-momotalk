import { globalContext } from '@/common/globalContext';
import { getUserAcl } from '@/common/user';
import { type IMomotalkMsg, MomotalkWsResType } from '@/shared/types/momotalk';
import { ObservableObject } from '@/utils/context';

import type { IMomoGroup } from './api';
import { msgStringify } from './utils/message';
import type { MomotalkWs } from './ws';

export interface IMomoConversation {
  group: IMomoGroup;
  msgList: IMomotalkMsg[];
  unread: number;
  lastMsgText?: string;
}

export interface IMomotalkContext {
  /** 左侧tab选中项key */
  activeLeftTab: 'chats' | 'students';
  ws?: MomotalkWs;
  /** 群聊列表 */
  groupList: IMomoGroup[];
  /** 打开的会话id */
  activeConversation?: string;
  /** 会话对象map */
  conversations: ObservableObject<Record<string, ObservableObject<IMomoConversation> | undefined>>;
  acl: string[];
  groupAcl: string[];
}

export const momotalkContext = new ObservableObject<IMomotalkContext>({
  activeLeftTab: 'chats',
  groupList: [],
  conversations: new ObservableObject({}),
  acl: [],
  groupAcl: [],
});

momotalkContext.watch('ws', (ws) => {
  if (!ws) return;
  ws.on(MomotalkWsResType.ReceiveGroupMsg, (data) => {
    const conver = momotalkContext.get('conversations').get(data.gid);
    if (!conver) return;

    conver.set('lastMsgText', msgStringify(data.content));
    conver.get('msgList').push(data);
    if (momotalkContext.get('activeConversation') !== data.gid) {
      conver.set('unread', conver.get('unread') + 1);
    }
  });
  return { removeListener: true };
});

momotalkContext.watch('groupList', (groupList) => {
  const conversations = momotalkContext.get('conversations');
  groupList.forEach((group) => {
    const conversation = conversations.get(group.gid);
    if (!conversation) {
      conversations.set(
        group.gid,
        new ObservableObject({
          group,
          msgList: [],
          unread: 0,
          lastMsgText: '',
        }),
      );
    } else {
      /** @todo P2 更新缓存群信息 */
    }
  });
});

globalContext.watch('user', (user) => {
  if (!user) return;
  getUserAcl({ ns: 'momotalk.admin' }).then((acl) => {
    momotalkContext.set('acl', acl);
  });
});

let groupAclAc: AbortController | undefined;
momotalkContext.watch('activeConversation', (newVal) => {
  if (!newVal) return;
  momotalkContext.set('groupAcl', []);
  if (groupAclAc) groupAclAc.abort();
  groupAclAc = new AbortController();
  getUserAcl({ ns: 'momotalk.group', nsId: newVal }, { signal: groupAclAc.signal }).then((acl) => {
    momotalkContext.set('groupAcl', acl);
    groupAclAc = undefined;
  });
});
