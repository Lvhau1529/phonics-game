/**
 * Nội dung HƯỚNG DẪN (tiếng Việt) cho giáo viên và phụ huynh.
 *
 * Trong game, chữ cho trẻ vẫn là tiếng Anh (plan §30); phần này dành cho người lớn
 * nên viết tiếng Việt. Số liệu (tốc độ, số từ...) lấy thẳng từ cấu hình để luôn khớp với game.
 */
import { CUSTOM_WORD_LETTERS, PACKS, wordLengthRange } from '@/games/bread-catcher/session/content';
import { CUSTOM_TIME, LEVELS, RULES } from '@/games/bread-catcher/session/settings';
import type { BuiltinPackId, LevelId } from '@/games/bread-catcher/session/types';

export type GuideSectionId =
  'about' | 'howto' | 'modes' | 'packs' | 'levels' | 'time' | 'combos' | 'teacher' | 'parents';

/** `short`: nhãn gọn cho bảng chọn 3×3 trên điện thoại */
export const GUIDE_SECTIONS: { id: GuideSectionId; title: string; short: string }[] = [
  { id: 'about', title: 'Giới thiệu', short: 'Giới thiệu' },
  { id: 'howto', title: 'Cách chơi', short: 'Cách chơi' },
  { id: 'modes', title: 'Chế độ chơi', short: 'Chế độ chơi' },
  { id: 'packs', title: 'Gói từ', short: 'Gói từ' },
  { id: 'levels', title: 'Cấp độ', short: 'Cấp độ' },
  { id: 'time', title: 'Thời gian', short: 'Thời gian' },
  { id: 'combos', title: 'Gợi ý kết hợp', short: 'Gợi ý' },
  { id: 'teacher', title: 'Dành cho giáo viên', short: 'Giáo viên' },
  { id: 'parents', title: 'Dành cho phụ huynh', short: 'Phụ huynh' },
];

// ---------------------------------------------------------------------------
// Gói từ (PHONICS PACK)
// ---------------------------------------------------------------------------
export interface PackGuide {
  /** Một dòng ngắn hiện ngay dưới lựa chọn ở màn Setup */
  short: string;
  detail: string;
  whenToUse: string;
}

const wordLengths = (id: BuiltinPackId) => {
  const { min, max } = wordLengthRange(PACKS[id].words);
  return min === max ? `${min} chữ cái` : `${min}–${max} chữ cái`;
};

const packStats = (id: BuiltinPackId) => `${PACKS[id].words.length} từ · ${wordLengths(id)}`;

export const PACK_GUIDE: Record<BuiltinPackId, PackGuide> = {
  blending_core: {
    short: `${packStats('blending_core')} — ghép vần ngắn như map, sit, cat, hop.`,
    detail:
      'Các từ ghép vần 3 chữ cái (CVC: phụ âm – nguyên âm – phụ âm) trong bảng Phonics M A S P T I N C O D, thêm "miss", "cast". Đây là trọng tâm của bài học: bé nghe/nhìn từ rồi ghép từng âm lại.',
    whenToUse: 'Luyện tập hằng ngày. Là gói mặc định.',
  },
  early_blending: {
    short: `${packStats('early_blending')} — am, at, it, in, on, ma. Dễ nhất.`,
    detail:
      'Chỉ gồm các từ 2 chữ cái. Ít chữ cái xuất hiện nên chữ "gây nhiễu" cũng ít, bé dễ nhận ra chữ cần hứng. Vì chỉ có vài từ nên các từ sẽ lặp lại thường xuyên.',
    whenToUse: 'Những buổi đầu làm quen với trò chơi, hoặc bé còn nhỏ / mới học chữ cái.',
  },
  picture_vocab: {
    short: `${packStats('picture_vocab')} — từ vựng theo tranh: sun, duck, monkey, dinosaur…`,
    detail:
      'Toàn bộ từ vựng có tranh trong bảng học, xếp theo chữ cái đầu (monkey, apple, sun, pen, turtle, igloo, nest, cat, octopus, dog…). Có cả từ dài như alligator, astronaut, dinosaur nên cần nhiều thời gian hơn. Khi chơi, tranh của từ hiện ở ô từ (chạm tranh để nghe lại) — gói BLENDING WORDS và MY WORDS cũng có tranh cho những từ có sẵn tranh (map, cat, pot…).',
    whenToUse: 'Ôn từ vựng sau khi đã học tranh. Nên chọn thời gian 90–120 giây hoặc tự nhập dài hơn.',
  },
  mixed_review: {
    short: `${packStats('mixed_review')} — trộn tất cả các gói.`,
    detail: 'Gộp cả ba gói trên (bỏ từ trùng): lúc thì từ ngắn dễ, lúc thì từ tranh dài.',
    whenToUse: 'Ôn tập tổng hợp cuối chủ đề / cuối tuần.',
  },
};

