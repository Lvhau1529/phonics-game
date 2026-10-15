/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của Odd One Out —
 * khung hiển thị dùng chung (ui/guide/GuideDialog). Số liệu lấy thẳng từ nội dung / luật để luôn khớp game.
 */
import { puzzlesFor, TOPICS } from '@/games/odd-one-out/content/puzzles';
import { MIN_SPOKEN_WORDS, MIXED_COUNTS, SCORING } from '@/games/odd-one-out/session/rules';
import GuideCard from '@/ui/guide/GuideCard/GuideCard';
import type { GuideSection } from '@/ui/guide/GuideDialog/GuideDialog';
import guide from '@/ui/guide/guideContent.module.scss';

export const GUIDE_TITLE = 'Hướng dẫn Odd One Out cho giáo viên & phụ huynh';

export const ODD_ONE_OUT_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>Odd One Out — Speaking Adventure</b> luyện <b>từ vựng</b> và <b>nói tiếng Anh</b> cho trẻ ~5
          tuổi: bé nhìn 4 hình, tìm hình <b>khác loại</b>, rồi nói lý do bằng một câu tiếng Anh, ví dụ{' '}
          <i>“I think the cat is different because the others are colors.”</i>
        </p>
        <p>
          Có {TOPICS.length} chủ đề × 6 câu (3 EASY + 3 CHALLENGE) = {TOPICS.length * 6} câu đố, cộng chế độ{' '}
          <b>MIXED</b> trộn mọi chủ đề.
        </p>
        <p className={guide.note}>
          Máy chỉ nhận dạng chữ để khen bé (“I heard: …”), không chấm phát âm. Giáo viên / phụ huynh nên nghe
          bé nói và sửa nhẹ nhàng theo câu mẫu.
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
          <b>NHÌN & CHỌN:</b> máy đọc “Which one is different?”. Bé chạm vào hình khác loại (máy tính: phím
          1–4 hoặc A–D). Bấm <b>LISTEN</b> để nghe lại câu hỏi và tên 4 hình.
        </li>
        <li>
          <b>NÓI LÝ DO:</b> bé nói theo khung “I think the ___ is different because …”. Có micro thì bấm{' '}
          <b>START SPEAKING</b>; không có thì nói với cô. Ở bước này bé vẫn <b>đổi được hình</b> đã chọn. Xong
          bấm <b>I'VE SPOKEN!</b>
        </li>
        <li>
          <b>XEM ĐÁP ÁN:</b> hình đúng sáng xanh, máy đọc câu mẫu; bé nghe và nói lại (<b>LISTEN AGAIN</b>).
          Bấm <b>NEXT PUZZLE</b> sang câu sau.
        </li>
        <li>Hết ván: xem sao, điểm, thời gian từng câu, hạng trên bảng xếp hạng và kim cương nhận được.</li>
      </ol>
    ),
  },
  {
    id: 'topics',
    title: 'Chủ đề',
    short: 'Chủ đề',
    content: (
      <>
        <p>
          Chọn một chủ đề: bé làm hết các câu của chủ đề ở cấp đã chọn (EASY / CHALLENGE: 3 câu, MIX: 6 câu).
          Chọn <b>MIXED</b>: trộn mọi chủ đề, số câu {MIXED_COUNTS.join(' / ')}, rải đều chủ đề.
        </p>
        <p>Thứ tự câu và vị trí 4 hình được xáo mỗi ván, bé không đoán được theo vị trí.</p>
      </>
    ),
  },
  {
    id: 'levels',
    title: 'Cấp độ',
    short: 'Cấp độ',
    content: (
      <div className={guide.cards}>
        <GuideCard accent="green">
          <h4>EASY</h4>
          <p>3 hình cùng chủ đề + 1 hình khác hẳn (vd 3 màu + con mèo). Dễ nói: “the others are colors”.</p>
        </GuideCard>
        <GuideCard accent="orange">
          <h4>CHALLENGE</h4>
          <p>
            Cả 4 hình cùng chủ đề, bé phải nghĩ tới đặc điểm (màu nóng / lạnh, có cánh, sống dưới nước...).
          </p>
        </GuideCard>
        <GuideCard accent="purple">
          <h4>MIX</h4>
          <p>Trộn cả hai cấp.</p>
        </GuideCard>
      </div>
    ),
  },
  {
    id: 'speaking',
    title: 'Bước nói & micro',
    short: 'Bước nói',
    content: (
      <>
        <p>
          <b>SPEAKING STEP: ON</b> (mặc định) — sau khi chọn hình bé nói lý do rồi mới xem đáp án. <b>OFF</b>{' '}
          — chọn xong xem đáp án ngay (ôn nhanh, máy không có micro, lớp đông).
        </p>
        <p>
          Micro dùng nhận dạng giọng nói của trình duyệt (Chrome / Edge / Android, Safari mới). Lần đầu trình
          duyệt hỏi quyền dùng micro — bấm <b>Cho phép</b>. Trình duyệt không hỗ trợ thì nút micro không hiện,
          bé nói với giáo viên.
        </p>
        <p className={guide.note}>
          Điểm nói +{SCORING.spoke}: có micro thì máy phải nghe được ít nhất {MIN_SPOKEN_WORDS} từ; micro
          không dùng được (không hỗ trợ / bị chặn) thì bấm I'VE SPOKEN là được cộng (giáo viên nghe bé nói).
          Bản gốc cộng điểm nói cho mọi lần bấm, kể cả khi bé không nói.
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
            <td>Chọn đúng hình khác loại</td>
            <td>+{SCORING.correct}</td>
          </tr>
          <tr>
            <td>Nói lý do (xem Bước nói)</td>
            <td>+{SCORING.spoke}</td>
          </tr>
          <tr>
            <td>Sao</td>
            <td>★★★ ≥ 90% đúng · ★★ ≥ 60% · ★ hoàn thành</td>
          </tr>
          <tr>
            <td>Kim cương</td>
            <td>1 viên / câu đúng, tối đa 10 viên / ván</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'leaderboard',
    title: 'Tên & bảng xếp hạng',
    short: 'Xếp hạng',
    content: (
      <>
        <p>
          Bé (hoặc cô) nhập <b>tên</b> trước khi chơi — tên hiện trên bảng xếp hạng. Bảng lưu trên{' '}
          <b>máy này</b> (không chia sẻ giữa các máy), mỗi tên chỉ hiện lượt tốt nhất.
        </p>
        <p>
          Xếp hạng: điểm cao hơn → nhiều câu đúng hơn → tổng thời gian ngắn hơn. Nên so sánh các ván cùng chủ
          đề, cùng cấp, cùng số câu (dùng 3 bộ lọc). Nút <b>CLEAR</b> xoá toàn bộ bảng trên máy (có hỏi lại).
        </p>
        <p className={guide.note}>
          Học sinh đã đăng nhập: điểm ván được gửi lên server (điểm lớp, xếp hạng lớp) như các game khác.
        </p>
      </>
    ),
  },
  {
    id: 'answers',
    title: 'Đáp án',
    heading: 'Đáp án 90 câu (cho giáo viên)',
    short: 'Đáp án',
    content: (
      <div className={guide.tableWrap}>
        <table className={guide.table}>
          <thead>
            <tr>
              <th>Chủ đề</th>
              <th>Câu (hình khác loại in đậm)</th>
            </tr>
          </thead>
          <tbody>
            {TOPICS.map((topic) => (
              <tr key={topic.id}>
                <td>
                  {topic.emoji} {topic.title}
                </td>
                <td>
                  {puzzlesFor(topic.id, 'mix').map((puzzle) => (
                    <div key={puzzle.id}>
                      {puzzle.level === 'easy' ? 'E' : 'C'}:{' '}
                      {puzzle.options.map((option, index) => (
                        <span key={option.name}>
                          {index > 0 && ', '}
                          {index === puzzle.odd ? <b>{option.name}</b> : option.name}
                        </span>
                      ))}{' '}
                      — {puzzle.vi}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
];
