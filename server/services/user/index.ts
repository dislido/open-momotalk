import type { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import loadConfig from '../../../server/utils/loadConfig.js';
import prisma from '../../services/prisma/index.js';
import BizError from '../../utils/errors/BizError.js';

const config = await loadConfig();
/** token过期时间 */
const TOKEN_EXPIRE_TIME = 3600 * 24 * 7;

export function toClientUser(prismaUser: Prisma.userGetPayload<object>) {
  return {
    ...prismaUser,
    password: undefined,
    createdAt: prismaUser.createdAt.getTime(),
  };
}

export const clientUserSelect = {
  id: true,
  nickname: true,
  avatar: true,
};

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, config.BCRYPT_SALT);
}

interface IUserJwtPayload {
  uid: number;
  iat: number;
  exp: number;
  sec: string;
}
export function createToken(userId: number, password: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      uid: userId,
      iat: now,
      exp: now + TOKEN_EXPIRE_TIME,
      sec: bcrypt.hashSync(`${userId}${now}${password}`, config.BCRYPT_SALT ?? ''),
    },
    config.BCRYPT_SALT ?? '',
    { algorithm: 'HS512' },
  );
}

/** 创建用户 */
export async function createUser({
  username,
  password,
  nickname = username,
}: {
  username: string;
  password: string;
  nickname?: string;
}) {
  const targetNickname = nickname || username;
  if (!username) throw new BizError('用户名不能为空');
  if (username.length > 16) throw new BizError('用户名最多16个字符');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new BizError('用户名允许使用的字符:a-z A-Z 0-9 _');
  if (targetNickname.length > 16) throw new BizError('昵称最多16个字符');
  if (password.length < 6) throw new BizError('密码至少为6位');
  if (password.length > 64) throw new BizError('密码最多为64位');

  const exist = await prisma.user.findFirst({
    where: {
      username,
    },
  });

  if (exist) {
    throw new BizError('用户名已存在');
  }

  const user = await prisma.user.create({
    data: {
      password: hashPassword(password),
      username,
      nickname: targetNickname,
    },
  });

  return { user, token: createToken(user.id, user.password) };
}

export async function getUserByToken(token: string) {
  const tokenPayload = jwt.verify(token, config.BCRYPT_SALT ?? '') as IUserJwtPayload;
  const user = await getUserById(tokenPayload.uid);
  if (!user) return null;
  if (
    tokenPayload.sec !==
    bcrypt.hashSync(`${tokenPayload.uid}${tokenPayload.iat}${user.password}`, config.BCRYPT_SALT ?? '')
  ) {
    return null;
  }

  let newToken: string | undefined;
  if (Date.now() / 1000 - tokenPayload.iat > 3600 * 24) {
    newToken = createToken(user.id, user.password);
  }
  return {
    user,
    newToken,
  };
}

export async function userLogin(data: Prisma.userGetPayload<{ select: { username: true; password: true } }>) {
  const user = await prisma.user.findFirst({
    where: {
      username: data.username,
      password: hashPassword(data.password),
    },
  });
  if (!user) throw new BizError('用户名或密码错误');
  const token = createToken(user.id, user.password);
  return {
    user,
    token,
  };
}

export async function getUserById(userId: number) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  return user;
}

export async function updateUserAvatar(userId: number, avatar: string) {
  const user = await prisma.user.update({
    data: {
      avatar,
    },
    where: {
      id: userId,
    },
  });

  return user;
}

export async function updateUserPassword(userId: number, oldPassword: string, newPassword: string) {
  if (newPassword.length < 6) throw new BizError('密码至少为6位');
  if (newPassword.length > 64) throw new BizError('密码最多为64位');
  try {
    const user = await prisma.user.update({
      data: {
        password: hashPassword(newPassword),
      },
      where: {
        id: userId,
        password: hashPassword(oldPassword),
      },
    });
    return { user, token: createToken(user.id, user.password) };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new BizError('旧密码错误');
    }
    throw e;
  }
}

export async function updateUserNickname(userId: number, nickname: string) {
  if (!nickname) throw new BizError('昵称不能为空');
  if (nickname.length > 16) throw new BizError('昵称最多16个字符');
  const user = await prisma.user.update({
    data: {
      nickname,
    },
    where: {
      id: userId,
    },
  });
  return user;
}
