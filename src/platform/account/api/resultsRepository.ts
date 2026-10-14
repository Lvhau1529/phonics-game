/**
 * Repository kết quả ván: chỉ khai báo endpoint và trả DTO đúng như BE.
 */
import { ENDPOINTS, GameResultResponse, type GameResultBody } from '@phonics/contracts';
import { HttpMethod, request } from '@/platform/api/client';

export const resultsRepository = {
  post: (body: GameResultBody) =>
    request(ENDPOINTS.game.results, { method: HttpMethod.POST, body, schema: GameResultResponse }),
};
