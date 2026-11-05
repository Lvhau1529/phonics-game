/**
 * Cửa "hỏi người lớn" trước khi rời hồ sơ bé (đổi bé / đăng xuất): một phép cộng hai chữ số, chọn 1 trong 3 đáp án.
 * Bé 5 tuổi khó tự qua; phụ huynh bấm một chạm. Sai thì đổi câu khác.
 */
import { useState } from 'react';
import { SFX } from '@/core/audio/sfx';
import { playSfx } from '@/core/audio/sfxPlayer';
import Button from '@/ui/Button/Button';
import Dialog from '@/ui/Dialog/Dialog';
import { MASCOT } from '@/ui/icons';
import styles from '@/modules/auth/components/GrownUpGate/GrownUpGate.module.scss';

interface Question {
  a: number;
  b: number;
  options: number[];
}

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function makeQuestion(): Question {
  const a = randomInt(11, 19);
  const b = randomInt(3, 9);
  const answer = a + b;
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const candidate = answer + randomInt(-4, 4);
    if (candidate !== answer && candidate > 0) wrong.add(candidate);
  }
  const options = [answer, ...wrong].sort(() => Math.random() - 0.5);
  return { a, b, options };
}

interface GrownUpGateProps {
  onPass: () => void;
  onClose: () => void;
}

export default function GrownUpGate({ onPass, onClose }: GrownUpGateProps) {
  const [question, setQuestion] = useState(makeQuestion);
  const [wrong, setWrong] = useState(false);

  const pick = (value: number) => {
    if (value === question.a + question.b) {
      onPass();
      return;
    }
    playSfx(SFX.WRONG_LETTER);
    setWrong(true);
    setQuestion(makeQuestion());
  };

  return (
    <Dialog title="ASK A GROWN-UP" image={MASCOT.hello} onClose={onClose}>
      <p className={styles.hint}>Grown-ups only: tap the answer.</p>
      <p className={styles.question} aria-live="polite">
        {question.a} + {question.b} = ?
      </p>
      <div className={styles.options}>
        {question.options.map((value) => (
          <Button key={value} color="blue" size="lg" sfx={null} onClick={() => pick(value)}>
            {value}
          </Button>
        ))}
      </div>
      {wrong && (
        <p className={styles.wrong} role="alert">
          Not quite. Try this one!
        </p>
      )}
    </Dialog>
  );
}
