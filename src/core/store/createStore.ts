/**
 * Store tối giản, không phụ thuộc framework:
 * React đọc qua `useSyncExternalStore`, Phaser `subscribe` trực tiếp.
 */
export type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  /** Trả về hàm huỷ đăng ký */
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => state,
    set: (next) => {
      const value = typeof next === 'function' ? next(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
