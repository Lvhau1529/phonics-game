/** Public API của module results: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as PointsSynced } from '@/modules/results/components/PointsSynced/PointsSynced';
export { postSoloResult, scoreSync } from '@/modules/results/stores/scoreSyncStore';
