import base from './base.html?template';
import changelog from './changelog.html?template';
import overview from './overview.html?template';
import todo from './todo.html?template';

export default [
  { tab: '概述', content: overview },
  { tab: '基础功能', content: base },
  { tab: 'TODO', content: todo },
  { tab: '更新日志', content: changelog },
] satisfies { tab: string; content: string }[];
