# HALLOWEEN CANDY QUEST

**GAMEPLAY & IMPLEMENTATION SPECIFICATION — v1.0**  
**Tagline:** *Trick or Treat! Collect Candies, Learn English.*  
**Ngôn ngữ tài liệu:** Tiếng Việt  
**Đối tượng:** Trẻ mẫu giáo 5–6 tuổi, giáo viên tiếng Anh  
**Trạng thái:** Gameplay đã chốt; dùng để triển khai game dựa trên **Halloween Candy Quest Resource Pack v1.0**.  
**Phạm vi:** Tài liệu thiết kế và yêu cầu triển khai; không chứa mã nguồn.

---

## 1. TẦM NHÌN VÀ MỤC TIÊU

### 1.1. Ý tưởng

Người chơi tham gia lễ hội Halloween tại ngôi làng **Candy Moon**, hóa thân thành một nhân vật dễ thương, đi dọc các con đường, gõ cửa nhà và giải thử thách nhận biết từ vựng tiếng Anh để nhận kẹo. Sau khi khám phá ba khu vực, nhân vật mang giỏ kẹo về lễ hội để tổng kết.

**Trò chơi phải giống một cuộc phiêu lưu xin kẹo, không phải bộ câu hỏi trắc nghiệm được đổi nền.** Hoạt động học được gắn với cửa nhà, đồ vật tương tác, nhân vật chủ nhà, hiệu ứng kẹo bay vào giỏ và sự chuyển đổi khu vực.

### 1.2. Mục tiêu giáo dục

- Nghe và nhận biết từ/cụm từ tiếng Anh thông dụng.
- Liên kết **âm thanh ↔ hình ảnh ↔ từ vựng** theo khả năng của trẻ.
- Rèn kỹ năng quan sát, nghe chỉ dẫn, chờ lượt và hợp tác.
- Củng cố từ vựng qua lặp lại có kiểm soát, không tạo áp lực về tốc độ.

### 1.3. Nguyên tắc không được vi phạm

1. **Trẻ 5 tuổi không cần biết đọc để chơi.** Chữ chỉ bổ trợ; tương tác chính là nghe, nhìn, chạm/click.
2. Không có máu, mất mạng, quái vật tấn công, hình ảnh gây sợ hãi hoặc âm thanh trừng phạt.
3. Trả lời sai **không trừ điểm**, luôn có cơ hội sửa và xem đáp án.
4. Mọi tương tác quan trọng có vùng bấm lớn, phản hồi rõ ràng.
5. Team Battle có **hai đội chơi lần lượt trên một màn hình**, không bắt buộc hai thiết bị.
6. Giáo viên có thể chọn bộ từ có sẵn hoặc thêm từ/hình/âm thanh riêng.
7. Phần thưởng là **kẹo**, điểm số không dựa trên tốc độ hay may rủi.
8. Trò chơi hỗ trợ **desktop/máy chiếu và mobile**; ưu tiên bố cục dễ thao tác.
9. Pixel art 16-bit thống nhất, hiển thị rõ pixel; không làm mờ hoặc bóp méo sprite.

---

## 2. CẤU HÌNH CHÍNH THỨC

| Hạng mục | Quyết định |
|---|---|
| Game mode | `solo` hoặc `team_battle` |
| Số đội | Solo: 1; Team Battle: 2 đội luân phiên |
| Nhân vật | 6 lựa chọn, các đội chọn nhân vật khác nhau |
| Điều khiển | **Hybrid**: tự đi + trẻ bấm đồ vật tương tác |
| Loop | Đi đến nhà → gõ cửa → thử thách → nhận kẹo → chuyển lượt/tiếp tục |
| Bản đồ | 3 zone theo tiến độ lượt |
| Câu hỏi | 4 dạng, ưu tiên Listen & Choose / Find the Object |
| Solo mặc định | 8 lượt, không giới hạn thời gian |
| Team mặc định | 12 lượt, mỗi đội 6 lượt |
| Độ khó | Easy: 2 đáp án; Normal: 3 đáp án; Mixed: điều chỉnh theo từng lượt |
| Thưởng | Đúng lần 1: 2 kẹo; đúng lần 2: 1 kẹo; chưa đúng: 0 |
| Số lần thử | Tối đa 2 lần hoàn chỉnh/một thử thách |
| Đồng hồ | Tắt mặc định; tùy chọn 30 hoặc 45 giây |
| Audio | Game Voice + giáo viên đọc; có chế độ chỉ game / chỉ giáo viên |
| Phong cách | Pixel art đáng yêu, cam–tím–xanh đêm, không kinh dị |

**Quy ước:** *Turn* (lượt) là một thử thách trọn vẹn, không phải từng thao tác chạm. Một thử thách ghép 2 cặp vẫn được tính là **1 lượt**.

---

## 3. THẾ GIỚI GAME VÀ TIẾN TRÌNH

### 3.1. Zone 1 — Pumpkin Garden

- Bối cảnh: vườn bí ngô, hàng rào, nhà gỗ, đèn lồng, bầu trời chạng vạng.
- Trải nghiệm: học thao tác chọn nhà, gõ cửa, nghe và chọn hình.
- NPC: ma thân thiện, chủ nhà bí ngô.
- Dạng câu hỏi ưu tiên: Listen & Choose.
- Audio: `sfx_door_knock.wav`, `sfx_door_open.wav`.

### 3.2. Zone 2 — Candy Village

- Bối cảnh: phố kẹo, nhà phù thủy, cửa hàng bánh kẹo, trang trí Halloween.
- Trải nghiệm: thẻ nghe/chọn đan xen tìm vật thể trong cảnh, mở rương kẹo.
- NPC: phù thủy, mèo đen, cú mèo, nhân vật thân thiện.
- Dạng câu hỏi: Listen & Choose, Look & Listen, Find the Object.

### 3.3. Zone 3 — Magic Castle

- Bối cảnh: lâu đài phép thuật, đèn tím, cổng thành, những ngôi sao và rương quà.
- Trải nghiệm: ôn lại từ đã gặp, thử thách ghép cặp ngắn, kết thúc ở lễ hội.
- NPC: ma nhỏ, vampire dễ thương, nhân vật lâu đài.
- Dạng câu hỏi: cân bằng nhiều loại, có thể lặp lại từ đã học dưới hình thức mới.

### 3.4. Cách chia zone

