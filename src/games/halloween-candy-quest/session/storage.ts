/**
 * Lưu localStorage của Halloween Candy Quest (`phonics-arcade:halloween-candy-quest`): Teacher Setup, bộ từ
 * (từ thư viện đang bật + từ giáo viên tự thêm, ảnh upload dạng data URL) và tên đội / nhân vật lần trước.
 * Dữ liệu đọc lại được kiểm tra bằng zod — phần hỏng thì quay về mặc định, phần còn lại giữ nguyên.
 */
import { z } from 'zod';
import { CustomWordSchema, type CustomWord } from '@/games/halloween-candy-quest/content/schema';
import { LIBRARY } from '@/games/halloween-candy-quest/content/words';
import { CHARACTERS } from '@/games/halloween-candy-quest/content/world';
import { DEFAULT_SETTINGS, TURN_OPTIONS } from '@/games/halloween-candy-quest/session/rules';
import { QUESTION_TYPES, type Settings, type TeamSetup } from '@/games/halloween-candy-quest/session/types';
import { gameStorageKey, readJson, writeJson } from '@/core/storage/storage';

export const STORAGE_KEY = gameStorageKey('halloween-candy-quest');
export const MAX_CUSTOM_WORDS = 30;
export const MAX_TEAM_NAME = 16;

const SettingsSchema = z.strictObject({
  mode: z.enum(['solo', 'team']),
  soloTurns: z.literal([...TURN_OPTIONS.solo]),
  teamTurns: z.literal([...TURN_OPTIONS.team]),
  difficulty: z.enum(['easy', 'normal', 'mixed']),
  questionTypes: z.array(z.enum(QUESTION_TYPES)),
  timerSeconds: z.literal([0, 30, 45]),
  voiceMode: z.enum(['game', 'teacher', 'both']),
  showLiveScore: z.boolean(),
});

const characterIds = CHARACTERS.map((character) => character.id);
const TeamSetupSchema = z.strictObject({
  name: z.string().max(MAX_TEAM_NAME),
  characterId: z.enum(characterIds),
});

const VocabSchema = z.strictObject({
  library: z.array(z.string()),
  custom: z.array(CustomWordSchema).max(MAX_CUSTOM_WORDS),
});

export interface Vocabulary {
  /** id từ thư viện đang bật */
  library: string[];
  custom: CustomWord[];
}

export const DEFAULT_TEAMS: TeamSetup[] = [
  { name: 'TEAM PUMPKIN', characterId: 'pumpkin_kid' },
  { name: 'TEAM GHOST', characterId: 'little_ghost' },
];

export const defaultVocabulary = (): Vocabulary => ({ library: LIBRARY.map((word) => word.id), custom: [] });

interface SaveData {
  settings: Settings;
  vocabulary: Vocabulary;
  teams: TeamSetup[];
  soloCharacter: string;
}

function read(): SaveData {
  const stored =
    readJson<{ settings: unknown; vocabulary: unknown; teams: unknown; soloCharacter: unknown }>(
      STORAGE_KEY,
    ) ?? {};
  const settings = SettingsSchema.safeParse(stored.settings);
  const vocabulary = VocabSchema.safeParse(stored.vocabulary);
  const teams = z.tuple([TeamSetupSchema, TeamSetupSchema]).safeParse(stored.teams);
  const solo = z.enum(characterIds).safeParse(stored.soloCharacter);
  const libraryIds = new Set(LIBRARY.map((word) => word.id));
  return {
    settings: settings.success ? settings.data : { ...DEFAULT_SETTINGS },
    vocabulary: vocabulary.success
      ? { ...vocabulary.data, library: vocabulary.data.library.filter((id) => libraryIds.has(id)) }
      : defaultVocabulary(),
    teams: teams.success ? teams.data : DEFAULT_TEAMS.map((team) => ({ ...team })),
    soloCharacter: solo.success ? solo.data : CHARACTERS[0].id,
  };
}

const data = read();
const write = () => writeJson(STORAGE_KEY, data);

export const loadSaved = (): Readonly<SaveData> => data;

export function saveSettings(settings: Settings): void {
  data.settings = settings;
  write();
}

export function saveVocabulary(vocabulary: Vocabulary): void {
  data.vocabulary = vocabulary;
  write();
}

export function saveCharacters(soloCharacter: string, teams: TeamSetup[]): void {
  data.soloCharacter = soloCharacter;
  data.teams = teams;
  write();
}
