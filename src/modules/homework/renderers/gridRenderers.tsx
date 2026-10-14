/**
 * Dạng lưới: WORD_SEARCH (kéo ngón tay theo đường thẳng để khoanh từ), CROSSWORD (chạm ô rồi gõ chữ,
 * tự nhảy ô kế tiếp theo hướng của từ đang điền).
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import clsx from 'clsx';
import type { Cell, Direction } from '@/modules/homework/models/question';
import { useMedia } from '@/modules/homework/renderers/mediaContext';
import OnScreenKeyboard from '@/modules/homework/components/OnScreenKeyboard/OnScreenKeyboard';
import { norm, type RendererProps } from '@/modules/homework/renderers/types';
import styles from '@/modules/homework/renderers/renderers.module.scss';

const key = (c: Cell): string => `${c.r},${c.c}`;

/** Các ô trên đường thẳng từ a tới b (ngang / dọc / chéo); không thẳng → null */
function line(a: Cell, b: Cell): Cell[] | null {
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c));
  if (dr !== 0 && dc !== 0 && Math.abs(b.r - a.r) !== Math.abs(b.c - a.c)) return null;
  return Array.from({ length: len + 1 }, (_, i) => ({ r: a.r + dr * i, c: a.c + dc * i }));
}

/** Ô dưới con trỏ (data-cell="r,c") */
function cellAt(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]');
  if (!el?.dataset.cell) return null;
  const [r, c] = el.dataset.cell.split(',').map(Number);
  return { r, c };
}

