/** Public API của module auth: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as AccountButton } from '@/modules/auth/components/AccountButton/AccountButton';
export { default as ChildRequired } from '@/modules/auth/components/ChildRequired/ChildRequired';
export {
  activeStudentId,
  authActions,
  authStore,
  isFamilySignedIn,
  isSignedIn,
  useAuth,
  watchActiveStudent,
} from '@/modules/auth/stores/authStore';
export { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
