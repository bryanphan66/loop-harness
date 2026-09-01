# loop-harness — Chuẩn viết tài liệu (DOC-STANDARD)

**When To Run:** viết/sửa BẤT KỲ file doc nào trong loop-harness, hoặc chạy 1 đợt refactor tài liệu. **Skip when:** file code đã dogfood (do toolchain quản, xem C10).

Thước đo DUY NHẤT cho mọi doc trong loop-harness. Dùng cho đợt refactor lớn + để chặn "accretion (bồi đắp chấp vá) tái diễn". **Luật cứng: mỗi lần sửa 1 câu/dòng phải viện dẫn đúng 1 mã `Cx` dưới đây; không gắn được `Cx` nào thì KHÔNG sửa** (tránh chỉnh theo cảm tính).

## 10 chuẩn (C1–C10)

| # | Chuẩn | Nghĩa + sửa thế nào |
|---|---|---|
| **C1** | **Repo-agnostic (dùng chung mọi repo)** | `harness/` KHÔNG chứa tên dự án cụ thể (elearning, hasi-hub, Kamal, Dokploy, host, ID…) làm CHỦ NGỮ của luật. Nếu cần ví dụ: viết "một dự án" / "app khách", hoặc dán nhãn rõ `(vd: từ elearning)`. Fact riêng dự án → runbook/memory, KHÔNG vào playbook. |
| **C2** | **Self-contained (tự-đủ)** | Doc trong `harness/` KHÔNG `../../` ra ngoài cây harness. Chỉ dùng path project-relative (`docs/...`). |
| **C3** | **1 rule = 1 owner (DRY)** | Không chép lại nội dung file khác đã sở hữu; file khác **TRỎ tới**, không lặp. |
| **C4** | **Gọn + quét-được** | Mỗi file: 1 dòng mục-đích + trigger ở đầu; câu ngắn; ưu tiên bảng/list hơn đoạn văn dài; cắt hedging (nói vòng) + nhắc-lại thừa. Chuẩn: người đọc tìm ra đáp án trong <30 giây. Không "mega-paragraph". |
| **C5** | **Giải thích WHY, không kể nguồn gốc** | Ghi lý do/invariant (bất biến) stable, KHÔNG nhét mã plan / mã finding (F13, Y1) / số phase / nhãn audit vào nội dung — mấy cái đó bị đánh số lại rồi mục rữa. |
| **C6** | **Cấu trúc nhất quán theo LOẠI file** | Playbook: `Title → When To Run → Lifecycle → Engine → body → Cross-Project`. Template: header-comment (step/gate/role/bilingual). Runbook: `preconditions → steps → verification → rollback`. |
| **C7** | **Nhãn thành thật** | Nơi có khẳng định về độ chín: gắn `PROVEN` (đã kiểm chứng) / `PATCHED` (vá-từ-bài-học) / `ASPIRATIONAL` (chưa-làm). Không nói cái chưa-chứng-minh như đã có. |
| **C8** | **Song ngữ đúng chỗ** | Doc agent-facing (máy đọc) = English. Doc human/PM-CS-facing = tiếng Việt + gloss (mở ngoặc giải thích) thuật ngữ inline. Không dịch nửa vời. |
| **C9** | **Naming** | kebab-case, mô tả; KHÔNG thêm prefix taxonomy (VD `ba-`/`qa-`); discovery = index (README/KEYWORD-MAP) + dòng trigger, không phải tên file. |
| **C10** | **Verified thì sticky (không đụng vì văn phong)** | KHÔNG rewrite nội-dung-đã-dogfood (code stack template, gate từng bắt bug thật) chỉ để "câu đẹp hơn" — chỉ sửa khi SAI/lỗi thời. Prose polish dừng ở ranh giới code. Code sạch bằng toolchain (lint/tsc/build), không bằng viết tay. |

## Cách dùng trong refactor
1. Mỗi thay đổi: ghi `[Cx]` nó phục vụ (VD "cắt đoạn lặp — C3", "bỏ tên elearning — C1").
2. Không gắn được `Cx` → **để nguyên** (đừng chỉnh cho vui).
3. **Verify sau mỗi file:** 0 ref gãy, 0 nội-dung-verified bị lật (C10), gate xanh.
4. Đụng "quyết định đã verified" → **surface cho người**, không tự lật (luật review-audit).

> Chuẩn này chính nó phải theo C4 (gọn) — nếu nó phình ra thì cũng sai.