// ---------- WORD_SEARCH ----------
export function WordSearchRenderer({ config, answer, mode, onChange }: RendererProps<'WORD_SEARCH'>) {
  const review = mode === 'review';
  const found = answer?.found ?? [];
  const start = useRef<Cell | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const foundCells = new Set(found.flatMap((f) => line(f.start, f.end)?.map(key) ?? []));
  const pathCells = new Set(path.map(key));
  const letterAt = (c: Cell) => config.grid[c.r]?.[c.c] ?? '';

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (review) return;
    const cell = cellAt(event.clientX, event.clientY);
    if (!cell) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = cell;
    setPath([cell]);
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const cell = cellAt(event.clientX, event.clientY);
    if (!cell) return;
    setPath(line(start.current, cell) ?? [start.current]);
  };
  const onUp = () => {
    if (!start.current) return;
    const cells = path;
    start.current = null;
    setPath([]);
    if (cells.length < 2) return;
    const text = cells.map(letterAt).join('');
    const reversed = text.split('').reverse().join('');
    const hit = config.words.find((w) => {
      const target = norm(w.word).replace(/[^a-z]/g, '');
      return (
        (target === norm(text) || target === norm(reversed)) &&
        !found.some((f) => norm(f.word) === norm(w.word))
      );
    });
    if (!hit) return;
    onChange({
      type: 'WORD_SEARCH',
      found: [...found, { word: hit.word, start: cells[0], end: cells[cells.length - 1] }],
    });
  };

  return (
    <div className={styles.col}>
      <div className={styles.bank}>
        {config.words.map((w) => (
          <BankWord
            key={w.word}
            word={w.word}
            imageMediaId={w.imageMediaId}
            found={found.some((f) => norm(f.word) === norm(w.word))}
          />
        ))}
      </div>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 40px))` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {config.grid.map((row, r) =>
          row.split('').map((letter, c) => {
            const id = key({ r, c });
            return (
              <span
                key={id}
                data-cell={id}
                className={clsx(
                  styles.cell,
                  foundCells.has(id) && styles.cellFound,
                  pathCells.has(id) && styles.cellPath,
                )}
              >
                {letter}
              </span>
            );
          }),
        )}
      </div>
      {!review && <p className={styles.hint}>DRAG YOUR FINGER OVER A WORD</p>}
    </div>
  );
}

function BankWord({ word, imageMediaId, found }: { word: string; imageMediaId?: string; found: boolean }) {
  const image = useMedia(imageMediaId);
  return (
    <span className={clsx(styles.bankItem, found && styles.found)}>
      {image && <img src={image.url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
      {word}
    </span>
  );
}

// ---------- CROSSWORD ----------
export function CrosswordRenderer({ config, answer, answerKey, mode, onChange }: RendererProps<'CROSSWORD'>) {
  const review = mode === 'review';
  const cells = answer?.cells ?? [];
  const prefilled = new Map(config.prefilled.map((p) => [key(p), p.letter]));
  const typed = new Map(cells.map((c) => [key(c), c.letter]));
  // Ô thuộc từ nào (để biết hướng nhảy + số thứ tự ở ô đầu)
  const wordCells = config.words.map((w) => ({
    ...w,
    cells: Array.from({ length: w.length }, (_, i) => ({
      r: w.start.r + (w.direction === 'down' ? i : 0),
      c: w.start.c + (w.direction === 'across' ? i : 0),
    })),
  }));
  const activeCells = new Set(wordCells.flatMap((w) => w.cells.map(key)));
  const numberAt = new Map(config.words.map((w) => [key(w.start), w.number]));
  const [active, setActive] = useState<Cell | null>(null);
  const [dir, setDir] = useState<Direction>('across');

  // Đáp án đúng theo ô (xem lại)
  const expected = new Map<string, string>();
  if (answerKey) {
    for (const w of wordCells) {
      const text =
        answerKey.words.find((k) => k.number === w.number && k.direction === w.direction)?.answer ?? '';
      w.cells.forEach((c, i) => expected.set(key(c), text[i] ?? ''));
    }
  }

  const wordThrough = (cell: Cell, direction: Direction) =>
    wordCells.find((w) => w.direction === direction && w.cells.some((c) => key(c) === key(cell)));

  const select = (cell: Cell) => {
    if (prefilled.has(key(cell))) return;
    // Cùng ô bấm lại → đổi hướng nếu ô thuộc cả hai từ
    const both = wordThrough(cell, 'across') && wordThrough(cell, 'down');
    const next =
      active && key(active) === key(cell) && both
        ? dir === 'across'
          ? 'down'
          : 'across'
        : wordThrough(cell, dir)
          ? dir
          : dir === 'across'
            ? 'down'
            : 'across';
    setDir(next);
    setActive(cell);
  };

  const advance = (from: Cell, step: 1 | -1) => {
    const word = wordThrough(from, dir);
    if (!word) return;
    const index = word.cells.findIndex((c) => key(c) === key(from));
    for (let i = index + step; i >= 0 && i < word.cells.length; i += step) {
      if (!prefilled.has(key(word.cells[i]))) return setActive(word.cells[i]);
    }
  };

  const setLetter = (cell: Cell, letter: string) =>
    onChange({
      type: 'CROSSWORD',
      cells: [...cells.filter((c) => key(c) !== key(cell)), { r: cell.r, c: cell.c, letter }].filter(
        (c) => c.letter !== '',
      ),
    });

  const onLetter = (letter: string) => {
    if (!active) return;
    setLetter(active, letter);
    advance(active, 1);
  };
  const onBackspace = () => {
    if (!active) return;
    if (typed.get(key(active))) return setLetter(active, '');
    advance(active, -1);
  };

  return (
    <div className={styles.col}>
      <div className={styles.clues}>
        {wordCells.map((w) => (
          <Clue
            key={`${w.number}-${w.direction}`}
            number={w.number}
            direction={w.direction}
            mediaId={w.clueMediaId}
            active={!!active && wordThrough(active, dir)?.number === w.number && dir === w.direction}
            onClick={
              review
                ? undefined
                : () => {
                    setDir(w.direction);
                    setActive(w.cells.find((c) => !prefilled.has(key(c))) ?? w.start);
                  }
            }
          />
        ))}
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 40px))` }}>
        {Array.from({ length: config.rows }, (_, r) =>
          Array.from({ length: config.cols }, (_, c) => {
            const cell = { r, c };
            const id = key(cell);
            if (!activeCells.has(id)) return <span key={id} className={clsx(styles.cell, styles.cellOff)} />;
            const fixed = prefilled.get(id);
            const letter = fixed ?? typed.get(id) ?? '';
            const want = expected.get(id);
            const state =
              review && want !== undefined && !fixed
                ? norm(want) === norm(letter)
                  ? styles.cellFound
                  : undefined
                : undefined;
            const number = numberAt.get(id);
            return (
              <button
                key={id}
                type="button"
                data-number={number}
                className={clsx(
                  styles.cell,
                  fixed && styles.cellFixed,
                  !review && active && key(active) === id && styles.cellActive,
                  number !== undefined && styles.cellNumber,
                  state,
                )}
                disabled={review || !!fixed}
                onClick={() => select(cell)}
              >
                {letter}
              </button>
            );
          }),
        )}
      </div>
      {!review && (
        <OnScreenKeyboard className={styles.keyboard} onLetter={onLetter} onBackspace={onBackspace} />
      )}
    </div>
  );
}

function Clue({
  number,
  direction,
  mediaId,
  active,
  onClick,
}: {
  number: number;
  direction: Direction;
  mediaId: string;
  active: boolean;
  onClick?: () => void;
}) {
  const image = useMedia(mediaId);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={clsx(styles.clue, active && styles.clueActive)}
      onClick={onClick}
    >
      <span>
        {number} {direction === 'across' ? '→' : '↓'}
      </span>
      {image && <img src={image.url} alt="" />}
    </Tag>
  );
}
