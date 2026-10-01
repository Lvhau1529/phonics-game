/**
 * Atlas tranh từ vựng (public/assets/bread-catcher/words/words.json, sinh bởi tools/bread_catcher/bakery_pack.py)
 * phải khớp với bảng từ: mọi từ của PICTURE VOCABULARY có tranh, mọi tranh đều là từ trong gói có sẵn.
 */
import { describe, expect, it } from 'vitest';
import { wordPictureFrame } from '@/games/bread-catcher/game/config/assets';
import { PACKS } from '@/games/bread-catcher/session/content';

type Atlas = { frames: Record<string, unknown> };
const [atlas] = Object.values(
  import.meta.glob<Atlas>('/public/assets/bread-catcher/words/words.json', {
    eager: true,
    import: 'default',
  }),
);
const frames = new Set(Object.keys(atlas?.frames ?? {}));

describe('word pictures', () => {
  it('has a picture for every Picture Vocabulary word', () => {
    const missing = PACKS.picture_vocab.words.filter((word) => !frames.has(wordPictureFrame(word)));
    expect(missing).toEqual([]);
  });

  it('only contains words from the built-in packs', () => {
    const known = new Set(PACKS.mixed_review.words.map(wordPictureFrame));
    expect([...frames].filter((frame) => !known.has(frame))).toEqual([]);
  });
});
