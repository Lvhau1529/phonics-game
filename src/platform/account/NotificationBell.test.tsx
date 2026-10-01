import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, click, type Rendered } from '@/test/render';

vi.mock('@/platform/audio/sfxPlayer', () => ({ playSfx: vi.fn(), preloadSfx: vi.fn() }));
vi.mock('@/platform/ui/LottieLoader', () => ({ default: () => null }));
vi.mock('@/platform/platformStore', () => ({
  platformActions: { openAccount: vi.fn() },
  hashOf: () => '#/account/notifications',
}));
vi.mock('@/platform/account/authStore', () => ({
  useAuth: () => ({ status: 'signedIn', user: { id: 'u1' } }),
  isSignedIn: () => true,
}));
vi.mock('@/platform/account/notificationsStore', async () => {
  const { createStore } = await import('@/shared/createStore');
  const { useStore } = await import('@/platform/hooks/useStore');
  const base = { type: 'SYSTEM', data: null, createdAt: new Date().toISOString() } as const;
  const store = createStore({
    items: [
      { ...base, id: 'n1', title: 'GREAT JOB!', body: 'You got 10 bonus points.', readAt: null },
      { ...base, id: 'n2', title: 'NEW GAME', body: 'Food Stream is open.', readAt: base.createdAt },
    ],
    unreadCount: 1,
    loading: false,
    loaded: true,
  });
  return {
    notificationsStore: store,
    notificationsActions: { refresh: vi.fn(async () => {}), markRead: vi.fn(async () => {}), init: vi.fn() },
    useNotifications: () => useStore(store, (state) => state),
    useUnreadCount: () => useStore(store, (state) => state.unreadCount),
  };
});

import NotificationBell from '@/platform/account/NotificationBell';
import { notificationsActions } from '@/platform/account/notificationsStore';

describe('NotificationBell popover', () => {
  let view: Rendered;
  const bell = () => view.container.querySelector('button[aria-haspopup="dialog"]');
  const dialog = () => view.container.querySelector('[role="dialog"]');

  beforeEach(() => {
    vi.clearAllMocks();
    view = render(<NotificationBell />);
  });
  afterEach(() => view.unmount());

  it('mở hộp: 5 mục mới nhất, tải lại, focus mục đầu; bấm mục chưa đọc -> markRead([id])', () => {
    expect(dialog()).toBeNull();
    expect(bell()?.getAttribute('aria-label')).toBe('Messages, 1 unread');

    click(bell());
    expect(bell()?.getAttribute('aria-expanded')).toBe('true');
    expect(dialog()).not.toBeNull();
    expect(notificationsActions.refresh).toHaveBeenCalledWith(false);
    const items = dialog()!.querySelectorAll('li button');
    expect(items).toHaveLength(2);
    expect(document.activeElement).toBe(items[0]);
    expect(items[0].textContent).toContain('GREAT JOB!');
    expect(items[0].textContent).toContain('JUST NOW');

    click(items[0]);
    expect(notificationsActions.markRead).toHaveBeenCalledWith(['n1']);
    // Đã đọc rồi thì không gọi lại
    click(items[1]);
    expect(notificationsActions.markRead).toHaveBeenCalledTimes(1);

    click([...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'MARK ALL READ') ?? null);
    expect(notificationsActions.markRead).toHaveBeenLastCalledWith();
  });

  it('đóng bằng Esc (focus về chuông) và bằng bấm ra ngoài', () => {
    click(bell());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(dialog()).toBeNull();
    expect(bell()?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(bell());

    click(bell());
    expect(dialog()).not.toBeNull();
    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(dialog()).toBeNull();
  });

  it('SEE ALL -> màn MESSAGES', () => {
    click(bell());
    click([...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'SEE ALL') ?? null);
    expect(dialog()).toBeNull();
    expect(window.location.hash).toBe('#/account/notifications');
  });
});
