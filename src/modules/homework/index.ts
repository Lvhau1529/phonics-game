/** Public API của module homework: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as HomeworkBanner } from '@/modules/homework/components/HomeworkBanner/HomeworkBanner';
export { homeworkActions } from '@/modules/homework/stores/homeworkStore';
