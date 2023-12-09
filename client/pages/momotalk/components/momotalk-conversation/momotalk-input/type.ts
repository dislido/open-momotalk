import type { IMsgSegment } from '@/shared/types/momotalk';
import type { ObservableObject } from '@/utils/context';

export interface MomotalkInputSubmitEventPayload {
  data: Promise<IMsgSegment[]>;
  progress: ObservableObject<{
    items: {
      name: string;
      total: number;
      loaded: number;
    }[];
  }>;
  abortController: AbortController;
}
