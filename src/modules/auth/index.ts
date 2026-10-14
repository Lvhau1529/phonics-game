/** Public API của module auth: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as AccountButton } from '@/modules/auth/components/AccountButton/AccountButton';
export { authActions, authStore, isSignedIn, useAuth } from '@/modules/auth/stores/authStore';
export { avatarUrl, isSceneAvatar } from '@/modules/auth/utils/avatars';
