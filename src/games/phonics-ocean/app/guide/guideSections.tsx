/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của Phonics Ocean —
 * khung hiển thị dùng chung (platform GuideDialog). Số liệu lấy thẳng từ cấu hình để luôn khớp game.
 */
import { imageUrl, playerUrl } from '@/games/phonics-ocean/app/assets';
import { LEVELS } from '@/games/phonics-ocean/content/levels';
import type { QuestionMode } from '@/games/phonics-ocean/content/schema';
import { FRENZY } from '@/games/phonics-ocean/session/frenzy';
import { RHYME_CHAIN } from '@/games/phonics-ocean/session/questions';
import { RULES } from '@/games/phonics-ocean/session/round';
import GuideCard from '@/ui/guide/GuideCard/GuideCard';
import type { GuideSection } from '@/ui/guide/GuideDialog/GuideDialog';
import guide from '@/ui/guide/guideContent.module.scss';

export const GUIDE_TITLE = 'Hướng dẫn Phonics Ocean cho giáo viên & phụ huynh';

/** Bé làm gì ở từng kiểu câu hỏi */
const MODE_GUIDE: Record<QuestionMode, string> = {
  initial: 'Máy đọc một ÂM (vd /m/), khung trên cùng hiện /m/. Bé ăn cá mang từ BẮT ĐẦU bằng âm đó (map).',
  word: 'Máy đọc một TỪ (khung hiện "?"). Bé ghép âm từ trái sang phải để tìm đúng từ; cá gây nhiễu chỉ khác 1 âm (tub / cub / rub) hoặc là cặp Magic-E (kit / kite).',
  rime: `Khung hiện một VẦN (vd -at). Bé ăn từ cùng họ vần (cat, hat, bat). ${RHYME_CHAIN} câu liền cùng một vần — ăn đúng ngay cả ${RHYME_CHAIN} câu được RHYME COMBO (+${RULES.points.rhymeCombo} điểm).`,
  contains: 'Khung hiện một CỤM CHỮ (bl, st, sh, ch...). Bé ăn từ có chứa cụm đó (ship, fish).',
  sentence: 'Ôn tập: máy đọc "I can see a ___" kèm một từ. Bé tìm từ còn thiếu; ăn đúng thì câu hiện đầy đủ.',
};

