export const SCENES = {
  BOOT: 'PoBootScene',
  PRELOAD: 'PoPreloadScene',
  /** Đại dương phía sau các màn React (Home / Setup / Results) */
  LOBBY: 'PoLobbyScene',
  /** Một lượt chơi */
  OCEAN: 'PoOceanScene',
  PAUSE: 'PoPauseScene',
} as const;

export type SceneKey = (typeof SCENES)[keyof typeof SCENES];

export const REGISTRY = {
  AUDIO: 'audio',
} as const;
