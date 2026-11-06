/** Hồ sơ các bé của phụ huynh đang đăng nhập (màn chọn bé) — màn chỉ dùng hook này, không gọi service */
import { useRequest } from '@/core/hooks/useRequest';
import { authActions, useAuth } from '@/modules/auth/stores/authStore';

export function useFamilyProfiles() {
  const { user, parent } = useAuth();
  // Khoá theo phụ huynh: mở màn khi bé đang chơi → `profiles()` đưa phiên về phụ huynh trước khi tải
  const familyId = parent?.id ?? user?.id ?? '';
  return useRequest(() => authActions.profiles(), `family-profiles:${familyId}`);
}