/** MY WORDS — giáo viên tự nhập từ */
export const CUSTOM_PACK_GUIDE: PackGuide & { rules: string[] } = {
  short: 'Tự gõ / dán bộ từ riêng cho buổi chơi — ví dụ đúng các từ của bài học hôm nay.',
  detail:
    'Chọn MY WORDS rồi gõ các từ vào ô bên dưới, cách nhau bằng dấu cách, dấu phẩy hoặc xuống dòng (dán cả danh sách từ Word / Zalo cũng được). Các từ hợp lệ hiện ngay thành thẻ bên dưới ô — bấm vào thẻ để nghe máy đọc thử, kiểm tra trước khi cho bé chơi. Bộ từ được nhớ cho lần sau; muốn đổi bài thì sửa hoặc bấm CLEAR.',
  whenToUse:
    'Khi muốn bé luyện đúng từ vừa học trên lớp, từ trong sách, hoặc ôn lại những từ bé hay sai. Nên nhập từ 5 từ trở lên để các từ không lặp quá nhiều.',
  rules: [
    'Chỉ nhận chữ cái tiếng Anh a–z: từ có số, dấu nháy (don’t), dấu cách bên trong hay chữ có dấu tiếng Việt sẽ bị bỏ qua và được liệt kê màu đỏ.',
    `Mỗi từ dài ${CUSTOM_WORD_LETTERS.min}–${CUSTOM_WORD_LETTERS.max} chữ cái. Từ trùng chỉ tính một lần; chữ hoa / thường đều được (trong game luôn in HOA).`,
    'Chữ "gây nhiễu" lấy từ chính các chữ cái trong bộ từ; nếu bộ từ quá ít chữ cái khác nhau, game bù thêm vài chữ trong bảng Phonics (M A S P T I N C O D).',
    'Cấp độ NORMAL / FAST đọc to từ bằng giọng máy — nên bấm thử thẻ từ để chắc máy đọc đúng.',
  ],
};

// ---------------------------------------------------------------------------
// Cấp độ (LEVEL)
// ---------------------------------------------------------------------------
export interface LevelGuide {
  /** Một dòng ngắn hiện ngay dưới lựa chọn ở màn Setup */
  short: string;
  /** Mức gợi ý trong ô từ */
  hint: string;
  speed: string;
  whenToUse: string;
}

/** Tốc độ rơi diễn đạt bằng lời cho người lớn dễ hình dung */
const SPEED_LABEL: Record<LevelId, string> = {
  gentle: 'Rơi rất chậm',
  easy: 'Rơi chậm',
  normal: 'Rơi vừa',
  fast: 'Rơi nhanh',
  hard: 'Rơi vừa – nhanh',
};

const speedOf = (id: LevelId) => {
  const { spawnMs, suggestedTime } = LEVELS[id];
  const seconds = String(spawnMs / 1000).replace('.', ',');
  return `${SPEED_LABEL[id]} · khoảng ${seconds} giây có 1 chữ mới · AUTO ${suggestedTime} giây/lượt`;
};

