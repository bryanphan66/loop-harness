# Phản biện 3 nguồn + Đề xuất ứng dụng/refactor cho loop-harness

**Ngày:** 2026-08-05
**Nguồn:** guide (agent-loops-beginner-guide) + audit (45-nguồn) + video Phước ("99% hiểu sai về agent loops")
**Đối tượng refactor:** Macro 2 (Mode A) + the loop (Mode B)
**Tính chất:** advisory (tư vấn) - CHƯA sửa code, chờ Trung chốt.

---

## Phần 1 - Đánh giá & phản biện 3 nguồn (góc nhìn của control session, không tâng bốc)

### 1.1 Beginner guide - đúng nền tảng, nhưng "verify" còn ngây thơ
- **Đúng:** reason-act-observe + verify + hard-stop + "done phải kiểm được bằng máy" là nền chắc. Cảnh báo "đừng dùng LLM image-compare, dùng check khách quan" trùng đúng lập trường harness (Playwright fidelity, không nhờ LLM chấm ảnh).
- **Phản biện:** guide gộp làm một 2 thứ verify vốn KHÁC NHAU:
  1. verify tính đúng (output có khớp goal không - chạy test, đọc output).
  2. verify danh tính artifact (cái tôi đang quan sát có phải bản build thật đang chạy không).
  Mọi ví dụ verify của guide đều là loại (1) - "tin tín hiệu cục bộ". Guide KHÔNG bao giờ chạm loại (2). Mà loại (2) mới là chỗ loop nổ trong sản xuất (CI xanh / HTTP 200 nhưng chạy bản cũ). Harness đã có loại (2) = `ship-and-verify.sh`, tức harness ĐI TRƯỚC guide ở điểm này.

### 1.2 Audit 45-nguồn - trung thực nhất, nhưng "invariant core" gần như tautology
- **Đúng:** "không có định nghĩa chung, 11 camp" là kết luận trí tuệ và thành thật. Việc HẠ CẤP "model tự dừng" khỏi lõi (vì grassroots chạy tới CTRL+C) là quan sát sắc.
- **Phản biện:**
  - Lõi bất biến nó rút ra (LLM + lặp + state + goal + verify) **đúng nhưng ít thông tin** - gần như định nghĩa lại chữ "loop". Nó mô tả sự bất đồng mà KHÔNG phân xử giúp người xây. Builder đọc xong vẫn không biết chọn hình loop nào.
  - Nội dung actionable nhất (loop engineering, separate-checker, cost) lại bị phát triển mỏng (2-3 nửa dòng).
  - Lỗi khung: nó xếp "loop chạy vô tận tới CTRL+C" (Ralph) và "loop có trần cứng" trên CÙNG một trục minimal-maximal, như thể chỉ khác mức độ. Sai. Loop vô tận không-trần là **anti-pattern cho sản xuất**, không phải "một điểm trên phổ". Audit trung lập hoá một thứ đáng ra phải gắn nhãn nguy hiểm.

### 1.3 Video Phước - đúng HÌNH, ngây thơ về ĐỊA HÌNH (domain)
- **Đúng:** "đừng gõ prompt từng lượt, hãy thiết kế loop tự prompt agent" = frontier framing, trùng lập trường Mode B.
- **Phản biện (mạnh nhất):**
  - Ý "meta-agent tự suy luận cần loop nào" **thổi phồng tự chủ (autonomy)** - và đó CHÍNH LÀ failure mode harness cố tránh. Harness đóng băng cấu trúc loop (OPERATING-MODES.md) do CON NGƯỜI thiết kế, chính vì loop tự-thiết-kế sẽ drift. Nếu để worker tự chọn loop, mất reproducibility.
  - Chính Phước tự mâu thuẫn: "đa số việc chỉ vài chục phút, không cần loop nhiều ngày" - câu này lặng lẽ phản bác cái grandiosity meta-agent ở đầu video.
  - 3 ví dụ (thumbnail, máy bay 3D, tái tạo ảnh) đều là loop **1 agent, 1 objective, verify rẻ**. Chúng KHÔNG chuyển được sang phần mềm sản xuất nhiều file có invariant xuyên suốt (auth, payment, toàn vẹn dữ liệu) - đúng địa hình của harness. Verify "xoay mô hình 3D xem đẹp chưa" khác xa "đảm bảo phân quyền không rò rỉ".

