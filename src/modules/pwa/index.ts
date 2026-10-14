/** Public API của module pwa: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as UpdateBanner } from '@/modules/pwa/components/UpdateBanner/UpdateBanner';
export { initPwa } from '@/modules/pwa/stores/updateStore';
