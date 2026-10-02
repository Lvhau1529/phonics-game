/**
 * Repository kết quả ván: chỉ khai báo endpoint và trả DTO đúng như BE.
 */
import { ENDPOINTS, GameResultResponse, type GameResultBody } from '@phonics/contracts';
import { request } from '@/platform/api/client';

export const resultsRepository = {
  post: (body: GameResultBody) =>
    request(ENDPOINTS.game.results, { method: 'POST', body, schema: GameResultResponse }),
};