Với **12 lượt**: lượt 1–4 ở Pumpkin Garden, 5–8 ở Candy Village, 9–12 ở Magic Castle.  
Với **8 lượt**: chia gần đều thành 3–3–2.  
Với số lượt khác: phân bổ gần đều từ trái sang phải, không zone nào bị bỏ trống nếu tổng số lượt từ 3 trở lên.

**Quan trọng:** Zone mở bằng *số lượt đã hoàn thành*, không phụ thuộc vào số câu đúng. Trẻ luôn đến được khu vực cuối. Khi chuyển zone, phát `sfx_zone_unlock.wav`, hiển thị hoạt ảnh ngắn có thể bỏ qua.

---

## 4. SÁU NHÂN VẬT CHÍNH

| ID | Nhân vật | Tên hiển thị | Hình đại diện trong pack |
|---|---|---|---|
| `pumpkin_kid` | Bé bí ngô | Pumpkin Kid | `characters/pumpkin_kid/portrait_96.png` |
| `little_ghost` | Ma nhỏ | Little Ghost | `characters/little_ghost/portrait_96.png` |
| `mini_witch` | Phù thủy nhỏ | Mini Witch | `characters/mini_witch/portrait_96.png` |
| `vampire_kid` | Ma cà rồng nhỏ | Vampire Kid | `characters/vampire_kid/portrait_96.png` |
| `black_cat` | Mèo đen | Black Cat | `characters/black_cat/portrait_96.png` |
| `bat_explorer` | Dơi khám phá | Bat Explorer | `characters/bat_explorer/portrait_96.png` |

Các nhân vật có **cùng khả năng** và không mang lợi thế điểm số. Mỗi đội chọn **một nhân vật khác đội còn lại**; Solo chọn tự do.

### 4.1. Trạng thái animation

| State logic | Nguồn sprite ví dụ | Khi nào phát |
|---|---|---|
| `idle` | `characters/pumpkin_kid/idle_01.png`, `_02.png` | Đứng chờ, nghe hướng dẫn |
| `walk` | `walk_01.png`, `_02.png` | Tự đi theo đường dẫn |
| `knock` | `knock_01.png`, `_02.png` | Gõ cửa |
| `celebrate` | `celebrate_01.png`, `_02.png` | Trả lời đúng, nhận kẹo |
| `try_again` | `try_again_01.png`, `_02.png` | Gợi ý nhẹ sau câu sai |

Mỗi nhân vật có spritesheet `characters/spritesheets/<id>_5x2_48px.png`: **2 cột × 5 hàng, mỗi frame 48×48**, lần lượt các hàng `idle`, `walk`, `knock`, `celebrate`, `try_again`. Có thể dùng các PNG frame rời thay vì spritesheet.

**Hạn chế v1:** chỉ có 2 frame/trạng thái, chưa có đầy đủ góc nhìn 8 hướng. MVP dùng nhân vật hướng ngang và tự động di chuyển dọc tuyến ngắn; khi di chuyển ngược chiều có thể flip theo trục X khi hình phù hợp. Trước sản xuất chính thức cần kiểm tra pose/viền pixel.

---

## 5. ĐIỀU KHIỂN HYBRID VÀ LUỒNG MỘT LƯỢT

### 5.1. Nguyên tắc điều khiển

- Nhân vật **tự đi** trên tuyến đã thiết kế đến ngôi nhà mục tiêu.
- Khi đến trước nhà: nhân vật chuyển `idle`; cửa có hiệu ứng sáng, gợi ý icon bàn tay.
- Trẻ chạm/click vào cửa **một lần** để gõ cửa; input khóa tạm trong lúc phát hoạt ảnh để tránh double-click.
- Nhà mở, một NPC hiện ra và câu hỏi được đưa lên ở lớp giao diện phía trước.
- Trẻ chọn đáp án, nhận phản hồi, xem hiệu ứng kẹo, rồi tiếp tục.
- Các vật tương tác phụ (bí ngô, đèn, bảng chỉ đường) phát hoạt ảnh nhỏ **không cộng điểm**.
- Không cần WASD, phím mũi tên hay joystick; mọi thao tác học tập dùng click/touch.

### 5.2. State machine của một lượt

```text
READY_TURN
  -> AUTO_WALK
  -> WAIT_FOR_KNOCK
  -> KNOCK_ANIMATION
  -> NPC_GREETING
  -> QUESTION_PROMPT
  -> WAIT_FOR_ANSWER
      -> FIRST_CORRECT -> REWARD_2
      -> FIRST_WRONG   -> HINT -> SECOND_ATTEMPT
                              -> SECOND_CORRECT -> REWARD_1
                              -> SECOND_WRONG   -> REVEAL_ANSWER -> REWARD_0
      -> OPTIONAL_TIMEOUT -> REVEAL_ANSWER -> REWARD_0
  -> REWARD_ANIMATION
  -> TURN_COMPLETE
  -> [SOLO: NEXT_TURN] | [TEAM: WAIT_FOR_TEACHER_NEXT]
```

**Chuyển trạng thái phải chặn thao tác lặp:** một lần chạm không được tính hai đáp án, một phần thưởng không được cộng hai lần, và không thể chuyển lượt trong lúc câu hỏi đang xác thực.

### 5.3. Nhịp độ đề xuất

| Bước | Thời gian định hướng | Có thể bỏ qua? |
|---|---|---|
| Tự đi tới cửa | 1–3 giây | Không cần; giữ ngắn |
| Gõ và mở cửa | ~1 giây | Không |
| NPC chào | ~1 giây | Có |
| Trẻ nhận biết và trả lời | Theo trẻ; không giới hạn mặc định | Không |
| Nhận kẹo | 1–2 giây | Giáo viên có thể chuyển tiếp sau khi cộng điểm |
| Chuyển zone | 2–3 giây | Có |

Thời lượng ước tính của cả buổi phụ thuộc vào tốc độ lớp và cách giáo viên tổ chức; không dùng thời gian ước tính làm điều kiện thắng/thua.

---

## 6. BỐN LOẠI THỬ THÁCH

### 6.1. Listen & Choose — dạng chính

**Input:** 1 từ đích, ảnh đúng, 1–2 ảnh nhiễu khác nhau, audio của từ đích hoặc giáo viên đọc.  
**Giao diện:** nút nghe lại, 2 thẻ ở Easy / 3 thẻ ở Normal, các hình to rõ, không cần đọc nhãn.  
**Thao tác:** nghe yêu cầu `Find the pumpkin!`, chạm ảnh `pumpkin`.  
**Kết quả:** xác định đúng/sai trên một lần chọn.

