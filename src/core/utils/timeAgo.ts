/**
 * Thời gian tương đối ngắn cho thông báo (chuông + màn MESSAGES):
 * "JUST NOW" · "5 MIN AGO" · "3 HOURS AGO" · "2 DAYS AGO" · ngày ("12 SEP").
 */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = now - Date.parse(iso);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'JUST NOW';
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'DAY' : 'DAYS'} AGO`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}
