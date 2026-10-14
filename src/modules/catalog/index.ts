/** Public API của module catalog: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export {
  catalogStore,
  gamesSync,
  isUnlocked,
  unlockWithGems,
  useCatalog,
} from '@/modules/catalog/stores/catalogStore';