### 6.2. Look & Listen

**Input:** 1 ảnh từ đích, 2–3 lựa chọn âm thanh có gắn với các từ khác nhau.  
**Giao diện:** 1 ảnh lớn phía trên và 2–3 nút loa có đánh dấu dễ phân biệt.  
**Thao tác:** chạm loa để nghe từng lựa chọn, rồi chọn lựa chọn phát âm đúng.  
**Điều kiện đủ:** phải có audio cho **tất cả đáp án**, không chỉ từ đúng. Nếu không đủ, tự động loại dạng này khỏi danh sách câu hỏi khả dụng.

### 6.3. Find the Object

**Input:** tên đồ vật đích, ảnh đồ vật và ít nhất một vật nhiễu, vùng chạm hợp lệ.  
**Giao diện:** một góc cảnh Halloween với các object **được đặt thành sprite riêng trên lớp tương tác**, không chỉ nằm trong background vẽ sẵn.  
**Thao tác:** nghe `Find the bat!`, chạm vào bat trong cảnh.  
**Nguyên tắc:** mỗi vật có hit area lớn hơn phần hình; không dùng vật bé hoặc bị che khuất; không yêu cầu tìm nhiều bước.  
**Fallback:** nếu từ giáo viên thêm chưa có sprite thích hợp trong cảnh, chuyển sang Listen & Choose bằng thẻ hình.

### 6.4. Match the Pairs

**Input:** 2 từ khác nhau, 2 hình và 2 audio tương ứng.  
**Giao diện:** 2 hình bên trái, 2 nút loa bên phải.  
**Thao tác:** trẻ lần lượt nối/chọn một hình rồi một nút loa; sau khi tạo đủ 2 cặp, game kiểm tra **toàn bộ thử thách**.  
**Chấm điểm:** đủ 2 cặp đúng ở lần kiểm tra đầu = 2 kẹo; đúng sau khi sửa = 1 kẹo; vẫn sai = 0. Không tính từng cặp như lượt riêng.  
**Mobile:** ưu tiên **chạm hai đầu để ghép**, không bắt buộc kéo đường bằng ngón tay.

### 6.5. Phân bổ câu hỏi

- Mặc định đề xuất: **Listen & Choose 45%**, **Find the Object 25%**, **Look & Listen 20%**, **Match the Pairs 10%** khi đủ tài nguyên.
- Easy có thể giảm Match the Pairs và tăng Listen & Choose.
- Các tỷ lệ là **trọng số lựa chọn**, không bắt buộc đúng tỷ lệ nếu giáo viên có ít từ hoặc audio/hình chưa đầy đủ.
- Chỉ sinh câu hỏi hợp lệ; **không hiển thị ảnh trống, audio thiếu hoặc đáp án lặp**.

---

## 7. CHẤM ĐIỂM, SỬA SAI VÀ TRỢ GIÚP

| Tình huống | Kẹo cộng | Phản hồi |
|---|---:|---|
| Đúng ngay lần 1 | +2 | Vui mừng, kẹo bay vào giỏ |
| Sai lần 1, đúng sau gợi ý | +1 | Phát lại âm thanh, gợi ý nhẹ, nhận 1 kẹo |
| Sai cả 2 lần | +0 | Hiển thị đáp án, đọc lại từ, không phạt |
| Hết thời gian (khi bật timer) | +0 | Bình tĩnh hiện đáp án; không trừ kẹo |
| Giáo viên bỏ qua câu vì lỗi nội dung | +0 cho **câu bị loại**, thay bằng câu hợp lệ **trong cùng lượt** | Không tiêu hao lượt, không bất lợi đội hiện tại |

- Kẹo là **điểm số duy nhất**. Hình dạng/màu kẹo không có mức giá trị khác nhau.
- Nút `Replay Audio` dùng không giới hạn; nghe lại **không tính là một lần trả lời**, không giảm điểm.
- Gợi ý sau lần sai đầu: phát lại từ, có thể nhấn sáng vùng lựa chọn/cặp theo cách không tiết lộ tức thì đáp án; nếu dùng chế độ hỗ trợ mạnh, vẫn ghi +1 khi trả lời lần hai.
- Khi sai lần hai, game **hiển thị câu đúng rõ ràng** rồi tiếp tục. Không có âm báo thất bại gay gắt.
- Với Team Battle, nếu giáo viên muốn bỏ qua vì lớp chưa sẵn sàng, dùng **Pause**; `Skip Question` được định nghĩa là **thay câu lỗi/không phù hợp**, không tự động mất lượt.

### 7.1. Ngăn cộng điểm trùng

Mỗi lượt có `turnId` duy nhất; chỉ phát thưởng và cập nhật điểm **một lần** khi lượt chuyển sang `TURN_COMPLETE`. Hiệu ứng hoạt hình có thể lặp nhưng không được cộng điểm lại.

### 7.2. Đồng hồ tùy chọn

- Mặc định **OFF**. Nếu bật: `30s` hoặc `45s`.
- Timer chỉ chạy sau khi câu hỏi đã hiển thị và âm thanh yêu cầu phát xong lần đầu; tạm dừng khi giáo viên Pause.
- Hết giờ: game hiển thị đáp án và kết thúc thử thách với 0 kẹo, không hiển thị thông báo khiến trẻ sợ.

---

## 8. SOLO ADVENTURE

### 8.1. Luồng màn hình

`Title → Mode Selection → (Teacher Setup nếu cần) → Character Selection → Pumpkin Garden → Candy Village → Magic Castle → Solo Results → Replay / Home`

### 8.2. Luật Solo

- Một nhân vật, một giỏ kẹo.
- Mặc định 8 lượt, không giới hạn thời gian.
- Chọn câu hỏi từ bộ từ giáo viên đã cấu hình.
- Sau hiệu ứng nhận kẹo, tự động tiếp tục tới nhà kế tiếp; giáo viên/người chơi có thể Pause.
- Hoàn thành đủ lượt thì tới lễ hội, đổ kẹo vào giỏ lớn, hiện số kẹo thu thập được và nút `Play Again`.
- Không có bảng xếp hạng, điều kiện thất bại, hoặc yêu cầu điểm tối thiểu để mở khu vực.

