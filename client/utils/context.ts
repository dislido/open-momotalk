interface ListenResult {
  removeListener?: boolean;
}

type ListenerType<M extends object, T extends keyof M> = (
  newValue: M[T],
  oldValue: M[T],
) => ListenResult | void | Promise<ListenResult | void>;
export class ObservableObject<M extends object> {
  #data: M = {} as M;
  #listeners = {} as { [T in keyof M]?: ListenerType<M, T>[] };

  constructor(init: M) {
    this.#data = init;
  }

  get<T extends keyof M>(key: T) {
    return this.#data[key];
  }

  watch<T extends keyof M>(
    key: T,
    listener: ListenerType<M, T>,
    {
      immediate = true,
    }: {
      /** 监听时立刻触发一次listener, 此时newValue = oldValue, 默认true */
      immediate?: boolean;
    } = {},
  ) {
    if (!this.#listeners[key]) {
      this.#listeners[key] = [];
    }

    const wrapListener = (newValue: M[T], oldValue: M[T]) => {
      return listener(newValue, oldValue);
    };
    if (immediate) {
      wrapListener(this.#data[key], this.#data[key]);
    }
    this.#listeners[key]?.push(wrapListener);

    return () => {
      this.#listeners[key] = this.#listeners[key]?.filter((it) => it !== wrapListener);
    };
  }

  /**
   * 更新context值, 若新值===旧值,则不会进行操作
   */
  set<T extends keyof M>(key: T, value: M[T]) {
    const oldValue = this.#data[key];
    if (oldValue === value) return;
    this.#data[key] = value;
    const listeners = this.#listeners[key];
    if (listeners?.length) {
      listeners.forEach(async (listener) => {
        try {
          const result = await listener(value, oldValue);
          if (result?.removeListener) {
            this.#listeners[key] = this.#listeners[key]?.filter((it) => it !== listener);
          }
        } catch (e) {
          // noop
        }
      });
    }
  }
}
