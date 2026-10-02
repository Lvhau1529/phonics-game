/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của Food Stream —
 * khung hiển thị dùng chung (platform GuideDialog). Số liệu lấy thẳng từ cấu hình để luôn khớp game.
 */
import { streamerUrl } from '@/games/food-stream/app/assets';
import { LEVELS } from '@/games/food-stream/content/levels';
import { PACKS, packPreview } from '@/games/food-stream/content/packs';
import { SCORING } from '@/games/food-stream/session/scoring';
import GuideCard from '@/platform/ui/guide/GuideCard';
import type { GuideSection } from '@/platform/ui/guide/GuideDialog';
import guide from '@/platform/ui/guide/guideContent.module.scss';

export const GUIDE_TITLE = 'Hướng dẫn Food Stream cho giáo viên & phụ huynh';

/** Mô tả từng cấp cho người lớn (theo id cấp trong content/levels.ts) */
const LEVEL_GUIDE: Record<string, string> = {
  'hear-tap': 'Máy đọc một ÂM (vd /d/). Bé chọn món ăn có chữ cái phát ra âm đó. Luyện: âm → chữ.',
  'picture-sound':
    'Hiện một tranh (vd con chó) và đọc từ. Bé chọn chữ cái đầu của từ. Luyện: nhận ra âm đầu.',
  'find-word': 'Máy đọc một âm. Bé chọn tranh có từ bắt đầu bằng âm đó (vd /d/ → dog, không phải cat).',
  'build-word':
    'Nhìn tranh, nghe từ, bé cho streamer ăn từng chữ theo đúng thứ tự để ghép thành từ (vd d → o → g).',
  'missing-letter': 'Từ bị thiếu chữ ở giữa (vd d _ g). Bé chọn nguyên âm còn thiếu. Luyện: nguyên âm giữa.',
  'listen-build': 'Chỉ NGHE (không có tranh, không có chữ) rồi ghép từ. Khó nhất — luyện nghe và giải mã âm.',
  'speed-review':
    'Trộn tất cả kiểu câu hỏi, 4 lựa chọn, có đồng hồ đếm ngược cả lượt. Dùng để ôn tập / thi đua.',
};

const PACK_GUIDE: Record<string, string> = {
  'letter-d': 'Âm /d/: các từ có tranh bắt đầu bằng d, kèm từ ngắn để ghép.',
  'letter-o': 'Âm /o/: các từ có tranh bắt đầu bằng o, kèm từ CVC có o ở giữa để luyện nguyên âm.',
  'cvc-words': 'Chỉ các từ ngắn 2–3 chữ cái (CVC) của mọi gói: hợp với cấp ghép từ và điền chữ thiếu.',
  'all-letters': 'Trộn tất cả các gói chữ cái — ôn tập cuối chủ đề.',
};

