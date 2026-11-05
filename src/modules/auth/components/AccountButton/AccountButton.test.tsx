import { afterEach, describe, expect, it, vi } from 'vitest';
import { click, render, type Rendered } from '@/test/render';

const config = vi.hoisted(() => ({ ACCOUNT_ENABLED: false }));
const openAccount = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({
  state: {
    status: 'guest',
    user: null as null | {
      id: string;
      displayName: string;
      firstName: string;
      avatarKey: string;
      isStudent: boolean;
    },
  },
}));

vi.mock('@/core/audio/sfxPlayer', () => ({ playSfx: vi.fn(), preloadSfx: vi.fn() }));
vi.mock('@/core/config/account', () => config);
vi.mock('@/core/navigation/platformStore', () => ({ platformActions: { openAccount } }));
vi.mock('@/modules/auth/stores/authStore', () => ({
  useAuth: () => auth.state,
  isSignedIn: (state: typeof auth.state) => state.user?.isStudent === true,
}));

const { default: AccountButton } = await import('@/modules/auth/components/AccountButton/AccountButton');

describe('AccountButton', () => {
  let view: Rendered | null = null;
  afterEach(() => {
    view?.unmount();
    view = null;
    openAccount.mockClear();
    auth.state = { status: 'guest', user: null };
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

  it('có API: khách bấm SIGN IN mở màn đăng nhập phụ huynh', () => {
    config.ACCOUNT_ENABLED = true;
    const onUnavailable = vi.fn();
    view = render(<AccountButton onUnavailable={onUnavailable} />);
    click(view.container.querySelector('button'));
    expect(openAccount).toHaveBeenCalledWith('login');
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('phụ huynh chưa chọn bé: WHO’S PLAYING? mở thẳng màn chọn bé', () => {
    config.ACCOUNT_ENABLED = true;
    auth.state = {
      status: 'signedIn',
      user: { id: 'p1', displayName: 'Lan', firstName: 'Lan', avatarKey: 'pip', isStudent: false },
    };
    view = render(<AccountButton onUnavailable={vi.fn()} />);
    const button = view.container.querySelector('button');
    expect(button?.textContent).toContain('PLAYING');
    click(button);
    expect(openAccount).toHaveBeenCalledWith();
  });

  it('bé đang chơi: bấm tên bé hỏi người lớn trước, chưa mở màn chọn bé', () => {
    config.ACCOUNT_ENABLED = true;
    auth.state = {
      status: 'signedIn',
      user: { id: 's1', displayName: 'Andy', firstName: 'Andy', avatarKey: 'pip', isStudent: true },
    };
    view = render(<AccountButton onUnavailable={vi.fn()} />);
    const button = view.container.querySelector('button');
    expect(button?.textContent).toContain('ANDY');
    click(button);
    expect(document.body.textContent).toContain('ASK A GROWN-UP');
    expect(openAccount).not.toHaveBeenCalled();
  });
});
