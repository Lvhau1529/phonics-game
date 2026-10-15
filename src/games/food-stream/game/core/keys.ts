export const SCENES = {
  BOOT: 'FsBootScene',
  PRELOAD: 'FsPreloadScene',
  /** Phòng stream phía sau các màn React (Home / Setup / Results) */
  STUDIO: 'FsStudioScene',
  /** Một lượt chơi */
  LIVE: 'FsLiveScene',
  PAUSE: 'FsPauseScene',
} as const;

export type SceneKey = (typeof SCENES)[keyof typeof SCENES];

export const REGISTRY = {
  AUDIO: 'audio',
} as const;
