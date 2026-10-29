/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của Halloween Candy Quest —
 * khung hiển thị dùng chung (ui/guide/GuideDialog). Số liệu lấy thẳng từ nội dung / luật để luôn khớp game.
 */
import { LIBRARY } from '@/games/halloween-candy-quest/content/words';
import { ZONES } from '@/games/halloween-candy-quest/content/world';
import { CANDIES, TURN_OPTIONS, TYPE_LABELS, zoneSizes } from '@/games/halloween-candy-quest/session/rules';
import { MAX_CUSTOM_WORDS } from '@/games/halloween-candy-quest/session/storage';
import GuideCard from '@/ui/guide/GuideCard/GuideCard';
import type { GuideSection } from '@/ui/guide/GuideDialog/GuideDialog';
import type { ToneColor } from '@/ui/tone';
import guide from '@/ui/guide/guideContent.module.scss';

export const GUIDE_TITLE = 'Hướng dẫn Halloween Candy Quest cho giáo viên & phụ huynh';

const ZONE_TONES: ToneColor[] = ['orange', 'pink', 'purple'];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>Halloween Candy Quest</b> là cuộc phiêu lưu xin kẹo ở làng <b>Candy Moon</b> cho trẻ 5–6 tuổi:
          nhân vật tự đi tới từng ngôi nhà, bé <b>chạm cửa</b> để gõ, chủ nhà đưa ra một thử thách từ vựng
          tiếng Anh, trả lời đúng thì kẹo bay vào giỏ. Đi qua 3 khu vực rồi về lễ hội tổng kết.
        </p>
        <p className={guide.note}>
          Bé không cần biết đọc: mọi thao tác là nghe, nhìn và chạm. Trả lời sai không bao giờ bị trừ kẹo,
          luôn có lần thử lại và được xem đáp án.
        </p>
      </>
    ),
  },
  {
    id: 'modes',
    title: 'Chế độ chơi',
    short: 'Chế độ',
    content: (
      <>
        <div className={guide.cards}>
          <GuideCard accent="orange">
            <h4>SOLO ADVENTURE</h4>
            <p>
              Một bé, một giỏ kẹo. Mặc định 8 lượt (chọn {TURN_OPTIONS.solo.join(' / ')}), không giới hạn thời
              gian. Hết hiệu ứng nhận kẹo thì tự đi tiếp tới nhà sau.
            </p>
          </GuideCard>
          <GuideCard accent="purple">
            <h4>TEAM CANDY BATTLE</h4>
            <p>
              Hai đội chơi lần lượt trên <b>một màn hình</b> (máy chiếu). Mặc định 12 lượt = 6 lượt / đội
              (chọn {TURN_OPTIONS.team.join(' / ')}). Bí ngô quay ngẫu nhiên chọn đội đi trước một lần trước
              trận, sau đó luân phiên A–B–A–B.
            </p>
          </GuideCard>
        </div>
        <p>
          Team: sau mỗi lượt game <b>dừng lại</b> và chờ cô bấm <b>NEXT TURN</b> — không tự đổi đội. Mỗi đội
          có giỏ và bộ đếm riêng; lượt của đội A và lượt kế của đội B luôn cùng dạng thử thách, cùng số lựa
          chọn (khác từ) để công bằng. Có thể tắt <b>SHOW SCORE WHILE PLAYING</b> để chỉ hiện điểm ở cuối.
        </p>
      </>
    ),
  },
  {
    id: 'howto',
    title: 'Cách chơi một lượt',
    heading: 'Cách chơi một lượt (hướng dẫn cho bé)',
    short: 'Cách chơi',
    content: (
      <ol className={guide.steps}>
        <li>Nhân vật tự đi tới ngôi nhà sáng nhất.</li>
        <li>
          Cửa nhà phát sáng, có bàn tay 👆 — bé <b>chạm cửa một lần</b> để gõ.
        </li>
        <li>Cửa mở, chủ nhà ra chào "Trick or treat!" (chạm để qua nhanh).</li>
        <li>
          Thử thách hiện lên: nghe yêu cầu (nút 🔊 nghe lại bao nhiêu lần cũng được, không mất kẹo), rồi chạm
          đáp án.
        </li>
        <li>
          Đúng ngay: +{CANDIES.firstTry} kẹo. Sai: "Try again!", nghe lại và chọn lần 2 — đúng: +
          {CANDIES.secondTry} kẹo. Sai lần 2: game chỉ ra đáp án, đọc lại từ, +{CANDIES.missed} kẹo (không
          trừ).
        </li>
      </ol>
    ),
  },
  {
    id: 'challenges',
    title: 'Bốn dạng thử thách',
    short: 'Thử thách',
    content: (
      <>
        <table className={guide.table}>
          <tbody>
            <tr>
              <td>
                <b>{TYPE_LABELS.listen_choose}</b>
              </td>
              <td>Nghe "Find the pumpkin!", chạm hình đúng trong 2–3 thẻ. Dạng chính.</td>
            </tr>
            <tr>
              <td>
                <b>{TYPE_LABELS.find_object}</b>
              </td>
              <td>Nghe "Find the bat!", chạm đúng vật trong một góc cảnh Halloween.</td>
            </tr>
            <tr>
              <td>
                <b>{TYPE_LABELS.look_listen}</b>
              </td>
              <td>Nhìn 1 hình lớn, bấm từng loa (★ ● ▲) để nghe, bấm PICK dưới loa đọc đúng tên hình.</td>
            </tr>
            <tr>
              <td>
                <b>{TYPE_LABELS.match_pairs}</b>
              </td>
              <td>
                Chạm một hình rồi chạm một loa để ghép; đủ 2 cặp game kiểm tra cả thử thách (tính là 1 lượt).
                Chạm lại hình đã ghép để gỡ.
              </td>
            </tr>
          </tbody>
        </table>
        <p className={guide.note}>
          Look & Listen và Match the Pairs cần <b>giọng máy</b> đọc từng phương án — chọn WHO READS THE WORDS
          = TEACHER hoặc trình duyệt không có giọng đọc thì hai dạng này tự bỏ. Find the Object chỉ dùng từ
          trong thư viện (có sprite riêng); từ cô tự thêm sẽ ra dạng Listen & Choose.
        </p>
      </>
    ),
  },
  {
    id: 'zones',
    title: 'Ba khu vực',
    short: 'Khu vực',
    content: (
      <>
        <div className={guide.cards}>
          {ZONES.map((zone, index) => (
            <GuideCard key={zone.id} accent={ZONE_TONES[index]}>
              <h4>
                ZONE {index + 1} · {zone.title}
              </h4>
              <p>
                {index === 0 && 'Làm quen: gõ cửa, nghe và chọn hình (Listen & Choose, Find the Object).'}
                {index === 1 && 'Đan xen nghe chọn, tìm vật trong cảnh, Look & Listen.'}
                {index === 2 && 'Ôn lại, cân bằng cả 4 dạng (có Match the Pairs).'}
              </p>
            </GuideCard>
          ))}
        </div>
        <p>
          Khu vực mở theo <b>số lượt đã chơi</b>, không theo số câu đúng — bé luôn tới được khu cuối. Ví dụ 8
          lượt: {zoneSizes(8).join(' / ')} lượt mỗi khu; 12 lượt: {zoneSizes(12).join(' / ')}.
        </p>
      </>
    ),
  },
  {
    id: 'scoring',
    title: 'Kẹo, độ khó, đồng hồ',
    short: 'Điểm',
    content: (
      <table className={guide.table}>
        <tbody>
          <tr>
            <td>Đúng lần 1 / đúng lần 2 / chưa đúng</td>
            <td>
              +{CANDIES.firstTry} / +{CANDIES.secondTry} / +{CANDIES.missed} kẹo (không bao giờ trừ)
            </td>
          </tr>
          <tr>
            <td>EASY / NORMAL / MIXED</td>
            <td>2 lựa chọn / 3 lựa chọn / tăng dần theo khu vực (khu 1: 2, khu 2: xen kẽ, khu 3: 3)</td>
          </tr>
          <tr>
            <td>TIMER</td>
            <td>
              Mặc định OFF. Bật 30s / 45s: chỉ chạy sau khi máy đọc xong yêu cầu, dừng khi Pause. Hết giờ:
              hiện đáp án, 0 kẹo, không âm báo đáng sợ.
            </td>
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
    id: 'voice',
    title: 'Giọng đọc',
    short: 'Giọng đọc',
    content: (
      <>
        <p>
          Gói tài nguyên v1 <b>chưa có file ghi âm từng từ</b>, nên game đọc bằng giọng máy của trình duyệt
          (Chrome / Edge / Safari). WHO READS THE WORDS:
        </p>
        <ul className={guide.list}>
          <li>
            <b>GAME</b> — máy đọc yêu cầu và từ.
          </li>
          <li>
            <b>TEACHER</b> — máy im; khung câu hỏi hiện dòng "TEACHER, SAY: Find the …!" để cô đọc to.
          </li>
          <li>
            <b>BOTH</b> (mặc định) — máy đọc, cô có thể đọc lại hoặc giải thích thêm.
          </li>
        </ul>
        <p className={guide.note}>Nút VOICE (loa) ở màn chào tắt / bật giọng máy cho mọi game.</p>
      </>
    ),
  },
  {
    id: 'words',
    title: 'Bộ từ vựng',
    short: 'Từ vựng',
    content: (
      <>
        <p>
          Thư viện {LIBRARY.length} từ của gói tài nguyên (chạm thẻ để bật / tắt, 🔊 để nghe). Cô có thể thêm
          tới {MAX_CUSTOM_WORDS} từ riêng: gõ từ tiếng Anh, nghĩa (tuỳ chọn) và chọn ảnh PNG / JPG (tối đa 5
          MB, game tự thu nhỏ). Bộ từ và cài đặt lưu ngay trên máy này.
        </p>
        <p>
          Cần ít nhất <b>2 từ</b> để bắt đầu; NORMAL cần 3 từ (ít hơn thì tự dùng 2 lựa chọn). Ít từ hơn số
          lượt thì từ sẽ lặp lại (READY CHECK báo trước).
        </p>
        <ul className={guide.list}>
          {LIBRARY.map((word) => (
            <li key={word.id}>
              {word.text} — <i>{word.meaning}</i>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'teacher',
    title: 'Nút của giáo viên',
    short: 'Giáo viên',
    content: (
      <table className={guide.table}>
        <tbody>
          <tr>
            <td>⏸ PAUSE</td>
            <td>Dừng hoạt ảnh, đồng hồ và khoá đáp án; trong hộp Pause có nút âm thanh / nhạc.</td>
          </tr>
          <tr>
            <td>🔄 NEW QUESTION</td>
            <td>
              Thay câu lỗi / không phù hợp ngay trong lượt: giữ nguyên đội, lượt và cơ hội nhận đủ kẹo (chỉ
              dùng được trước khi lượt có kết quả).
            </td>
          </tr>
          <tr>
            <td>🏠 HOME</td>
            <td>Hỏi xác nhận trước khi rời ván (chống chạm nhầm).</td>
          </tr>
          <tr>
            <td>NEXT TURN</td>
            <td>Team: chuyển sang đội tiếp theo khi lượt đã xong.</td>
          </tr>
        </tbody>
      </table>
    ),
  },
];
