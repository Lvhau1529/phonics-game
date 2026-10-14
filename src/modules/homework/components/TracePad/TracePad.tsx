/**
 * Bảng tô chữ: canvas có chữ mẫu nét đứt (font Andika), bé tô bằng ngón tay / bút; UNDO · CLEAR · DONE
 * (ghép nền trắng + chữ mẫu + nét vẽ thành PNG, tải lên rồi trả `MediaRef`). Đã có ảnh (làm dở / xem lại)
 * thì hiện ảnh + TRACE AGAIN.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { MediaRef } from '@/modules/homework/models/question';
import { errorText } from '@/core/api/errorText';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import { useMediaUpload } from '@/modules/homework/hooks/useMediaUpload';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import Button from '@/ui/Button/Button';
import LottieLoader from '@/ui/LottieLoader/LottieLoader';
import styles from '@/modules/homework/components/TracePad/TracePad.module.scss';

interface TracePadProps {
  /** Chữ mẫu để tô */
  text: string;
  /** Ảnh đã lưu (traceMediaId) */
  mediaId?: string | null;
  disabled?: boolean;
  onUploaded: (ref: MediaRef) => void;
}

type Point = { x: number; y: number };
type Stroke = Point[];

const HEIGHT = 180;
const LINE_WIDTH = 7;

/** Vẽ chữ mẫu nét đứt + đường kẻ; `scale` = DPR */
function drawTemplate(ctx: CanvasRenderingContext2D, width: number, height: number, text: string): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#d9b98a';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  [0.25, 0.5, 0.8].forEach((ratio) => {
    ctx.beginPath();
    ctx.moveTo(12, height * ratio);
    ctx.lineTo(width - 12, height * ratio);
    ctx.stroke();
  });
  // Cỡ chữ theo chiều rộng để câu dài vẫn vừa
  let fontSize = Math.min(height * 0.55, 96);
  ctx.font = `700 ${fontSize}px Andika, 'Comic Sans MS', sans-serif`;
  while (ctx.measureText(text).width > width - 32 && fontSize > 24) {
    fontSize -= 4;
    ctx.font = `700 ${fontSize}px Andika, 'Comic Sans MS', sans-serif`;
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9a9a9a';
  ctx.setLineDash([6, 5]);
  ctx.strokeText(text, width / 2, height * 0.8);
  ctx.setLineDash([]);
}

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: readonly Stroke[],
  current: Stroke | null,
): void {
  ctx.strokeStyle = '#3f8cff';
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  [...strokes, ...(current ? [current] : [])].forEach((stroke) => {
    if (stroke.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.forEach((p) => ctx.lineTo(p.x, p.y));
    if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
    ctx.stroke();
  });
}

export default function TracePad({ text, mediaId, disabled, onUploaded }: TracePadProps) {
  const upload = useMediaUpload();
  const saved = useMedia(mediaId);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [again, setAgain] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !disabled && (!saved || again);

  // Vẽ lại khi đổi chữ / nét / kích thước (chờ font Andika nạp xong để chữ mẫu đúng font)
  useEffect(() => {
    if (!editing) return undefined;
    const el = canvas.current;
    if (!el) return undefined;
    let cancelled = false;
    const render = () => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = el.clientWidth;
      el.width = Math.round(width * dpr);
      el.height = Math.round(HEIGHT * dpr);
      const ctx = el.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawTemplate(ctx, width, HEIGHT, text);
      drawStrokes(ctx, strokes, current.current);
    };
    render();
    const fonts = document.fonts;
    if (fonts?.load) void fonts.load('700 48px Andika').then(render, () => undefined);
    window.addEventListener('resize', render);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', render);
    };
  }, [text, strokes, editing]);

  const pointOf = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const redrawLive = () => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTemplate(ctx, el.clientWidth, HEIGHT, text);
    drawStrokes(ctx, strokes, current.current);
  };

  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!editing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    current.current = [pointOf(event)];
    redrawLive();
  };
  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    current.current.push(pointOf(event));
    redrawLive();
  };
  const onUp = () => {
    if (!current.current) return;
    const stroke = current.current;
    current.current = null;
    setStrokes((prev) => [...prev, stroke]);
  };

  const done = async () => {
    const el = canvas.current;
    if (!el || strokes.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        el.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      );
      const ref = await upload(blob, {
        kind: 'IMAGE',
        fileName: 'trace.png',
        width: el.width,
        height: el.height,
      });
      playSfx(SFX.WORD_COMPLETE);
      onUploaded(ref);
      setStrokes([]);
      setAgain(false);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setUploading(false);
    }
  };

  if (!editing) {
    return saved ? (
      <div className={styles.pad}>
        <img className={styles.preview} src={saved.url} alt={`Traced: ${text}`} />
        {!disabled && (
          <Button color="cream" onClick={() => setAgain(true)}>
            TRACE AGAIN
          </Button>
        )}
      </div>
    ) : (
      <p className={styles.hint}>NOT TRACED YET</p>
    );
  }

  return (
    <div className={styles.pad}>
      <canvas
        ref={canvas}
        className={styles.canvas}
        style={{ height: HEIGHT }}
        aria-label={`Trace: ${text}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <div className={styles.actions}>
        <Button
          color="cream"
          disabled={strokes.length === 0 || uploading}
          onClick={() => setStrokes((s) => s.slice(0, -1))}
        >
          UNDO
        </Button>
        <Button color="red" disabled={strokes.length === 0 || uploading} onClick={() => setStrokes([])}>
          CLEAR
        </Button>
        <Button color="green" disabled={strokes.length === 0 || uploading} onClick={done}>
          {uploading ? <LottieLoader size="sm" /> : 'DONE'}
        </Button>
      </div>
      {strokes.length === 0 && <p className={styles.hint}>TRACE THE LETTERS WITH YOUR FINGER</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
