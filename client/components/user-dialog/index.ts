import type { DialogRootElement } from '../dialog-root';
import { openUserInfoDialog } from './userInfoDialog';

let singleton: DialogRootElement | undefined;
export function openUserDialog() {
  if (singleton) return singleton;
  singleton = openUserInfoDialog();
  singleton.addEventListener('close', () => {
    singleton = undefined;
  });
  return singleton;
}
