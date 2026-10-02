/**
 * Service điểm / xếp hạng: gọi `pointsRepository`; dòng xếp hạng đổi DTO → model (`RankingEntryModel`).
 * Màn hình chỉ gọi service, không gọi repository trực tiếp.
 */
import type { GameId, RangePreset, RankingEntry, RankingResponse } from '@phonics/contracts';
import { pointsRepository } from '@/platform/account/api/pointsRepository';
import { RankingEntryModel } from '@/platform/account/models/RankingEntryModel';

/** Bảng xếp hạng lớp: thông tin lớp / bộ lọc như BE, các dòng là model */
export type ClassRanking = Omit<RankingResponse, 'items' | 'me'> & {
  items: RankingEntryModel[];
  me: RankingEntryModel | null;
};

const toEntry = (data: RankingEntry) => new RankingEntryModel(data);

export const pointsService = {
  /** Tổng điểm của tôi là số liệu thống kê → giữ DTO */
  mine: (range: RangePreset = 'all', gameId?: GameId) => pointsRepository.mine({ range, gameId }),
  classRanking: async (range: RangePreset = 'all', gameId?: GameId): Promise<ClassRanking> => {
    const data = await pointsRepository.classRanking({ range, gameId });
    return { ...data, items: data.items.map(toEntry), me: data.me ? toEntry(data.me) : null };
  },
};