export const LEVEL_GUIDE: Record<LevelId, LevelGuide> = {
  gentle: {
    short: 'Chậm nhất. Hiện cả từ và chữ mờ trong từng ô — bé chỉ cần hứng theo.',
    hint: 'Hiện cả từ ở trên + chữ mờ sẵn trong từng ô (như tô theo nét).',
    speed: speedOf('gentle'),
    whenToUse: 'Bé mới làm quen, hoặc đang học chữ cái.',
  },
  easy: {
    short: 'Hiện cả từ, ô trống — bé tự tìm và hứng đúng thứ tự. (Mặc định)',
    hint: 'Hiện cả từ ở trên, các ô để trống.',
    speed: speedOf('easy'),
    whenToUse: 'Luyện tập thường ngày cho trẻ 5 tuổi.',
  },
  normal: {
    short: 'Không hiện từ: bé nghe đọc, chỉ được gợi ý chữ đầu tiên.',
    hint: 'Ẩn từ. Game đọc to từ (bấm nút loa để nghe lại), ô đầu tiên có chữ mờ gợi ý.',
    speed: speedOf('normal'),
    whenToUse: 'Khi bé đã quen EASY — luyện nghe âm rồi ghép thành chữ.',
  },
  fast: {
    short: 'Nhanh nhất, không gợi ý: bé chỉ nghe đọc rồi tự ghép chữ.',
    hint: 'Ẩn từ, tất cả ô để trống, chỉ nghe phát âm.',
    speed: speedOf('fast'),
    whenToUse: 'Bé đọc tốt, muốn thử thách.',
  },
  hard: {
    short: 'Hiện từ nhưng có "trò nghịch": rổ bị đảo, chữ né rổ, nhân vật phá game… Để giải trí.',
    hint: 'Hiện cả từ như EASY, nhưng liên tục có trò nghịch làm khó.',
    speed: speedOf('hard'),
    whenToUse:
      'Giải trí / thưởng cuối tiết. Không phải cấp "học khó hơn" mà là "chơi vui hơn" — luật tính điểm giữ nguyên.',
  },
};

/** Các trò nghịch của level HARD (giải thích cho người lớn) */
export const HARD_TRICKS = [
  'Đảo điều khiển, rổ teo nhỏ, gió thổi rổ trôi, động đất, lộn ngược màn hình, tắt đèn.',
  'Thông báo giả "+500 BONUS!", "TIME\'S UP!" rồi "JUST KIDDING!" (không ảnh hưởng điểm).',
  'Nhân vật vui nhộn chạy qua phá: đập văng rổ, làm rổ đứng im, ăn mất chữ, đá văng chữ, thả bom.',
  'Chữ cần hứng có thể né rổ, nảy ra khỏi rổ, đổi thành chữ khác; chữ sai có thể đuổi theo rổ hoặc giả dạng chữ đúng rồi "lộ mặt" giữa đường.',
  'Hứng trứng / bom chỉ làm rổ choáng một chút, KHÔNG bị tính là sai.',
];

export const TIME_GUIDE = {
  auto: 'AUTO: thời gian mỗi lượt tự theo cấp độ (GENTLE 90 giây … FAST 50 giây).',
  presets: 'Chọn nhanh 45 / 60 / 75 / 90 / 120 giây.',
  custom: `CUSTOM: tự gõ số giây (${CUSTOM_TIME.min}–${CUSTOM_TIME.max}) hoặc bấm − / + (mỗi lần 5 giây).`,
  note: `Mỗi lượt có tối đa ${RULES.wordsPerTurn} từ; hết giờ thì lượt kết thúc ngay. Đồng hồ tự dừng khi ăn mừng, chuyển từ, tạm dừng.`,
};

export const COMBOS: { stage: string; pack: string; level: string }[] = [
  { stage: 'Buổi đầu làm quen', pack: 'EARLY BLENDING', level: 'GENTLE' },
  { stage: 'Luyện thường ngày', pack: 'BLENDING WORDS', level: 'EASY → NORMAL khi đã quen' },
  { stage: 'Luyện nghe – ghép âm', pack: 'BLENDING WORDS', level: 'NORMAL / FAST' },
  { stage: 'Ôn từ vựng theo tranh', pack: 'PICTURE VOCABULARY', level: 'GENTLE / EASY, 90–120 giây' },
  { stage: 'Ôn tổng hợp', pack: 'MIXED REVIEW', level: 'EASY / NORMAL' },
  { stage: 'Luyện từ của bài hôm nay', pack: 'MY WORDS (tự nhập)', level: 'EASY → NORMAL' },
  { stage: 'Giải trí cuối tiết', pack: 'BLENDING WORDS', level: 'HARD' },
];
