/**
 * Một AudioContext duy nhất cho cả app: màn React (sfxPlayer) và mọi game Phaser
 * (truyền vào config `audio.context`) dùng chung — không tạo context mới mỗi lần vào game
 * (iOS giới hạn số context), và âm thanh đã "mở khoá" một lần là dùng được ở mọi màn.
 */
let context: AudioContext | null = null;

export function getAudioContext(): AudioContext | undefined {
  if (context) return context;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  context = new Ctor();
  return context;
}

/**
 * Trình duyệt chỉ cho phát tiếng sau thao tác của người dùng; Phaser cũng tạm dừng context
 * khi rời tab / huỷ game — gọi trước mỗi lần phát.
 */
export function resumeAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => undefined);
}
