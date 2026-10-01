import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDelayedLoading } from '@/platform/hooks/useDelayedLoading';
import { render, type Rendered } from '@/test/render';

function Probe({ loading }: { loading: boolean }) {
  const show = useDelayedLoading(loading, { delay: 200, minDuration: 400 });
  return <output>{show ? 'shown' : 'hidden'}</output>;
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useDelayedLoading', () => {
  let view: Rendered | null = null;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    view?.unmount();
    view = null;
    vi.useRealTimers();
  });

  const text = () => view?.container.textContent;

  it('chỉ hiện sau `delay`; tải xong trước đó thì không hiện gì', () => {
    view = render(<Probe loading />);
    expect(text()).toBe('hidden');
    advance(199);
    expect(text()).toBe('hidden');
    view.rerender(<Probe loading={false} />);
    advance(1000);
    expect(text()).toBe('hidden');
  });

  it('đã hiện thì giữ ít nhất `minDuration` rồi mới ẩn', () => {
    view = render(<Probe loading />);
    advance(200);
    expect(text()).toBe('shown');
    advance(100);
    view.rerender(<Probe loading={false} />);
    advance(299);
    expect(text()).toBe('shown');
    advance(1);
    expect(text()).toBe('hidden');
  });

  it('tải lâu hơn `minDuration` thì ẩn ngay khi xong', () => {
    view = render(<Probe loading />);
    advance(1000);
    expect(text()).toBe('shown');
    view.rerender(<Probe loading={false} />);
    advance(0);
    expect(text()).toBe('hidden');
  });
});
