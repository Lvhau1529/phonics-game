import { describe, expect, it, vi } from 'vitest';
import { createStore } from './createStore';

describe('createStore', () => {
  it('cập nhật state và báo cho listener', () => {
    const store = createStore({ n: 0 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set((s) => ({ n: s.n + 1 }));
    expect(store.get()).toEqual({ n: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('bỏ qua khi set cùng một object (Object.is)', () => {
    const store = createStore({ n: 0 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set((s) => s);
    expect(listener).not.toHaveBeenCalled();
  });

  it('huỷ đăng ký listener', () => {
    const store = createStore({ n: 0 });
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.set({ n: 2 });
    expect(listener).not.toHaveBeenCalled();
  });
});
