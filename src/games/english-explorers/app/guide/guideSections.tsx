/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của Little English Explorers —
 * khung hiển thị dùng chung (ui/guide/GuideDialog). Số liệu lấy thẳng từ nội dung / luật để luôn khớp game.
 */
import { ALL_WORLDS_COUNT, WORLDS } from '@/games/english-explorers/content/worlds';
import { SCORING, SPEAK_MATCH } from '@/games/english-explorers/session/rules';
import GuideCard from '@/ui/guide/GuideCard/GuideCard';
import type { GuideSection } from '@/ui/guide/GuideDialog/GuideDialog';
import type { ToneColor } from '@/ui/tone';
import guide from '@/ui/guide/guideContent.module.scss';

export const GUIDE_TITLE = 'Hướng dẫn Little English Explorers cho giáo viên & phụ huynh';

const WORLD_TONES: ToneColor[] = ['green', 'blue', 'orange'];

export const EXPLORERS_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>Little English Explorers</b> luyện <b>nói câu tiếng Anh hoàn chỉnh</b> cho trẻ ~5 tuổi qua 3 "thế
          giới" con vật, mỗi thế giới một mẫu câu. Bé nhìn tranh, nghe câu hỏi, chọn đáp án rồi nói cả câu.
        </p>
        <p className={guide.note}>
          Máy chỉ nhận dạng chữ để khen bé, không chấm phát âm. Giáo viên / phụ huynh nên nghe bé nói và sửa
          nhẹ nhàng theo câu mẫu (nút HEAR IT).
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
          <b>LOOK:</b> nhìn tranh.
        </li>
        <li>
          <b>LISTEN:</b> máy đọc câu hỏi và 3 đáp án; bấm nút loa xanh để nghe lại.
        </li>
        <li>
          <b>CHOOSE:</b> chạm đáp án đúng (máy tính: phím 1–3 hoặc A–C). Chọn sai: đáp án đó mờ đi, máy nói
          "Try again!", bé chọn lại. Đúng: chỗ trống được điền, máy đọc cả câu.
        </li>
        <li>
          <b>SPEAK:</b> bé nói cả câu. Có micro: bấm <b>SAY IT</b> rồi nói, máy hiện câu nghe được; không có
          micro: nói với cô rồi bấm <b>I SAID IT!</b>
        </li>
      </ol>
    ),
  },
  {
    id: 'worlds',
    title: 'Các thế giới',
    short: 'Thế giới',
    content: (
      <>
        <div className={guide.cards}>
          {WORLDS.map((world, index) => (
            <GuideCard key={world.id} accent={WORLD_TONES[index % WORLD_TONES.length]}>
              <h4>
                {world.emoji} WORLD {index + 1} · {world.title}
              </h4>
              <p>
                Mẫu câu: <b>{world.grammar}</b> · {world.questions.length} câu
              </p>
              <ul className={guide.list}>
                {world.questions.map((question) => (
                  <li key={question.id}>
                    {question.sentence} — <i>{question.vi}</i>
                  </li>
                ))}
              </ul>
            </GuideCard>
          ))}
        </div>
        <p>
          <b>ALL WORLDS</b>: {ALL_WORLDS_COUNT} câu rải đều 3 thế giới (ôn tập).
        </p>
      </>
    ),
  },
  {
    id: 'speaking',
    title: 'Bước nói & micro',
    short: 'Bước nói',
    content: (
      <>
        <p>
          <b>SAY IT STEP: ON</b> (mặc định) — sau khi chọn đúng bé nói cả câu. <b>OFF</b> — chỉ chọn đáp án
          (ôn nhanh, máy không có micro).
        </p>
        <p>
          Micro dùng nhận dạng giọng nói của trình duyệt (Chrome / Edge / Android, Safari mới). Lần đầu trình
          duyệt hỏi quyền micro — bấm <b>Cho phép</b>. Không hỗ trợ / bị chặn thì nút micro không hiện, thay
          bằng <b>I SAID IT!</b>
        </p>
        <p className={guide.note}>
          Điểm nói +{SCORING.spoke}: có micro thì máy phải nghe được ít nhất {Math.round(SPEAK_MATCH * 100)}%
          từ của câu mẫu (không tính a / the); không có micro thì bấm I SAID IT! là được cộng.
        </p>
      </>
    ),
  },
  {
    id: 'scoring',
    title: 'Điểm & sao',
    short: 'Điểm',
    content: (
      <table className={guide.table}>
        <tbody>
          <tr>
            <td>Chọn đúng ngay lần đầu / sai 1 lần / sai 2 lần</td>
            <td>+{SCORING.byMisses.join(' / +')}</td>
          </tr>
          <tr>
            <td>Nói cả câu (xem Bước nói)</td>
            <td>+{SCORING.spoke}</td>
          </tr>
          <tr>
            <td>Sao (theo câu đúng ngay lần đầu)</td>
            <td>★★★ ≥ 90% · ★★ ≥ 60% · ★ hoàn thành</td>
          </tr>
          <tr>
            <td>Kim cương</td>
            <td>1 viên / câu đúng ngay lần đầu, tối đa 10 viên / ván</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'fixes',
    title: 'So với bản gốc',
    short: 'Bản gốc',
    content: (
      <ul className={guide.list}>
        <li>Bản gốc chỉ có 1 câu mẫu / thế giới; nay mỗi thế giới 10 câu, thêm ALL WORLDS.</li>
        <li>
          Gợi ý tiếng Việt hiện trước khi bé chọn (lộ đáp án) — đã bỏ khỏi game, nghĩa tiếng Việt nằm ở đây.
        </li>
        <li>Chọn rồi không đổi được — nay chọn sai thì chọn lại, điểm giảm dần theo số lần sai.</li>
        <li>
          Vào lại cùng thế giới để cộng điểm mãi — nay điểm tính theo ván, lưu kỷ lục / sao riêng từng thế
          giới.
        </li>
        <li>Esc ở màn chào bỏ qua bước nhập tên; báo lỗi bằng hộp alert tiếng Việt — đã bỏ.</li>
      </ul>
    ),
  },
];
