import type { RankingEntry } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { RankingEntryModel } from '@/platform/account/models/RankingEntryModel';

const entry = (rank: number): RankingEntry => ({
  rank,
  studentId: '0b1e6f2e-1c3a-4e5b-9d7f-123456789abc',
  displayName: 'Kid',
  avatarKey: 'pip',
  points: 42,
  isMe: false,
});

describe('RankingEntryModel', () => {
  it('isChampion (hạng 1) / isPodium (top 3)', () => {
    expect(new RankingEntryModel(entry(1))).toMatchObject({ isChampion: true, isPodium: true });
    expect(new RankingEntryModel(entry(3))).toMatchObject({ isChampion: false, isPodium: true });
    expect(new RankingEntryModel(entry(4))).toMatchObject({ isChampion: false, isPodium: false });
  });
});
