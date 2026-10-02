/**
 * Repository điểm / xếp hạng của học sinh: chỉ khai báo endpoint và trả DTO đúng như BE.
 * Không map / format ở đây — việc đó của `pointsService`.
 */
import {
  ENDPOINTS,
  MyPointsResponse,
  RankingResponse,
  type GameId,
  type RangePreset,
} from '@phonics/contracts';
import { request } from '@/platform/api/client';

/** `type` (không phải interface) để gán được vào `QueryParams` của client */
export type PointsQuery = {
  range: RangePreset;
  gameId?: GameId;
};

export const pointsRepository = {
  mine: (query: PointsQuery) => request(ENDPOINTS.me.points, { query, schema: MyPointsResponse }),
  classRanking: (query: PointsQuery) => request(ENDPOINTS.me.ranking, { query, schema: RankingResponse }),
};
