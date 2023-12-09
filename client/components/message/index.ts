import './index.css';

import type { DialogRootElement } from '../dialog-root';
import { openDialog } from '../dialog-root';
import { MessageLogElement } from './message-log-host';

export enum MessageLevel {
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export interface IShowMessageConfig {
  /** 持续时间,若使用正在展示的消息框,则按剩余时间更长的一方计算, null则不自动关闭 */
  duration?: number | null;
}

let dialogInstance: DialogRootElement | undefined;
let messageLogHostInstance: MessageLogElement | undefined;
let dialogCloseTimer = 0;
let dialogLatestClose = 0;

function closeMessageDialog() {
  window.clearTimeout(dialogCloseTimer);
  dialogInstance?.close();
  dialogInstance = undefined;
  messageLogHostInstance = undefined;
}

/**
 * 弹出消息框,若有正在展示的消息框,消息内容则会添加到已有的消息框顶部
 * @param content 内容
 * @todo P2 放到`globalContext`里,与`message-log-host`解耦
 */
export default function showMessage(content: Node | string, { duration = 5000 }: IShowMessageConfig = {}) {
  if (!messageLogHostInstance) {
    messageLogHostInstance = new MessageLogElement();
    messageLogHostInstance.addEventListener('close', closeMessageDialog);
    dialogInstance = openDialog({
      content: messageLogHostInstance,
      mask: false,
      type: 'left',
      class: 'message-log-dialog',
    });
    messageLogHostInstance.log(content);

    if (duration !== null) {
      dialogCloseTimer = window.setTimeout(closeMessageDialog, duration);
    } else {
      dialogLatestClose = Infinity;
    }
    return;
  }

  window.clearTimeout(dialogCloseTimer);
  if (duration !== null) {
    dialogCloseTimer = window.setTimeout(
      closeMessageDialog,
      Date.now() + duration > dialogLatestClose ? duration : dialogLatestClose - Date.now(),
    );
    dialogLatestClose = Math.max(dialogLatestClose);
  } else {
    dialogLatestClose = Infinity;
  }
  messageLogHostInstance.log(content);
}