export const FOOD_STREAM_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>Phonics Food Stream</b> là trò chơi luyện <b>phonics</b> cho trẻ mẫu giáo trong vai một buổi
          "livestream ăn uống": bé nghe âm / từ, chọn đúng món ăn mang chữ cái hoặc tranh để{' '}
          <b>cho streamer ăn</b>. Mỗi câu đúng được thêm người xem, tim và bình luận khen ngợi.
        </p>
        <p className={guide.note}>
          Người xem, tim, bình luận chỉ là phần thưởng hình ảnh: trò chơi không có mạng xã hội, không có chat
          thật, không quảng cáo và không thu thập tên học sinh.
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
      <ol className={guide.steps}>
        <li>
          Nghe máy đọc âm / từ (bấm <b>nút loa đỏ</b> hoặc phím cách để nghe lại).
        </li>
        <li>Nhìn khung đề: có thể là tranh, ký hiệu âm như /d/, hoặc các ô chữ cần ghép.</li>
        <li>
          Chạm vào <b>món ăn</b> đúng (máy tính: bấm chuột hoặc phím số 1–6). Món ăn bay vào miệng streamer và
          máy đọc lại âm / từ.
        </li>
        <li>
          Chọn sai thì món ăn rung nhẹ và mờ đi, bé chọn lại — không bị phạt. Sai 2 lần, món đúng sẽ có viền
          vàng nhấp nháy để gợi ý.
        </li>
        <li>
          Điểm: đúng +{SCORING.correct}, đúng ngay lần đầu thêm +{SCORING.firstTryBonus}. Đúng liên tiếp 3 câu
          điểm ×2, 5 câu điểm ×3 (COMBO).
        </li>
      </ol>
    ),
  },
  {
    id: 'modes',
    title: 'Chế độ chơi',
    short: 'Chế độ',
    content: (
      <div className={guide.cards}>
        <GuideCard>
          <h3>
            <span className={guide.mascots}>
              <img src={streamerUrl('girl')} alt="" width={30} height={37} />
            </span>
            SOLO — Một mình
          </h3>
          <p>
            Bé chọn nhân vật (PINK / BLUE) rồi chơi hết các câu của cấp. Cuối lượt được <b>1–3 sao</b> theo tỉ
            lệ trả lời đúng ngay lần đầu; sao cao nhất của từng cấp được lưu trên máy. Có nút{' '}
            <b>NEXT LEVEL</b> để lên cấp.
          </p>
        </GuideCard>
        <GuideCard>
          <h3>
            <span className={guide.mascots}>
              <img src={streamerUrl('girl')} alt="" width={30} height={37} />
              <img src={streamerUrl('boy')} alt="" width={30} height={37} />
            </span>
            CLASSROOM — Lớp học
          </h3>
          <p>
            <b>TEAM A</b> (nhân vật hồng) đấu <b>TEAM B</b> (nhân vật xanh) trên máy chiếu. Đội đi trước được
            chọn ngẫu nhiên, sau đó hai đội luân phiên mỗi câu một lượt và mỗi đội chỉ trả lời một lần.
          </p>
          <p>
            Kết thúc: màn ăn mừng đội thắng (hoặc hoà), hiện điểm cả hai đội — không có hình phạt cho đội
            thua.
          </p>
        </GuideCard>
      </div>
    ),
  },
  {
    id: 'packs',
    title: 'Gói từ',
    heading: 'Gói từ (WORD PACK)',
    short: 'Gói từ',
    content: (
      <div className={guide.cards}>
        {PACKS.map((pack) => (
          <GuideCard key={pack.id}>
            <h3>{pack.title}</h3>
            <p className={guide.lead}>{packPreview(pack, 5)}</p>
            <p>{PACK_GUIDE[pack.id]}</p>
          </GuideCard>
        ))}
      </div>
    ),
  },
  {
    id: 'levels',
    title: 'Cấp độ',
    heading: 'Cấp độ (LEVEL) — mỗi cấp một kiểu câu hỏi',
    short: 'Cấp độ',
    content: (
      <>
        <p>
          Cấp chỉ hiện nếu gói từ có đủ nội dung (vd gói CVC WORDS không có "Hear &amp; Tap"). Nên đi lần lượt
          từ cấp 1: cấp đầu không tính giờ để bé không bị áp lực.
        </p>
        <div className={guide.cards}>
          {LEVELS.map((level) => (
            <GuideCard key={level.id}>
              <h3>
                {level.number}. {level.title}
              </h3>
              <p>{LEVEL_GUIDE[level.id]}</p>
              <p className={guide.use}>
                Solo: {level.questions} câu · {level.choices} lựa chọn
                {level.timeLimitSec ? ` · ${level.timeLimitSec} giây` : ' · không tính giờ'}
              </p>
            </GuideCard>
          ))}
        </div>
        <p className={guide.note}>
          Máy không đọc được (hoặc đã tắt VOICE) thì trò chơi tự hiện ký hiệu âm / tranh / chữ thay cho giọng
          đọc để bé vẫn chơi được.
        </p>
      </>
    ),
  },
  {
    id: 'teacher',
    title: 'Dành cho giáo viên',
    short: 'Giáo viên',
    content: (
      <ul className={guide.list}>
        <li>
          <b>QUESTIONS PER TEAM</b>: 5 / 10 / 15 câu cho mỗi đội.
        </li>
        <li>
          <b>STEAL</b> bật: đội trả lời sai thì đội kia được <b>giành quyền</b> trả lời câu đó (được điểm
          nhưng không có thưởng "đúng ngay lần đầu"). Tắt: hiện đáp án rồi sang câu mới.
        </li>
        <li>
          <b>ANSWER TIMER</b>: giới hạn 10 / 20 giây mỗi lần trả lời; hết giờ tính như trả lời sai. OFF =
          không giới hạn.
        </li>
        <li>
          Nút ⏸ (hoặc phím P / Esc) tạm dừng; <b>QUIT</b> có hỏi xác nhận. Chuyển tab / app thì game tự dừng.
        </li>
        <li>Gợi ý: cả đội cùng đọc to âm trước khi bạn đại diện chạm chọn món.</li>
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
          Chọn <b>SOLO</b>, gói <b>LETTER D</b>, bắt đầu từ cấp <b>1. HEAR &amp; TAP</b>; khi được 3 sao thì
          bấm NEXT LEVEL.
        </li>
        <li>Cùng con nhắc lại âm sau mỗi lần streamer "ăn" (vd: "/d/ – /d/ – dog").</li>
        <li>Mỗi lần chơi ngắn (1 lượt ~ 1–2 phút). Có thể tắt MUSIC nhưng nên giữ VOICE.</li>
      </ul>
    ),
  },
];
