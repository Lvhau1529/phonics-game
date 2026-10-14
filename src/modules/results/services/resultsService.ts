/**
 * Service kết quả ván (scoreSync gọi). Store chỉ gọi service, không gọi repository trực tiếp.
 */
import type { GameResultBody } from '@phonics/contracts';
import { resultsRepository } from '@/modules/results/repositories/resultsRepository';

export const resultsService = {
  /** Ack điểm vừa cộng / tổng / hạng (số liệu) → giữ DTO */
  post: (body: GameResultBody) => resultsRepository.post(body),
};
