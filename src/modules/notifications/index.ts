/** Public API của module notifications: app, games và module khác chỉ import từ đây (ESLint cấm import sâu) */
export { default as NotificationBell } from '@/modules/notifications/components/NotificationBell/NotificationBell';
export {
  notificationsActions,
  notificationsStore,
  useUnreadCount,
} from '@/modules/notifications/stores/notificationsStore';
