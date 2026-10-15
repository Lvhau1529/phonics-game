import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assetActivity, beginAssetLoad, whenAssetsIdle } from '@/core/phaser/assetActivity';

/** Promise đã resolve chưa (sau khi chạy hết microtask) */
async function settled(promise: Promise<void>): Promise<boolean> {
  let done = false;
  void promise.then(() => {
    done = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  return done;
}

describe('assetActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    assetActivity.set({ loading: 0, anyReady: false });
  });
  afterEach(() => vi.useRealTimers());

  it('đếm game đang tải; kết thúc lần 2 không trừ thêm', () => {
    const end = beginAssetLoad();
    beginAssetLoad();
    expect(assetActivity.get().loading).toBe(2);
    end(true);
    end(true);
    expect(assetActivity.get()).toEqual({ loading: 1, anyReady: true });
  });

  it('huỷ giữa chừng không tính là đã tải xong', () => {
    beginAssetLoad()(false);
    expect(assetActivity.get()).toEqual({ loading: 0, anyReady: false });
  });

  it('không mở game: rảnh sau idleMs', async () => {
    const idle = whenAssetsIdle(1000);
    vi.advanceTimersByTime(999);
    expect(await settled(idle)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(await settled(idle)).toBe(true);
  });

  it('game tải xong trước idleMs: rảnh ngay', async () => {
    const idle = whenAssetsIdle(60_000);
    const end = beginAssetLoad();
    expect(await settled(idle)).toBe(false);
    end(true);
    expect(await settled(idle)).toBe(true);
  });

  it('hết idleMs mà game còn đang tải: chờ game tải xong', async () => {
    const end = beginAssetLoad();
    const idle = whenAssetsIdle(1000);
    vi.advanceTimersByTime(5000);
    expect(await settled(idle)).toBe(false);
    end(false);
    expect(await settled(idle)).toBe(true);
  });
});
