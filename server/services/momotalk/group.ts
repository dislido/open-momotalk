import type { Prisma } from '@prisma/client';

import type { IMsgSegment } from '../../../shared/types/momotalk.js';
import prisma from '../../services/prisma/index.js';
import BizError from '../../utils/errors/BizError.js';
import { clientUserSelect } from '../user/index.js';

function toParsedMsg<T extends { content: string; createdAt: Date }>(
  msg: T,
): Omit<T, 'content' | 'createdAt'> & { content: IMsgSegment[]; createdAt: number } {
  return {
    ...msg,
    content: JSON.parse(msg.content),
    createdAt: msg.createdAt.getTime(),
  };
}

export function toClientGroup(prismaGroup: Prisma.momoGroupGetPayload<object>) {
  return {
    ...prismaGroup,
    id: undefined,
    createdAt: prismaGroup.createdAt.getTime(),
  };
}
/**
 * 创建momotalk群聊
 * @param name 群名
 * @param creatorId 创建人id
 */
export async function createGroup(name: string, creatorId?: number) {
  if (!name) throw new BizError('群名不能为空');
  if (name.length > 32) throw new BizError('群名最多32个字符');
  const data = await prisma.momoGroup.create({
    data: {
      name,
      gid: BigInt(`${Date.now()}${creatorId ?? ''}`).toString(36),
      members: {
        connect: creatorId
          ? [
              {
                id: creatorId,
              },
            ]
          : [],
      },
    },
  });
  return data;
}

/** 获取用户群聊列表 */
export async function getUserGroups(userId: number) {
  const data = await prisma.user.findFirst({
    select: {
      momoGroups: true,
    },
    where: {
      id: userId,
    },
  });

  if (!data) return [];
  return data.momoGroups;
}

/** 发送群消息 */
export async function addGroupMsg(msg: { gid: string; senderId: number; content: IMsgSegment[] }) {
  return toParsedMsg(
    await prisma.momoGroupMsg.create({
      data: {
        gid: msg.gid,
        senderId: msg.senderId,
        createdAt: new Date(),
        content: JSON.stringify(msg.content),
      },
      select: {
        content: true,
        createdAt: true,
        gid: true,
        id: true,
        sender: { select: clientUserSelect },
      },
    }),
  );
}

/** 获取群成员列表 */
export async function getGroupMembers(gid: string) {
  return prisma.user.findMany({
    where: {
      momoGroups: {
        some: {
          gid,
        },
      },
    },
  });
}

/** 获取群消息列表, 固定20条 */
export async function getGroupMsgList(gid: string, cursor: number | undefined) {
  const msgs = await prisma.momoGroupMsg.findMany({
    orderBy: {
      id: 'desc',
    },
    cursor: cursor
      ? {
          id: cursor,
        }
      : undefined,
    take: 20,
    skip: cursor ? 1 : 0,
    where: {
      gid,
    },
    select: {
      content: true,
      createdAt: true,
      gid: true,
      id: true,
      sender: {
        select: clientUserSelect,
      },
    },
  });
  return msgs.map((it) => toParsedMsg(it));
}

export function getGroupByGid(gid: string) {
  return prisma.momoGroup.findFirst({
    where: {
      gid,
    },
  });
}

export function addGroupMember(gid: string, userId: number) {
  return prisma.momoGroup.update({
    where: {
      gid,
    },
    data: {
      members: { connect: { id: userId } },
    },
  });
}