export const PHONICS_OCEAN_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>Phonics Ocean</b> là trò chơi kiểu <b>Feeding Frenzy</b> (bơi → ăn → lớn dần → tránh cá lớn) để
          luyện <b>phonics</b> cho trẻ mẫu giáo: mỗi con cá mồi mang một từ, bé phải nghe / nhìn mục tiêu,
          giải mã đúng rồi mới "ăn" để được điểm và lớn lên.
        </p>
        <p>
          Lỗi phonics <b>không bị phạt nặng</b>: ăn nhầm chỉ làm cá choáng một chút và mất chuỗi combo, không
          mất tim. Tim chỉ mất khi bị <b>cá săn mồi</b> cắn — tách áp lực trò chơi khỏi lỗi học tập.
        </p>
        <p className={guide.note}>
          Chữ trên cá được vẽ trực tiếp trong game từ danh sách từ của từng cấp, nên giáo viên có thể đổi danh
          sách từ theo tuần mà không cần vẽ lại hình.
        </p>
      </>
    ),
  },
  {
    id: 'howto',
    title: 'Cách chơi',
    heading: 'Cách chơi (hướng dẫn cho bé)',
    short: 'Cách chơi',
    content: (
      <>
        <ol className={guide.steps}>
          <li>
            Nghe máy đọc âm / từ. Bấm <b>nút loa xanh</b> trên khung mục tiêu (hoặc phím cách) để nghe lại.
          </li>
          <li>
            <b>Chạm vào chỗ muốn bơi tới</b> (hoặc giữ và kéo ngón tay) — cá của bé bơi theo. Máy tính: phím
            mũi tên / WASD hoặc bấm chuột.
          </li>
          <li>
            Bơi vào cá mang <b>đúng từ</b> để ăn: được +{RULES.points.firstTry} điểm (đúng sau khi ăn nhầm: +
            {RULES.points.retry}), máy đọc lại từ và thanh <b>Growth</b> tăng. Đúng liên tiếp 3 câu điểm ×2, 5
            câu điểm ×3.
          </li>
          <li>
            Ăn nhầm: cá choáng nhẹ, máy đọc lại đề. Nhầm {RULES.hintAfterWrong} lần liên tiếp thì cá đúng{' '}
            <b>phát sáng vàng</b> để gợi ý.
          </li>
          <li>
            Thanh Growth đầy → cá <b>lớn thêm một cỡ</b> (3 cỡ). Ăn đủ số từ của cấp là <b>LEVEL CLEAR!</b>
          </li>
          <li>
            Thấy dấu <b>!</b> đỏ ở mép màn hình là cá lớn sắp tới — bơi tránh ra. Bị cắn mất 1 tim, hết{' '}
            {RULES.hearts} tim thì lượt kết thúc.
          </li>
        </ol>
        <div className={guide.cards}>
          <GuideCard>
            <h3>
              <span className={guide.mascots}>
                <img src={imageUrl('school.tiny.clown.0')} alt="" width={28} height={20} />
                <img src={imageUrl('school.medium.idol.0')} alt="" width={32} height={28} />
                <img src={imageUrl('item.bolt')} alt="" width={24} height={28} />
              </span>
              Đàn cá &amp; FRENZY
            </h3>
            <p>
              Như Feeding Frenzy, biển luôn đông cá. Cá của bé ăn được cá <b>nhỏ hơn mình</b> (cỡ 1: cá nhỏ;
              cỡ 2: thêm cá vừa; cỡ 3: cả cá mú lớn) — +{FRENZY.points.tiny} / +{FRENZY.points.medium} / +
              {FRENZY.points.big} điểm. Va vào cá to hơn chỉ bị bật ra, không mất tim.
            </p>
            <p>
              Ăn liên tục làm đầy thanh tia sét → <b>FRENZY!</b> {FRENZY.durationMs / 1000} giây: điểm ×
              {FRENZY.multiplier}, bơi nhanh hơn. Lớn lên và qua màn vẫn chỉ nhờ ăn <b>đúng cá mang chữ</b>.
            </p>
          </GuideCard>
          <GuideCard>
            <h3>
              <span className={guide.mascots}>
                <img src={imageUrl('item.bubble')} alt="" width={28} height={28} />
                <img src={imageUrl('item.clock')} alt="" width={28} height={28} />
                <img src={imageUrl('item.heart')} alt="" width={28} height={28} />
              </span>
              Vật phẩm
            </h3>
            <p>
              Bong bóng: đỡ một lần bị cắn. Đồng hồ: +{RULES.bonusSeconds} giây. Tim: +1 tim. Mỗi vật phẩm +
              {RULES.points.powerUp} điểm.
            </p>
          </GuideCard>
          <GuideCard>
            <h3>
              <span className={guide.mascots}>
                <img src={playerUrl()} alt="" width={32} height={24} />
              </span>
              BIG FISH: OFF
            </h3>
            <p>
              Tắt cá săn mồi ở màn Setup để chơi <b>luyện tập</b>: không có tim, chỉ tập trung vào âm và từ —
              hợp với bé mới làm quen.
            </p>
          </GuideCard>
        </div>
      </>
    ),
  },
  {
    id: 'levels',
    title: 'Cấp độ',
    heading: 'Cấp độ (LEVEL) — đi từ âm đến từ',
    short: 'Cấp độ',
    content: (
      <>
        <p>
          Trình tự: âm đầu → ghép CVC → vần → cụm phụ âm → digraph → Magic E → ôn tập. Nên đi lần lượt từ cấp
          1; qua màn (đủ số từ trước khi hết giờ) thì có nút <b>NEXT LEVEL</b>.
        </p>
        <div className={guide.cards}>
          {LEVELS.map((level) => (
            <GuideCard key={level.id}>
              <h3>
                {level.number}. {level.title}
              </h3>
              <p className={guide.lead}>{level.focus}</p>
              <p>{MODE_GUIDE[level.mode]}</p>
              <p className={guide.use}>
                {level.correctToClear} từ để qua màn · {level.roundSeconds} giây · {level.startChoices}–
                {level.maxChoices} cá mỗi câu
              </p>
            </GuideCard>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'adaptive',
    title: 'Độ khó tự điều chỉnh',
    short: 'Độ khó',
    content: (
      <ul className={guide.list}>
        <li>
          Đúng liên tiếp {RULES.levelUpStreak} câu: thêm 1 cá mỗi câu (tối đa theo cấp) và cá bơi nhanh hơn
          một chút.
        </li>
        <li>
          Nhầm {RULES.hintAfterWrong} lần liên tiếp: bớt 1 cá, bật gợi ý phát sáng, cá săn mồi bơi chậm lại.
        </li>
        <li>
          Tỉ lệ đúng dưới {Math.round(RULES.struggleAccuracy * 100)}%: mỗi câu tối đa {RULES.struggleChoices}{' '}
          cá.
        </li>
        <li>
          Sao khi qua màn: 3 sao nếu đúng ≥ {Math.round(RULES.threeStarAccuracy * 100)}%, 2 sao nếu đạt ngưỡng
          thành thạo của cấp (thường 80%), còn lại 1 sao. Sao cao nhất của từng cấp được lưu trên máy.
        </li>
      </ul>
    ),
  },
  {
    id: 'teacher',
    title: 'Dành cho giáo viên',
    short: 'Giáo viên',
    content: (
      <ul className={guide.list}>
        <li>Trên máy chiếu: cả lớp cùng đọc to âm / từ trước khi bạn đại diện điều khiển cá.</li>
        <li>
          Nút ⏸ (hoặc phím P / Esc) tạm dừng; <b>QUIT</b> có hỏi xác nhận. Chuyển tab / app thì game tự dừng.
        </li>
        <li>
          Cấp nghe từ (CVC, Magic E, ôn tập) cần bật <b>VOICE</b>. Máy không đọc được thì khung mục tiêu tự
          hiện chữ để bé vẫn chơi được.
        </li>
        <li>
          Danh sách từ nằm ở word_bank.csv của resource pack; sửa rồi chạy lại công cụ dựng nội dung là game
          có từ mới.
        </li>
      </ul>
    ),
  },
  {
    id: 'parents',
    title: 'Dành cho phụ huynh',
    short: 'Phụ huynh',
    content: (
      <ul className={guide.list}>
        <li>
          Bắt đầu ở cấp <b>1. SOUND REEF</b>, có thể tắt BIG FISH lúc đầu; khi con quen thì bật lại cho vui
          hơn.
        </li>
        <li>Mỗi lượt ngắn (khoảng 1–1,5 phút). Cùng con đọc to từ sau mỗi lần cá "ăn" (vd: "/m/ – map").</li>
        <li>Có thể tắt MUSIC nhưng nên giữ VOICE.</li>
      </ul>
    ),
  },
];
