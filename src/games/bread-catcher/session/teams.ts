/**
 * Đội chơi: tên mặc định là tên con vật tiếng Anh (plan §2), mỗi đội một mascot cố định.
 */
import gameConfig from '@/games/bread-catcher/content/game_config.json';
import type { MascotId, SetupDraft, Team, TeamId } from '@/games/bread-catcher/session/types';

export const TEAM_MASCOTS: readonly MascotId[] = ['lion', 'tiger', 'panda'];
export const SOLO_MASCOT: MascotId = 'bunny';

export const DEFAULT_TEAM_NAMES = gameConfig.classMode.defaultTeamNames as [string, string, string];
export const DEFAULT_PLAYER_NAME = gameConfig.soloMode.defaultPlayerName;

/** Đủ ngắn để không tràn HUD trên màn hình 360px */
export const MAX_NAME_LENGTH = 12;

/** Chuẩn hoá tên nhập vào; bỏ trống thì dùng tên mặc định */
export function cleanName(raw: string, fallback: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return (name || fallback).toUpperCase();
}

export function buildTeams(draft: SetupDraft): Team[] {
  if (draft.mode === 'solo') {
    return [{ id: 0, name: cleanName(draft.playerName, DEFAULT_PLAYER_NAME), mascot: SOLO_MASCOT }];
  }
  return draft.teamNames.map((name, index) => ({
    id: index as TeamId,
    name: cleanName(name, DEFAULT_TEAM_NAMES[index]),
    mascot: TEAM_MASCOTS[index],
  }));
}