### 8.3. Màn hình kết quả Solo

Hiển thị nhân vật được chọn, tổng kẹo, lời chúc mừng `Happy Halloween!`, các nút `Play Again` và `Home`. Có thể bổ sung thống kê từ vựng cho giáo viên ở khu vực riêng, nhưng **không hiển thị điểm yếu của trẻ như một hình phạt**.

---

## 9. TEAM CANDY BATTLE — HAI ĐỘI CHƠI LẦN LƯỢT

### 9.1. Luồng màn hình

`Title → Mode Selection → Team Setup → Character Selection (2 đội) → Pumpkin Team Picker → Gameplay / Turn A → Teacher Next → Gameplay / Turn B → … → Final Results`

### 9.2. Thiết lập đội

- Mặc định: `Team Pumpkin` (cam) và `Team Ghost` (tím).
- Giáo viên sửa được tên đội.
- Hai đội chọn **2 nhân vật khác nhau** từ 6 lựa chọn.
- Mỗi đội có giỏ và bộ đếm kẹo riêng.
- Hoạt ảnh quay bí ngô chọn đội đi trước bằng ngẫu nhiên **một lần trước trận**.

### 9.3. Luật lượt

- Mặc định 12 lượt = **6 lượt cho mỗi đội**; tùy chọn 8, 12, 16 hoặc 20 lượt (luôn là số chẵn).
- Hai đội luân phiên A–B–A–B dựa trên đội được chọn đi trước.
- Một học sinh đại diện đội lên chạm màn hình; giáo viên quản lý người tham gia.
- Sau mỗi thử thách, game dừng tại `WAIT_FOR_TEACHER_NEXT`; **không tự đổi đội** khi chưa bấm `Next Turn`.
- Khi chuyển lượt: phát `sfx_next_turn.wav`, hiển thị tên đội tiếp theo, đổi nhân vật đang điều khiển; chuyển sang nhà/chặng tiếp theo mà không tải lại toàn bộ game.
- Không chia sẻ điểm hay giỏ giữa hai đội.

### 9.4. Cân bằng và chống lộ đáp án

1. Mỗi đội có số lượt ngang nhau và **tối đa 2 kẹo/lượt**.
2. Sinh trước kế hoạch độ khó theo **cặp lượt**: lượt của A và lượt kế của B dùng cùng mức khó và nhóm câu hỏi tương đương, không nhất thiết cùng từ.
3. Không lặp **nguyên câu hỏi / nguyên bộ đáp án** của đội trước ở lượt ngay sau.
4. Nếu ngân hàng từ đủ rộng, ưu tiên mỗi đội gặp các từ khác nhau nhưng mức khó tương đương; các từ có thể được ôn lại trong zone cuối.
5. Với ngân hàng từ nhỏ, cho phép tái sử dụng từ nhưng thay đổi cách hỏi/đáp án nhiễu khi đủ tài nguyên; **không giả vờ rằng đề luôn hoàn toàn mới**.
6. Không có nhân vật mạnh hơn, vật phẩm nhân đôi điểm, thưởng ngẫu nhiên hay bonus theo thời gian.
7. `Skip Question` do thiếu asset/đề lỗi phải **thay câu ngay trong cùng lượt**, không cộng/trừ và không tiêu hao lượt. Nếu hết câu hợp lệ, giáo viên được báo và chọn quay lại Setup.

### 9.5. Kết quả

- Hai đội cùng đến lễ hội, giỏ kẹo đặt hai bên, số điểm được hiển thị.
- Điểm cao hơn → thông báo đội thu thập nhiều kẹo hơn; **cả hai đội đều vui mừng**.
- Hòa → `It's a tie!` và cả hai đội cùng mừng.
- Các nút: `Play Again`, `New Vocabulary Set`, `Home`.
- Giáo viên có thể bật chế độ **ẩn điểm trong khi chơi** (vẫn tính nội bộ), chỉ hiện khi kết thúc.

---

## 10. TEACHER SETUP — CHỨC NĂNG BẮT BUỘC

### 10.1. Cấu hình buổi chơi

| Setting | Mặc định | Tùy chọn |
|---|---|---|
| `mode` | `team_battle` | `solo`, `team_battle` |
| `vocabularySet` | Halloween Basic | Bộ có sẵn / bộ giáo viên tạo |
| `totalTurns` | 12 (Team) / 8 (Solo) | Team 8/12/16/20; Solo 6/8/10/12 |
| `difficulty` | `easy` | `easy`, `normal`, `mixed` |
| `questionTypes` | Mixed, ưu tiên Listen & Choose | Chọn/bỏ từng loại |
| `timerSeconds` | `null` | `null`, `30`, `45` |
| `voiceMode` | `both` | `game`, `teacher`, `both` |
| `musicEnabled` | `true` | Bật/tắt |
| `sfxEnabled` | `true` | Bật/tắt |
| `showLiveScore` | `true` | Bật/tắt |
| `randomizeQuestions` | `true` | Bật/tắt |

### 10.2. Quản lý từ vựng

Giáo viên có thể:

- Chọn các từ từ thư viện 24 từ có sẵn trong resource pack.
- Tạo bộ mới, đặt tên bộ, thêm/sửa/xóa mục từ.
- Nhập từ tiếng Anh và nghĩa tiếng Việt tùy chọn.
- Chọn hình có sẵn hoặc **upload hình** riêng.
- Chọn audio có sẵn, **upload file ghi âm**, dùng TTS khi môi trường hỗ trợ, hoặc chọn **Teacher Voice**.
- Preview ảnh, nghe âm thanh, tắt/bật từng từ.
- Lưu cấu hình và bộ từ ngay trên thiết bị; có thể bổ sung Export/Import để dùng lại ở lớp khác.

**Không mặc định sinh hình bằng AI cho mọi từ mới.** Giáo viên có thể phải upload hình nếu từ không nằm trong kho asset.

### 10.3. Cấu trúc một mục từ (mô tả dữ liệu)

