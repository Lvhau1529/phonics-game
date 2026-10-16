import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
// Tailwind phải nạp ĐẦU TIÊN: khai báo thứ tự layer (theme < base < components < utilities)
import '@/ui/styles/tailwind.css';
// Chỉ nạp subset cần dùng để bản build (và cache offline của PWA) nhẹ hơn
// Baloo 2: chữ giao diện
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
// Có dấu tiếng Việt cho phần Hướng dẫn (chỉ tải khi trang thật sự dùng chữ tiếng Việt)
import '@fontsource/baloo-2/vietnamese-600.css';
import '@fontsource/baloo-2/vietnamese-700.css';
import '@fontsource/baloo-2/vietnamese-800.css';
// Andika: chữ học (chữ cái, từ vựng) — font dành cho trẻ tập đọc
import '@fontsource/andika/latin-700.css';
// Reset + phần tử gốc; style của từng component nằm ở *.module.scss cạnh component
import '@/ui/styles/global.scss';
import { GAMES, UPCOMING } from '@/games';
import { authActions } from '@/modules/auth';
import { ACCOUNT_ENABLED } from '@/core/config/account';
import { gamesSync } from '@/modules/catalog';
import { homeworkActions } from '@/modules/homework';
import { notificationsActions } from '@/modules/notifications';
import { scoreSync } from '@/modules/results';
import { events } from '@/modules/analytics';
import PlatformApp from '@/app/PlatformApp/PlatformApp';
import { parseHash } from '@/core/navigation/platformStore';
import { initPwa } from '@/modules/pwa';

// Admin nhúng màn xem trước (#/preview) trong iframe: không cài PWA, không khôi phục phiên / đồng bộ
const EMBEDDED_PREVIEW = parseHash(window.location.hash).kind === 'preview';

if (!EMBEDDED_PREVIEW) initPwa();

// Tài khoản & đồng bộ (chỉ khi có VITE_API_URL): khôi phục phiên, gửi điểm / sự kiện đang chờ, thông báo, catalog
if (ACCOUNT_ENABLED && !EMBEDDED_PREVIEW) {
  void authActions.restore().finally(() => {
    scoreSync.init();
    notificationsActions.init();
    gamesSync.init();
    homeworkActions.init();
  });
  events.init();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformApp games={GAMES} upcoming={UPCOMING} />
    {/* Vercel Web Analytics: chỉ gửi dữ liệu khi chạy trên Vercel (bật Analytics trong dashboard) */}
    <Analytics />
  </StrictMode>,
);
