import { afterEach, describe, expect, it, vi } from 'vitest';
import { click, render, type Rendered } from '@/test/render';

const config = vi.hoisted(() => ({ ACCOUNT_ENABLED: false }));
const openAccount = vi.hoisted(() => vi.fn());

vi.mock('@/platform/audio/sfxPlayer', () => ({ playSfx: vi.fn(), preloadSfx: vi.fn() }));
vi.mock('@/platform/account/config', () => config);
vi.mock('@/platform/platformStore', () => ({ platformActions: { openAccount } }));
vi.mock('@/platform/account/authStore', () => ({ useAuth: () => ({ status: 'guest', user: null }) }));

const { default: AccountButton } = await import('@/platform/account/AccountButton');

describe('AccountButton', () => {
  let view: Rendered | null = null;
  afterEach(() => {
    view?.unmount();
    view = null;
    openAccount.mockClear();
  });

  it('chưa có API (BE chưa lên): vẫn hiện SIGN IN, bấm thì báo COMING SOON thay vì mở màn đăng nhập', () => {
    config.ACCOUNT_ENABLED = false;
    const onUnavailable = vi.fn();
    view = render(<AccountButton onUnavailable={onUnavailable} />);
    const button = view.container.querySelector('button');
    expect(button?.textContent).toContain('SIGN IN');
    click(button);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(openAccount).not.toHaveBeenCalled();
  });

  it('có API: khách bấm SIGN IN mở màn đăng nhập', () => {
    config.ACCOUNT_ENABLED = true;
    const onUnavailable = vi.fn();
    view = render(<AccountButton onUnavailable={onUnavailable} />);
    click(view.container.querySelector('button'));
    expect(openAccount).toHaveBeenCalledWith('login');
    expect(onUnavailable).not.toHaveBeenCalled();
  });
});