| Thuộc tính | Kiểu/ý nghĩa | Ví dụ |
|---|---|---|
| `id` | Mã nội bộ ổn định | `pumpkin` |
| `text` | Từ/cụm từ tiếng Anh | `pumpkin` |
| `meaning` | Nghĩa (tùy chọn) | `quả bí ngô` |
| `imagePath` | Đường dẫn icon hoặc ảnh upload | `vocabulary/icons/pumpkin_72.png` |
| `cardPath` | Thẻ hình có nhãn nếu có | `vocabulary/cards/pumpkin_256.png` |
| `audioPath` | Audio của từ (có thể chưa có) | File giáo viên upload |
| `category` | Chủ đề | `Halloween` |
| `enabled` | Sử dụng trong buổi học | `true` |
| `sceneEligible` | Có sprite/hitbox cho Find the Object | `false` nếu mới upload ảnh thẻ |

Tệp/hình tải lên cần được kiểm tra định dạng, dung lượng và khả năng phát/hiển thị. Không cho phép trùng `id`, thẻ không có ảnh hoặc âm thanh bị hỏng tham gia câu hỏi cần tài nguyên đó.

### 10.4. Quy tắc về nguồn âm thanh

- `game`: chỉ tạo dạng bài cần audio khi có file ghi âm hoặc giọng đọc máy khả dụng.
- `teacher`: giáo viên đọc câu lệnh; game hiển thị hình/nhắc chữ nhỏ dành cho giáo viên; nút replay giọng giáo viên **không khả dụng** nếu chưa ghi âm.
- `both`: ưu tiên audio game khi có; giáo viên luôn có thể đọc lại hoặc can thiệp.
- **Look & Listen** và **Match the Pairs** đòi hỏi audio phân biệt được cho mọi phương án. Khi chỉ có Teacher Voice mà chưa có audio lưu, nên vô hiệu hóa hai dạng này hoặc chuyển sang dạng giáo viên có thể điều phối riêng, không tạo nút loa giả.

### 10.5. Kiểm tra trước khi Start

Trước khi bắt đầu game, hệ thống hiển thị checklist:

- Đủ ít nhất **2 mục từ khác nhau** có hình hợp lệ để tạo câu hỏi hai đáp án; để chơi mức Normal phải đủ **3 mục từ khác nhau** có ảnh.
- Có ít nhất **một loại câu hỏi khả dụng** theo audio/hình/vật thể đã chọn.
- Có thể tạo lịch câu hỏi cho số lượt đã chọn; nếu số từ ít, hiển thị thông báo **sẽ có lặp từ** thay vì chặn buổi học.
- Có nguồn phát yêu cầu phù hợp: audio sẵn/TTS hợp lệ hoặc Teacher Voice.
- Nếu có từ chưa hoàn chỉnh, nêu tên từ, lý do và phương án sửa/bỏ chọn.

Đối với bộ chỉ có 2 từ và 12 lượt, cho phép lặp có kiểm soát nhưng phải cảnh báo giáo viên; không tự thêm từ không nằm trong bài học.

---

## 11. THUẬT TOÁN CHỌN CÂU HỎI (YÊU CẦU, KHÔNG PHẢI CODE)

1. Tạo danh sách từ được bật và xác thực hình/âm thanh.
2. Dựa vào `questionTypes`, chỉ giữ những dạng đủ điều kiện tài nguyên.
3. Xác định số phương án theo `difficulty` và số từ khả dụng; không tạo 3 lựa chọn khi chỉ có 2 từ.
4. Tạo lịch câu hỏi theo lượt và zone, ưu tiên lặp lại từ sau một khoảng cách thay vì liên tiếp.
5. Khi Team Battle, ghép các lượt A/B thành cặp tương đương về mức khó, dạng bài và số lựa chọn.
6. Chọn nhiễu từ **những từ khác với đáp án đúng**; không dùng cùng hình dưới tên khác hoặc hai đáp án phát âm không phân biệt được.
7. Hạn chế lặp nguyên cặp `(từ đích, loại câu hỏi, phương án nhiễu)` trong cùng session.
8. Nếu tài nguyên phát lỗi ngay trong trận, thay bằng câu hợp lệ trong cùng lượt; không bỏ lượt đội đang chơi.
9. Ghi lại `questionId`, `targetWordId`, `turnId`, câu trả lời, số lần thử, kết quả kẹo để phục vụ tổng kết.
10. Chỉ hiển thị câu hỏi khi toàn bộ asset cần thiết đã tải và sẵn sàng.

**Ưu tiên sư phạm:** độ chính xác và khả năng nhận biết của trẻ quan trọng hơn việc tạo câu hỏi ngẫu nhiên tuyệt đối.

---

## 12. BẢN ĐỒ CÁC MÀN HÌNH (SCREEN MAP)

| Screen ID | Tên màn hình | Nội dung | Hành động chính |
|---|---|---|---|
| `title` | Title Screen | Logo, Play, Teacher Setup, âm thanh | Play, Settings |
| `mode_select` | Mode Selection | Solo / Team Battle | Chọn mode |
| `teacher_setup` | Teacher Setup | Từ vựng, độ khó, số lượt, timer, audio | Save, Preview, Start |
| `vocab_manager` | Vocabulary Manager | Danh sách từ, edit/upload/preview | Add, Edit, Remove |
| `character_select` | Character Selection | 6 nhân vật và hoạt ảnh preview | Chọn nhân vật |
| `team_setup` | Team Setup | Tên 2 đội, màu, chọn nhân vật | Confirm |
| `team_picker` | Starting Team | Bí ngô quay chọn đội đi trước | Start Adventure |
| `adventure` | Main Gameplay | Map, nhân vật, nhà, vật tương tác, điểm | Chạm cửa/đồ vật |
| `question_overlay` | Vocabulary Challenge | Một trong 4 loại thử thách | Nghe, chọn, ghép |
| `reward_overlay` | Candy Reward | Điểm cập nhật, hiệu ứng kẹo | Tiếp tục |
| `turn_transition` | Next Turn | Đội tiếp theo, nhân vật tiếp theo | Teacher Next |
| `zone_transition` | Zone Transition | Tên khu vực và hoạt ảnh mở | Tiếp tục / Skip |
| `results_solo` | Solo Results | Tổng kẹo, nhân vật | Play Again / Home |
| `results_team` | Team Results | Hai giỏ, đội nhiều kẹo hơn/hòa | Play Again / Home |

**Nguyên tắc:** `question_overlay`, `reward_overlay` là lớp trên bản đồ; tránh chuyển sang trang nền trắng tách rời thế giới trò chơi.

### 12.1. Teacher Controls trong gameplay

