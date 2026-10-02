/**
 * Repository game: catalog công khai, game của học sinh, mở khoá bằng kim cương. Chỉ khai báo endpoint và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `gamesService`.
 */
import {
  ENDPOINTS,
  PublicGamesResponse,
  StudentGamesResponse,
  type UnlockWithGemsBody,
} from '@phonics/contracts';
import { request } from '@/platform/api/client';

export const gamesRepository = {
  catalog: () => request(ENDPOINTS.public.games, { schema: PublicGamesResponse, auth: 'none' }),
  mine: () => request(ENDPOINTS.me.games, { schema: StudentGamesResponse }),
  unlockWithGems: (gameId: string, body: UnlockWithGemsBody) =>
    request(ENDPOINTS.me.unlockGame(gameId), { method: 'POST', body }),
};
