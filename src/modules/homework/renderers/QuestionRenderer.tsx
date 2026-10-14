/**
 * Chọn renderer theo `config.type`. `answer` / `answerKey` lệch type (dữ liệu cũ) thì coi như null để không crash.
 * Màn xem lại (`review`) kèm đáp án đúng dạng chữ khi GV cho xem.
 */
import type {
  MediaRef,
  QuestionAnswer,
  QuestionAnswerKey,
  QuestionConfig,
} from '@/modules/homework/models/question';
import {
  InlineChoiceRenderer,
  MultipleChoiceRenderer,
  OddOneOutRenderer,
  PatternNextRenderer,
} from '@/modules/homework/renderers/choiceRenderers';
import { expectedText } from '@/modules/homework/renderers/expected';
import { CrosswordRenderer, WordSearchRenderer } from '@/modules/homework/renderers/gridRenderers';
import { SpeakRenderer, TraceAndReadRenderer } from '@/modules/homework/renderers/manualRenderers';
import {
  FillBlankRenderer,
  MissingSoundRenderer,
  NumberPicturesRenderer,
  PickLettersRenderer,
  UnscrambleWordRenderer,
  WordOrderRenderer,
} from '@/modules/homework/renderers/textRenderers';
import type { RendererMode } from '@/modules/homework/renderers/types';
import styles from '@/modules/homework/renderers/renderers.module.scss';

interface QuestionRendererProps {
  config: QuestionConfig;
  answer: QuestionAnswer | null | undefined;
  answerKey?: QuestionAnswerKey | null;
  mode: RendererMode;
  onChange: (answer: QuestionAnswer) => void;
  onMedia?: (ref: MediaRef) => void;
}

export default function QuestionRenderer({
  config,
  answer,
  answerKey,
  mode,
  onChange,
  onMedia,
}: QuestionRendererProps) {
  const ans = answer && answer.type === config.type ? answer : null;
  const key = answerKey && answerKey.type === config.type ? answerKey : null;
  // Mỗi nhánh thu hẹp type theo config.type; `as never` vì TS không thu hẹp được union của answer theo config
  const common = { mode, onChange, onMedia, answer: ans as never, answerKey: key as never };
  let body: React.ReactNode;
  switch (config.type) {
    case 'MISSING_SOUND':
      body = <MissingSoundRenderer config={config} {...common} />;
      break;
    case 'CROSSWORD':
      body = <CrosswordRenderer config={config} {...common} />;
      break;
    case 'UNSCRAMBLE_WORD':
      body = <UnscrambleWordRenderer config={config} {...common} />;
      break;
    case 'PICK_LETTERS':
      body = <PickLettersRenderer config={config} {...common} />;
      break;
    case 'WORD_SEARCH':
      body = <WordSearchRenderer config={config} {...common} />;
      break;
    case 'ODD_ONE_OUT':
      body = <OddOneOutRenderer config={config} {...common} />;
      break;
    case 'PATTERN_NEXT':
      body = <PatternNextRenderer config={config} {...common} />;
      break;
    case 'NUMBER_PICTURES':
      body = <NumberPicturesRenderer config={config} {...common} />;
      break;
    case 'MULTIPLE_CHOICE':
      body = <MultipleChoiceRenderer config={config} {...common} />;
      break;
    case 'FILL_BLANK_WORD_BANK':
      body = <FillBlankRenderer config={config} {...common} />;
      break;
    case 'WORD_ORDER':
      body = <WordOrderRenderer config={config} {...common} />;
      break;
    case 'INLINE_CHOICE':
      body = <InlineChoiceRenderer config={config} {...common} />;
      break;
    case 'TRACE_AND_READ':
      body = <TraceAndReadRenderer config={config} {...common} />;
      break;
    case 'SPEAK':
      body = <SpeakRenderer config={config} {...common} />;
      break;
  }
  const expected = mode === 'review' ? expectedText(config, key) : null;
  return (
    <>
      {body}
      {expected && (
        <p className={styles.expected}>
          ANSWER: <b>{expected}</b>
        </p>
      )}
    </>
  );
}