- `Pause/Resume`: tạm dừng hoạt ảnh, timer và input câu hỏi.
- `Replay`: phát lại audio mục tiêu nếu có.
- `Skip Question`: thay câu không phù hợp, giữ nguyên đội và lượt.
- `Next Turn`: chỉ bật khi lượt hoàn thành; điều khiển chuyển đội.
- `Home/Restart`: hiển thị xác nhận, tránh mất session do chạm nhầm.
- `Mute/Volume`: không ảnh hưởng dữ liệu câu hỏi hoặc điểm.

Nên ẩn/gom các nút nhạy cảm trong vùng giáo viên để trẻ không bấm nhầm; không cần hệ thống tài khoản giáo viên trong MVP.

---

## 13. UI/UX CHO TRẺ 5 TUỔI

### 13.1. Desktop / máy chiếu

- Bản đồ thiết kế theo khung **16:9**.
- Thanh trên: tên đội/lượt, giỏ kẹo, tổng kẹo, nút loa.
- Trung tâm: nhân vật, ngôi nhà hiện tại, tương tác được nhấn sáng.
- Câu hỏi phủ phía trước, tối đa 3 lựa chọn lớn, ưu tiên một hàng ngang.
- Teacher Controls ở cạnh trên/phải, không che nút trả lời.
- Tối thiểu chỉ có **một mục tiêu tương tác chính** trên màn hình tại một thời điểm.

### 13.2. Mobile

- Responsive portrait **9:16** và landscape **16:9**; không ép giãn nền.
- Camera tự lấy nét vào nhân vật/nhà, crop vùng trang trí ngoài trọng tâm khi cần.
- Câu hỏi ưu tiên không gian cho hình/đáp án, tối đa 2 cột thẻ khi màn hình hẹp.
- Hit target khuyến nghị từ **48×48 CSS px trở lên**, tăng vùng bấm cho trẻ, đặc biệt với cửa nhà và đồ vật nhỏ.
- Không bắt trẻ kéo/thả chính xác; Match the Pairs dùng chạm-hình rồi chạm-loa.
- Bảo vệ safe area, kiểm thử cả màn hình có tai thỏ, thanh điều hướng.

### 13.3. Accessibility và cảm xúc

- Không dùng màu sắc là tín hiệu đúng/sai duy nhất; kết hợp hình và âm thanh.
- Có tùy chọn tắt/giảm nhạc nền và hiệu ứng.
- Chuyển động ngắn, không chớp sáng mạnh, không âm thanh giật mình.
- Câu lệnh đơn giản: `Find the ...`, `Listen and choose`, `Great job!`, `Try again!`.
- Không bắt trẻ nhập chữ để tham gia.

---

## 14. LIÊN KẾT RESOURCE PACK v1.0 VỚI GAMEPLAY

Tham chiếu root asset: `Halloween_Candy_Quest_Resource_Pack_v1/`.

| Chức năng | Thư mục/tệp thật | Cách dùng |
|---|---|---|
| Zone 1 | `backgrounds/pumpkin_garden/main_1280x720.png` | Background 16:9 |
| Zone 2 | `backgrounds/candy_village/main_1280x720.png` | Background 16:9 |
| Zone 3 | `backgrounds/magic_castle/main_1280x720.png` | Background 16:9 |
| Biến thể nền | `backgrounds/<zone>/alternate_1280x720.png` | Thay đổi cảnh |
| Nền gốc pixel | `backgrounds/<zone>/main_native_320x180.png` | Nearest-neighbor upscale |
| Nhân vật | `characters/<id>/` | Portrait + các frame |
| Spritesheet | `characters/spritesheets/<id>_5x2_48px.png` | 5 state × 2 frame |
| Chủ nhà/NPC | `npcs/` | Chào, gợi câu hỏi |
| Nhà | `buildings/` | Vật thể đặt trên map |
| Cửa | `doors/` | Cửa được chọn/đóng/mở |
| Bí ngô, rương, chuông | `interactables/` | Object clickable |
| Kẹo | `candy/*.png` | Reward particles |
| Giỏ | `candy/baskets/empty_112.png`, `half_112.png`, `full_112.png` | Biểu thị tiến độ |
| Icon từ vựng | `vocabulary/icons/<word>_72.png` | Dùng cho thẻ không chữ |
| Thẻ từ vựng | `vocabulary/cards/<word>_256.png` | Thẻ có nhãn |
| Khung câu hỏi | `ui/panels/` | Panel/dialog/card |
| Nút | `ui/buttons/` | Play, Replay, Pause, Next… |
| Visual effects | `effects/` | Candy flight, sparkles, confetti |
| Lớp cảnh | `parallax/`, `environment/` | Trang trí/tile mẫu |
| Phát âm/nhạc/SFX | `audio/` | WAV hiệu ứng, loop nhạc |
| Danh mục asset | `asset_manifest.json`, `asset_manifest.csv` | Tra cứu đường dẫn và kích thước |

### 14.1. Gắn asset với sự kiện

| Sự kiện game | Hiệu ứng / âm thanh đề xuất |
|---|---|
| Bấm nút | `audio/sfx_button_click.wav` |
| Gõ cửa | `audio/sfx_door_knock.wav` |
| Cửa mở | `audio/sfx_door_open.wav` |
| Chọn đúng | `audio/sfx_correct.wav` + `characters/<id>/celebrate_*.png` |
| Nhận kẹo | `audio/sfx_candy_collect.wav` + `effects/candy_flight_transparent.png` |
| Sai lần đầu | `audio/sfx_try_again_gentle.wav` + `try_again` |
| Gợi ý | `audio/sfx_hint_twinkle.wav` |
| Rương mở | `audio/sfx_chest_open.wav` |
| Đổi đội | `audio/sfx_next_turn.wav` |
| Mở zone | `audio/sfx_zone_unlock.wav` |
| Chọn đội đầu | `audio/sfx_team_picker.wav` |
| Kết thúc | `audio/sfx_celebration.wav` + confetti |
| Nhạc nền | `audio/bgm_halloween_friendly_loop.wav` (loop, âm lượng thấp) |

**Lưu ý chính xác về pack:** Có **252 PNG và 13 WAV** (12 SFX + 1 BGM) trong gói. **Chưa có audio phát âm riêng cho 24 từ.** Khi cần TTS/giáo viên đọc/upload voice, phải xử lý như dữ liệu bổ sung. Một số dòng trong `README.md` của pack v1 viết trước khi bổ sung WAV nên có thể không phản ánh số audio hiện tại; đối chiếu thư mục `audio/` và `audio/audio_manifest.json`.