### 1.4 Điểm mù CHUNG cả 3 nguồn (chỗ harness đã đi trước)
1. **Cả 3 hiểu "verify" = kiểm đúng OUTPUT.** Không nguồn nào chạm 2 bài toán khó hơn mà harness đã giải:
   - (a) verify danh tính artifact (verify-at-source) - `ship-and-verify.sh`.
   - (b) tách quyết định rủi ro nghiệp vụ (giá/quyền/dữ liệu) RA KHỎI loop tự động, giao human - rule "business-risk to human" upstream Mode B.
   Đây đúng 2 chỗ loop hay nổ trong production, và harness đã có. Kết luận: **về verify, harness ở trên cả 3 nguồn.**
2. **Cost/token-budget:** cả 3 chỉ "cost sense" khẩu hiệu, KHÔNG nguồn nào đưa cơ chế. Harness cũng chưa có cơ chế cứng (gap chung, xem 2.B.3).

---

## Phần 2 - Ứng dụng & refactor cụ thể

> Nguyên tắc lọc: chỉ nhập cái nguồn nói ĐÚNG và harness CHƯA có/còn mỏng. Bác thẳng cái nguồn nói sai với domain harness.

### 2.A - Macro 2 (Mode A, build 2.1 -> 2.13)

Bản đồ: 13 bước tuyến tính, **loop thật duy nhất = 2.6 `/build-phase`** (P1..PN), có PHASE ACCEPTANCE do agent-verifier ĐỘC LẬP re-verify, cap 3 vòng rồi BLOCKED. Đây đã là maker-checker có trần cứng chuẩn sách.

**A1. [NHẬP - nhỏ] Siết "one change per pass" ở tầng BUILD MANIFEST (2.3).**
- Nguồn: guide + Anthropic "one feature at a time", cảnh báo "too much per pass -> thrash".
- Hiện trạng: mỗi `/build-phase` = 1 phase manifest; nhưng độ TO của 1 phase do manifest 2.3 quyết. Nếu 1 phase gộp quá nhiều -> verifier khó re-verify, dễ thrash 3 vòng rồi BLOCKED.
- Đề xuất: thêm lint cho manifest ở 2.3 - mỗi phase BẮT BUỘC có 1 acceptance kiểm được bằng máy + đủ nhỏ để verify độc lập. (KISS: 1 rule trong dor-build hoặc gate-check.)

**A2. [NHẬP - vừa] Làm rõ nhánh "You decide / irreversible -> human" thành FLOOR RULE của Macro 2.**
- Nguồn: guide phân 4 loại check; loại "You decide" = thao tác không đảo ngược -> pause hỏi human.
- Hiện trạng: harness map tốt 3 loại đầu (Functional=test, Visual=Playwright, Judgment=6-dim review). Rule "business-risk -> human" tồn tại rõ ở Mode B, nhưng ở Mode A (build) CHƯA thấy floor rule chặn thao tác không-đảo-ngược (migration phá huỷ, đổi auth, seed prod).
- Đề xuất: thêm floor rule Macro 2 - lớp thao tác irreversible phải có human checkpoint, không để agent tự chạy trong phase-loop.

**A3. [BÁC - quan trọng] KHÔNG loop-hoá phần tuyến tính của Macro 2.**
- Cám dỗ từ "loop engineering": biến nhiều bước 2.x thành loop.
- Phản biện: các freeze gate (ERD frozen 2.1, walking skeleton 2.4) là **bánh cóc một chiều (one-way ratchet)** cố ý. Loop-hoá chúng = mở đường cho drift, đúng thứ freeze sinh ra để chặn. Giữ 2.6 là loop, phần còn lại tuyến tính. Đây là chỗ tôi bác thẳng việc áp "mọi thứ nên là loop".

### 2.B - Mode B (the loop, issue-pipeline 10-state)

Bản đồ: maker-checker đã tách (coder=maker / human QC=checker), verify-at-source, business-risk-to-human upstream, recover R1/R2/R3 có trần.

