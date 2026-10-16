import type { QuestionConfig } from '@phonics/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PreviewItem } from '@/modules/homework/models/preview';

vi.mock('@/core/audio/sfxPlayer', () => ({ playSfx: vi.fn() }));
vi.mock('@/core/config/preview', () => ({ ADMIN_ORIGINS: ['http://admin.test'] }));

const { applyContent, previewActions, previewStore } = await import('@/modules/homework/stores/previewStore');

const IMAGE = '00000000-0000-4000-8000-000000000001';
const config = (word: string): QuestionConfig => ({
  type: 'UNSCRAMBLE_WORD',
  imageMediaId: IMAGE,
  scrambled: [...word].reverse().join(''),
});
const item = (key: string, word: string): PreviewItem => ({
  key,
  instruction: 'Unscramble',
  example: null,
  config: config(word),
  answerKey: null,
});
const content = (items: PreviewItem[]) => ({ title: 'Week 1', items, media: {} });
const base = previewStore.get();

afterEach(() => previewStore.set(base));

describe('applyContent', () => {
  it('giữ câu trả lời của câu còn nguyên config, bỏ câu đổi config + kết quả cũ', () => {
    const state = {
      ...applyContent(base, content([item('a', 'cat'), item('b', 'dog')])),
      answers: {
        a: { type: 'UNSCRAMBLE_WORD', word: 'cat' },
        b: { type: 'UNSCRAMBLE_WORD', word: 'dog' },
      } as never,
      results: { a: 'right' as const },
      index: 1,
    };
    const next = applyContent(state, content([item('a', 'cat'), item('b', 'pig')]));
    expect(next.status).toBe('ready');
    expect(Object.keys(next.answers)).toEqual(['a']);
    expect(next.results).toBeNull();
    expect(next.index).toBe(1);
  });

  it('bớt câu → kéo câu đang mở về câu cuối', () => {
    const state = { ...applyContent(base, content([item('a', 'cat'), item('b', 'dog')])), index: 1 };
    expect(applyContent(state, content([item('a', 'cat')])).index).toBe(0);
    expect(applyContent(state, content([])).index).toBe(0);
  });
});

describe('message từ admin', () => {
  const parent = { postMessage: vi.fn() };

  const send = (data: unknown, origin = 'http://admin.test') =>
    window.dispatchEvent(new MessageEvent('message', { data, origin, source: parent as never }));

  it('chỉ nhận từ cửa sổ cha + origin admin được phép', () => {
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as never);
    const disconnect = previewActions.connect();
    expect(parent.postMessage).toHaveBeenCalledWith(
      { channel: 'phonics-preview', type: 'ready' },
      'http://admin.test',
    );
    const load = { channel: 'phonics-preview', type: 'load', ...content([item('a', 'cat')]) };
    send(load, 'http://evil.test');
    expect(previewStore.get().status).toBe('waiting');
    send(load);
    expect(previewStore.get().items).toHaveLength(1);

    previewActions.check();
    expect(parent.postMessage).toHaveBeenLastCalledWith(
      { channel: 'phonics-preview', type: 'check', answers: {} },
      'http://admin.test',
    );
    send({ channel: 'phonics-preview', type: 'results', results: { a: 'wrong' } });
    expect(previewStore.get().results).toEqual({ a: 'wrong' });
    disconnect();
    vi.restoreAllMocks();
  });
});
