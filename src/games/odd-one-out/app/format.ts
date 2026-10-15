/** mm:ss (làm tròn lên giây — 0,2 giây vẫn hiện 00:01 như bản gốc) */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