**B1. [NHẬP - giá trị cao] Thêm agent-QC ĐỐI KHÁNG (adversarial) TRƯỚC human QC.**
- Nguồn: audit camp 4 (separate evaluator) + Hesamation "verification specialist cố PHÁ việc". Ý mạnh nhất mà audit để mỏng.
- Hiện trạng: QC hiện = human chạy checklist -> mang tính XÁC NHẬN (confirmatory), dễ rubber-stamp. Memory ghi elearning đã thử "agent-QC + BA human" -> có nền.
- Đề xuất: chính thức hoá 1 pass agent-QC mà nhiệm vụ là PHÁ AC (tìm phản ví dụ), không phải xác nhận AC, chạy trước human QC. Có thể mở rộng `qc-checklist.mjs` để spawn 1 probe đối kháng. Đây là nhập ý mạnh nhất của nguồn đúng vào chỗ harness còn mỏng.

**B2. [NHẬP - siết] Biến trần escalation R1 từ "behavioural" thành COUNTER trong code.**
- Nguồn: audit "model-side stop không phải invariant" + guide "no stop condition -> runaway".
- Hiện trạng: R1 recover cap-3-escalation hiện là quy ước hành vi, CHƯA cưỡng chế bằng code (scout xác nhận).
- Đề xuất: đưa bộ đếm 3-lần vào script dispatch, chạm ngưỡng -> fail-closed to human. Cụ thể hoá bẫy "không stop -> chạy loạn".

**B3. [NHẬP net-new - lấp gap CHUNG] Trần token/cost mỗi issue-loop.**
- Nguồn: cả 3 khoát tay về cost nhưng KHÔNG cho cơ chế; harness cũng chưa có.
- Đề xuất: dispatch theo dõi token tích luỹ của worker theo từng issue; vượt trần -> fail-closed to human. Đây là cơ chế cụ thể mà cả 3 nguồn né. (Đúng tinh thần verify-gate fail-closed sẵn có.)

**B4. [BÁC] KHÔNG cho worker tự thiết kế lại loop giữa chừng (bác "meta-agent" của Phước cho Mode B).**
- Giá trị cốt lõi của harness = loop đóng băng, human thiết kế. Cho worker đổi pipeline giữa run = mất reproducibility + mất verify-at-source. Tái khẳng định đây là KHÔNG-nhập có chủ đích.

### 2.C - Refactor xuyên suốt (nhỏ, tài liệu)

**C1. Tách bạch 3 nghĩa "verify" trong KEYWORD-MAP.**
- Harness đang dùng chữ "verify" cho 3 thứ khác nhau: (i) phase-acceptance (đúng output), (ii) verify-gate armed self-check (gate có bật không), (iii) verify-at-source (đúng artifact). Đây là điểm MẠNH nhưng chưa ghi rõ -> dễ nhầm. Thêm 1 mục KEYWORD-MAP phân 3 nghĩa. Chi phí ~10 phút, giảm lẫn lộn về sau.

---

## Ưu tiên đề xuất (nếu chỉ làm vài cái)

| # | Đề xuất | Mode | Loại | Giá trị | Công |
|---|---------|------|------|---------|------|
| 1 | B1 agent-QC đối kháng trước human QC | B | nhập | Cao | Vừa |
| 2 | B2 counter hoá trần R1 escalation | B | siết | Cao | Thấp |
| 3 | A2 floor rule irreversible -> human (Macro 2) | A | nhập | Cao | Thấp |
| 4 | B3 trần token/cost mỗi issue | B | net-new | Vừa | Vừa |
| 5 | A1 lint manifest "1 phase = 1 acceptance nhỏ" | A | nhập | Vừa | Thấp |
| 6 | C1 tách 3 nghĩa verify trong KEYWORD-MAP | cả 2 | doc | Thấp | Rất thấp |

Bác có chủ đích: A3 (đừng loop-hoá freeze gate), B4 (đừng cho worker tự đổi loop).

---

## Câu hỏi chưa giải (để Trung quyết)

1. **B1 agent-QC đối kháng** - có muốn nó CHẶN (fail-closed, phải pass mới sang human) hay chỉ ADVISORY (gắn cảnh báo vào issue cho human đọc)? Chặn thì mạnh nhưng có thể kẹt pipeline nếu probe false-positive.
2. **B3 trần token** - trần theo từng issue hay theo cả fleet/ngày? Ngưỡng bao nhiêu (chưa có số thực từ dogfood)?
3. **A2 irreversible floor** - danh sách thao tác "irreversible" gồm những gì cho đúng domain (migration phá huỷ / đổi auth / seed prod / xoá bảng...)? Cần Trung chốt danh sách.
4. Có muốn tôi biến 1-2 đề xuất ưu tiên cao thành plan `/ck:plan` để cook không, hay giữ ở mức tư vấn?
