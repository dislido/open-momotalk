import prisma from '../../services/prisma/index.js';
import BizError from '../../utils/errors/BizError.js';

/** 获取用户权限点列表 */
export function getACL(uid: number, ns: string, nsId = '') {
  return prisma.aclRelation.findMany({
    where: {
      userId: uid,
      nsId,
      acl: {
        namespace: ns,
      },
    },
    select: {
      acl: {
        select: {
          key: true,
        },
      },
    },
  });
}

/** 为用户添加指定权限点 */
export async function setACL(uid: number, key: string, ns: string, nsId = '') {
  const acl = await prisma.acl.findFirst({
    where: {
      namespace: ns,
      key: `${key}$`,
    },
  });

  if (!acl) throw new BizError('指定的权限点不存在');

  return prisma.aclRelation.create({
    data: {
      userId: uid,
      aclId: acl.id,
      nsId,
    },
  });
}

/** 定义一个新的权限点 */
export function defineACL(ns: string, key: string) {
  return prisma.acl.create({
    data: {
      key: `${key}$`,
      namespace: ns,
    },
  });
}

/** 检查用户是否有指定权限点, acls为OR判断 */
export async function checkACL(uid: number, acls: { key: string; nsId?: string }[]) {
  const cnt = await prisma.aclRelation.count({
    where: {
      userId: uid,
      OR: acls.map((it) => ({
        acl: { key: { startsWith: it.key } },
        nsId: it.nsId ?? '',
      })),
    },
  });
  return cnt > 0;
}
