/** Public API của module gems: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as GemCounter } from '@/modules/gems/components/GemCounter/GemCounter';
export { default as GemReward } from '@/modules/gems/components/GemReward/GemReward';
export {
  awardGems,
  GEM_RULES,
  isUnlocked,
  unlockGame,
  type WalletState,
  walletStore,
} from '@/modules/gems/stores/walletStore';