### 14.2. Những gì pack v1 chưa có đủ

1. **Pathfinding/collision:** background là ảnh cảnh tĩnh, chưa có bản đồ collision hoặc waypoint. Cần định nghĩa thủ công các tuyến di chuyển và vị trí nhà.
2. **Hit area:** đồ vật và cửa có PNG riêng, nhưng vị trí/vùng bấm phải do game định nghĩa, không suy ra chính xác từ ảnh nền.
3. **Animation production:** frame ít, cần polish nếu yêu cầu chuyển động mượt.
4. **UI động:** một số nút có chữ vẽ sẵn. Nên làm nút với chữ hiển thị bằng hệ thống giao diện để đổi ngôn ngữ và responsive.
5. **Giọng đọc từ vựng:** chưa có sẵn, cần TTS, file ghi âm hoặc giáo viên đọc.
6. **Scene-specific object sets:** Find the Object chỉ có thể dùng với các sprite vật thể được gắn vùng chạm. Không coi mọi đồ vật vẽ vào background là có thể nhấn.
7. **Visual QA:** sprite được tách từ nguồn ảnh thiết kế; cần rà soát viền pixel và tính đồng nhất trước bản phát hành chính thức.

### 14.3. Quy tắc rendering

- Nên dùng hệ **virtual resolution 320×180** cho world pixel, nhân lên theo bội số nguyên khi có thể; sử dụng nearest-neighbor, không blur.
- UI và văn bản có thể render ở độ phân giải thiết bị để chữ dễ đọc; tránh font pixel quá nhỏ.
- Layer order tối thiểu: background → parallax decor → buildings → doors/interactables → player/NPC → VFX → HUD → question overlay → teacher menu.
- Không lấy các bảng `source_atlases/` có nhãn và khung minh họa làm background/game screen ở runtime.

---

## 15. SESSION STATE VÀ LƯU DỮ LIỆU

Một buổi chơi cần giữ những thông tin sau (mô tả dữ liệu, không ràng buộc công nghệ):

| Nhóm state | Nội dung |
|---|---|
| `session` | `mode`, ngày tạo, bộ từ, cài đặt, seed random |
| `progress` | `totalTurns`, `completedTurns`, `zoneIndex`, trạng thái hiện tại |
| `teams` | Tên đội, màu đội, `characterId`, `score` |
| `activeTurn` | `turnId`, đội đang chơi, `questionId`, `attemptCount`, timer |
| `questionPlan` | Lịch câu hỏi theo lượt, trạng thái đã dùng |
| `answers` | Từ đích, đáp án chọn, số lần thử, số kẹo nhận |
| `teacherPrefs` | Âm lượng, timer, các dạng câu hỏi, chế độ voice |

- Lưu bộ từ và cài đặt để dùng lại giữa các buổi học.
- Lưu trạng thái phiên tạm thời khi Pause; khi rời game bất ngờ, hiển thị lựa chọn tiếp tục phiên trước nếu dữ liệu còn hợp lệ.
- Không cần thu thập danh tính cá nhân hoặc thông tin nhạy cảm của học sinh.
- Tên đội có thể là tên tùy chọn, không cần tài khoản riêng.

---

## 16. XỬ LÝ LỖI VÀ TÌNH HUỐNG BIÊN

| Tình huống | Hành vi mong đợi |
|---|---|
| Từ custom không có ảnh | Cảnh báo tại Setup; không đưa vào câu hỏi hình ảnh |
| File audio hỏng/không hỗ trợ | Đổi sang Teacher Voice nếu giáo viên cho phép; không dùng nút loa giả |
| TTS không hoạt động/offline | Dùng audio đã upload hoặc Teacher Voice |
| Chỉ có 2 từ nhưng bật Normal | Thông báo và giảm về 2 lựa chọn nếu được giáo viên chấp thuận |
| Không đủ dạng câu hỏi đã bật | Tự loại dạng thiếu tài nguyên, hiện cảnh báo rõ |
| Click hai lần nhanh | Chỉ nhận một thao tác/một đáp án |
| Đang chuyển cảnh mà bấm đáp án | Không ghi nhận input đến khi câu hỏi sẵn sàng |
| Giáo viên Pause giữa câu | Dừng timer/animation và vô hiệu hóa đáp án tạm thời |
| Câu hỏi lỗi trong Team Battle | Skip & Replace, giữ nguyên lượt và cơ hội điểm |
| Hai đội hòa | Mừng cả hai, hiển thị `It's a tie!` |
| Đổi sang mobile dọc | Bố cục reflow, camera crop, không méo sprite |
| Không phát được nhạc nền | Game vẫn chạy bình thường, báo trạng thái âm thanh nếu cần |
| Trẻ không trả lời | Giáo viên có thể hỗ trợ, gợi ý, hoặc thay câu không phù hợp |

---

## 17. PHẠM VI MVP VÀ PHẦN CÓ THỂ NÂNG CẤP

### 17.1. Bắt buộc ở MVP

- Đầy đủ 2 mode và 6 nhân vật lựa chọn.
- 3 zone với chuyển cảnh theo lượt.
- Di chuyển tự động + click/chạm cửa và một số vật thể phụ.
- Câu hỏi Listen & Choose và Find the Object hoạt động ổn định; hai dạng còn lại hoạt động khi có audio tương ứng.
- Quy tắc +2/+1/0 kẹo, 2 lần thử, không trừ điểm.
- Teacher Setup và khả năng chọn/tạo bộ từ, upload hình/audio.
- Team turn-taking, chọn đội đi trước, `Next Turn` do giáo viên bấm.
- Màn hình kết quả Solo/Team, âm thanh hiệu ứng, responsive desktop/mobile.
- Kiểm tra thiếu tài nguyên trước khi Start.

### 17.2. Nâng cấp sau MVP

- Thêm sprite animation nhiều frame và nhiều góc nhìn.
- Thêm bản đồ tile/collision/waypoint và môi trường có thể mở rộng.
- Các hoạt cảnh thưởng khác nhau theo từng NPC.
- Tổng kết tiến bộ từ vựng theo phiên dành riêng cho giáo viên.
- Xuất/nhập gói bài học qua file có đầy đủ ảnh/audio.
- Thư viện từ vựng phong phú hơn, có thể thay theme ngoài Halloween.

