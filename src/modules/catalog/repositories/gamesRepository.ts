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
import { AuthMode, HttpMethod, request } from '@/core/api/client';

export const gamesRepository = {
  catalog: () => request(ENDPOINTS.public.games, { schema: PublicGamesResponse, auth: AuthMode.NONE }),
  mine: () => request(ENDPOINTS.me.games, { schema: StudentGamesResponse }),
  unlockWithGems: (gameId: string, body: UnlockWithGemsBody) =>
    request(ENDPOINTS.me.unlockGame(gameId), { method: HttpMethod.POST, body }),
};
