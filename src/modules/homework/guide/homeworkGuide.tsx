/**
 * Nội dung HƯỚNG DẪN (tiếng Việt, cho giáo viên / phụ huynh) của phần Bài tập về nhà — khung GuideDialog dùng chung.
 */
import { AUTOSAVE_MS, MAX_RECORD_SECONDS } from '@/modules/homework/constants';
import type { GuideSection } from '@/ui/guide/GuideDialog/GuideDialog';
import guide from '@/ui/guide/guideContent.module.scss';

export const HOMEWORK_GUIDE_TITLE = 'Hướng dẫn Bài tập về nhà cho giáo viên & phụ huynh';

export const HOMEWORK_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'about',
    title: 'Giới thiệu',
    short: 'Giới thiệu',
    content: (
      <>
        <p>
          <b>HOMEWORK</b> là phiếu bài tập giáo viên soạn trên trang quản trị (theo đúng các dạng của phiếu
          giấy: điền âm thiếu, ô chữ, xếp chữ, tìm từ, khoanh từ đúng, sắp xếp câu, tô chữ và đọc to, ghi âm…)
          rồi giao cho lớp theo ngày. Bé đăng nhập tài khoản học sinh, bấm <b>HOMEWORK</b> ở màn chọn game để
          làm.
        </p>
        <p className={guide.note}>
          Bài chỉ mở trong cửa sổ thời gian giáo viên đặt (từ giờ mở tới hạn nộp). Hết hạn mà cho nộp muộn thì
          bài được gắn cờ "SENT LATE".
        </p>
      </>
    ),
  },
  {
    id: 'howto',
    title: 'Cách làm bài',
    heading: 'Cách làm bài (hướng dẫn cho bé)',
    short: 'Làm bài',
    content: (
      <ol className={guide.steps}>
        <li>
          Tab <b>TO DO</b> là các bài còn phải làm. Bấm <b>START</b> (hoặc <b>CONTINUE</b> nếu đang làm dở).
        </li>
        <li>
          Mỗi màn một câu. Máy tự đọc hướng dẫn; bấm <b>nút loa</b> để nghe lại. Chấm tròn phía trên là tiến
          độ — bấm vào chấm để nhảy tới câu đó.
        </li>
        <li>
          Mọi thao tác là <b>chạm</b> (không kéo thả): chạm chữ / từ / ảnh để chọn, chạm lại để bỏ. Dạng gõ
          chữ có bàn phím a–z ngay trên màn hình. Dạng tìm từ: kéo ngón tay theo đường thẳng qua các chữ.
        </li>
        <li>
          Câu trả lời <b>tự lưu</b> sau {AUTOSAVE_MS / 1000} giây (dòng SAVED ở cuối màn). Mất mạng vẫn làm
          tiếp được, có mạng lại máy tự gửi.
        </li>
        <li>
          Câu cuối có nút <b>SEND</b>. Còn câu chưa làm thì máy hỏi lại. Gửi xong thấy điểm ngay nếu bài không
          có câu ghi âm / tô chữ; có thì hiện <b>TEACHER IS CHECKING</b> cho tới khi giáo viên chấm.
        </li>
      </ol>
    ),
  },
  {
    id: 'record',
    title: 'Ghi âm & tô chữ',
    short: 'Ghi âm',
    content: (
      <>
        <p>
          Dạng <b>Trace and read</b> / <b>Say</b>: bé bấm nút mic, đọc to (tối đa {MAX_RECORD_SECONDS} giây),
          bấm dừng, nghe lại rồi <b>SEND</b> để tải lên. Tô chữ: dùng ngón tay tô theo chữ mẫu nét đứt, có
          UNDO / CLEAR, xong bấm <b>DONE</b>.
        </p>
        <p className={guide.note}>
          Lần đầu trình duyệt sẽ hỏi quyền dùng micro — hãy chọn Cho phép. Trên iPhone / iPad dùng Safari; bản
          ghi lưu dạng m4a. Thiết bị không có mic thì câu đó bỏ qua được, giáo viên sẽ thấy "no recording".
        </p>
      </>
    ),
  },
  {
    id: 'result',
    title: 'Kết quả & nhận xét',
    short: 'Kết quả',
    content: (
      <>
        <p>
          Màn <b>RESULT</b>: sao (3 sao từ 90 %, 2 sao từ 70 %, 1 sao từ 50 %), điểm và hạng trong lớp.{' '}
          <b>SEE ANSWERS</b> mở lại từng câu: đúng / sai / đúng một phần, đáp án đúng nếu giáo viên bật "cho
          xem đáp án" khi giao bài.
        </p>
        <p>
          Giáo viên có thể nhận xét chung cả bài hoặc từng câu; bé bấm <b>REPLY</b> để trả lời. Có nhận xét
          mới thì chuông thông báo và thẻ bài hiện "NEW NOTE". <b>TRY AGAIN</b> xuất hiện khi giáo viên cho
          làm nhiều lần; xếp hạng tính theo bài tốt nhất.
        </p>
      </>
    ),
  },
];