### 17.3. Không thuộc MVP

- Đăng nhập tài khoản học sinh, leaderboard online, PvP qua mạng.
- Joystick chiến đấu, quái vật tấn công, vật phẩm cộng điểm may rủi.
- Công cụ tự động tạo hình AI cho mọi từ nhập mới.
- Hệ thống tiền tệ ngoài kẹo hoặc mua sắm trong game.

---

## 18. CHECKLIST NGHIỆM THU

### A. Giáo dục

- [ ] Học sinh 5 tuổi có thể hoàn thành lượt chỉ bằng nghe, quan sát và chạm/click.
- [ ] Có thể replay giọng đọc không bị trừ điểm.
- [ ] Câu sai có gợi ý nhẹ và hiện đáp án sau tối đa 2 lần thử.
- [ ] Không cần đọc chữ để hiểu lựa chọn chính.

### B. Gameplay

- [ ] Nhân vật tự đi đến đúng nhà, chạm cửa mở thử thách.
- [ ] Phần thưởng cộng điểm **một lần duy nhất** cho mỗi lượt.
- [ ] Hoàn thành cả 3 zone ngay cả khi trả lời sai nhiều.
- [ ] Solo kết thúc sau đúng số lượt cấu hình.
- [ ] Team có đúng số lượt bằng nhau, không đổi lượt khi giáo viên chưa xác nhận.
- [ ] Thay câu lỗi không làm mất lượt/thiệt điểm đội đang chơi.
- [ ] Kết quả hòa và kết quả thắng đều có hoạt ảnh tích cực.

### C. Teacher Setup

- [ ] Chọn/bỏ chọn từ trong thư viện 24 từ.
- [ ] Thêm, sửa, xóa từ; upload ảnh và audio; preview hoạt động.
- [ ] Không sinh câu hỏi cần asset đang thiếu/hỏng.
- [ ] Chế độ Teacher Voice hoạt động khi không có TTS.
- [ ] Cấu hình lưu và đọc lại được.

### D. Hình/âm thanh

- [ ] Sử dụng PNG riêng, không cắt runtime từ các source atlas minh họa.
- [ ] Sprite có nền trong suốt, pixel sắc nét khi phóng to.
- [ ] Nhạc nền và hiệu ứng không át tiếng đọc từ.
- [ ] Không có hiệu ứng giật mình hoặc chớp sáng mạnh.

### E. Thiết bị

- [ ] Desktop và máy chiếu ngang 16:9 dễ nhìn.
- [ ] Điện thoại dọc/ngang dùng chạm một lần với vùng bấm lớn.
- [ ] Màn hình nhỏ không che đáp án hoặc nút phát âm.
- [ ] Không đơ/mất state khi Pause/Resume, đổi hướng màn hình hoặc nhấn liên tục.

---

## 19. KỊCH BẢN DEMO ĐỂ KIỂM THỬ

### Demo Solo (8 lượt)

1. Giáo viên chọn bộ Halloween Basic, 8 lượt, Easy, không timer.
2. Trẻ chọn Little Ghost.
3. Little Ghost tự đi tới nhà bí ngô, trẻ bấm cửa.
4. NPC yêu cầu `Find the cat!`; trẻ chọn hình cat.
5. Đúng → 2 kẹo bay vào giỏ, score tăng.
6. Qua một số lượt, nhân vật đi tiếp qua Candy Village và Magic Castle.
7. Hoàn tất 8 lượt, hiện Happy Halloween + tổng kẹo.

### Demo Team (12 lượt)

1. Giáo viên chọn Team Battle, 12 lượt, Halloween Basic.
2. Team Pumpkin chọn Pumpkin Kid; Team Ghost chọn Bat Explorer.
3. Bí ngô quay ngẫu nhiên chọn đội bắt đầu.
4. Đội đầu gõ cửa và làm câu hỏi; đúng ngay lần đầu +2.
5. Game dừng và chờ **Teacher Next**.
6. Đội thứ hai nhận thử thách tương đương, không trùng nguyên câu vừa hỏi.
7. Nếu một câu hỏi hỏng hình, giáo viên `Skip Question` và game thay câu trong cùng lượt.
8. Tiếp tục luân phiên đến hết 12 lượt, 6 lượt mỗi đội.
9. Cả hai đội nhận hoạt ảnh tổng kết; giỏ nào nhiều kẹo hơn được công bố.

---

## 20. THỨ TỰ TRIỂN KHAI ĐỀ XUẤT

**P0 — Nền tảng dữ liệu:** nạp asset manifest, thiết lập từ vựng, kiểm tra audio/hình, lựa chọn mode, lưu cấu hình.  
**P1 — Core loop:** adventure scene, auto-walk, tương tác cửa, Listen & Choose, +2/+1/0, reward animation.  
**P2 — Hai mode:** Solo/Team turn logic, chọn nhân vật, quay chọn đội, Teacher Next, 3 zone, màn hình kết quả.  
**P3 — Đa dạng học tập:** Look & Listen, Find the Object, Match the Pairs, câu hỏi cân bằng, fallback cho custom words.  
**P4 — Hoàn thiện lớp học:** Teacher Controls, mobile portrait, âm lượng, pause, validation, thống kê và QA.

**Đầu ra mong đợi:** một trò chơi chạy được bằng resource pack đã tạo, hỗ trợ trẻ chơi theo lượt trên máy chiếu hoặc chơi đơn trên desktop/mobile, và giáo viên thay bộ từ mà **không phải sửa mã nguồn**.

---

### PHỤ LỤC — QUY TẮC CHỐT

- **Đã chốt:** Hybrid auto-walk + click/tap; 6 nhân vật tùy chọn; Solo và 2 đội luân phiên; 3 zone; nhận biết từ vựng; kẹo là điểm; giáo viên tự thiết lập từ.
- **Mặc định:** Solo 8 lượt, Team 12 lượt, Easy, timer off, không trừ kẹo.
- **Tài nguyên hiện có:** Resource Pack v1.0 (PNG, WAV, manifest).
- **Không được tự suy diễn:** pack đã có voice của từng từ, collision map, hitbox đầy đủ hay animation production-ready.
- **Mọi nâng cấp sau này:** giữ nguyên fairness và khả năng chơi bằng nghe–nhìn–chạm cho trẻ 5 tuổi.
