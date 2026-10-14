/** Điểm / xếp hạng cho màn React — màn chỉ dùng các hook này, không gọi service */
import { RangePreset, type GameId } from '@phonics/contracts';
import { useRequest } from '@/core/hooks/useRequest';
import { pointsService } from '@/modules/points/services/pointsService';

export type { GameId, RangePreset };

/** Tổng điểm của tôi (mọi thời gian); `userId` để không lẫn cache giữa các tài khoản */
export const useMyPoints = (userId: string | undefined) =>
  useRequest(() => pointsService.mine(RangePreset.enum.all), `points:${userId ?? ''}`);

/** Bảng xếp hạng lớp theo khoảng thời gian, lọc theo game (undefined = mọi game) */
export const useClassRanking = (range: RangePreset, gameId: GameId | undefined, userId: string | undefined) =>
  useRequest(() => pointsService.classRanking(range, gameId), `${range}:${gameId ?? 'all'}:${userId ?? ''}`);
