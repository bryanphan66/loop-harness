# Kế hoạch: Cầu đồng bộ Google Sheet <-> GitHub (Apps Script)

> Mục tiêu: tự động hoá việc đang copy tay giữa UAT Sheet (khách) và GitHub Issues (team). Vì GitHub <-> Plane đã tự đồng bộ 2 chiều rồi, nên chỉ cần lo Sheet <-> GitHub; dữ liệu sẽ tự chảy tiếp qua Plane.

## 0. Bối cảnh + nguyên tắc

Topology (sơ đồ luồng):
```
[Google Sheet] <--- cầu Apps Script (kế hoạch này) ---> [GitHub Issues] <--- đã có, tự động ---> [Plane]
   (khách UAT)                                              (team)                                  (team)
```

Nguyên tắc xương sống - **"2 chiều" = 2 luồng 1 chiều, chia theo cột** (tránh đụng độ):
- Cột **khách sở hữu** (feedback, kết quả chấm): chỉ chảy **Sheet -> GitHub**.
- Cột **hệ thống sở hữu** (dev-status, link issue): chỉ chảy **GitHub -> Sheet**; khách KHÔNG được sửa (khoá ô).
- Không ô nào bị cả 2 bên ghi -> không bao giờ tranh nhau.

## 1. Phạm vi

### MVP (làm trước - đủ dùng)
- Mỗi dòng Sheet <-> 1 GitHub Issue (issue cha của tính năng UAT).
- Sheet -> GitHub: khách đổi "Kết quả" hoặc thêm "Ghi chú" -> tạo/cập nhật issue + post ghi chú thành comment.
- GitHub -> Sheet: khi dev đổi trạng thái (đóng issue / gắn nhãn "dev đã fix") -> ghi ngược vào cột "Dev status" + "Trạng thái" cho khách thấy.
- Issue tạo ra luôn có nhãn `plane` (để tự chảy tiếp qua Plane) + nhãn Module tương ứng.

### Ngoài MVP (làm sau / để agent lo)
- Tự đẻ **task con** (child bug/enhancement) khi khách chấm "Chưa đạt" -> MVP chỉ post ghi chú thành comment trên issue cha; việc đẻ child để agent hoặc làm tay.
- Tự roll-up "xong hết child -> báo cha đã fix".
- 2 chiều real-time tức thì (MVP dùng polling định kỳ là đủ).

## 2. Thiết kế cột Sheet (schema)

| Cột | Ai sở hữu | Chiều sync | Ghi chú |
|---|---|---|---|
| Tên tính năng | Khách/PM | Sheet -> GitHub | title của issue |
| Module | PM | Sheet -> GitHub | map sang nhãn `Module: X` |
| Kết quả chấm (Đạt / Chưa đạt) | Khách | Sheet -> GitHub | tín hiệu chính để sync |
| Ghi chú (note feedback) | Khách | Sheet -> GitHub | -> post thành comment |
| **Dev status** (Đang làm / Đã fix) | Hệ thống | GitHub -> Sheet | **khoá ô, khách không sửa** |
| **Trạng thái issue** (open/closed) | Hệ thống | GitHub -> Sheet | khoá ô |
| **Issue # (khoá)** | Hệ thống | GitHub -> Sheet | **cột khoá để nối dòng <-> issue; nên ẩn** |
| **Link issue** | Hệ thống | GitHub -> Sheet | khoá ô, tiện bấm |

Cột "Issue #" là mã định danh (ID) để chạy lại không đẻ trùng - giống marker `feat-id` mà `feature-issues-sync.mjs` bên elearning đang dùng.

## 3. Cơ chế đồng bộ

### 3a. Luồng Sheet -> GitHub
- **Trigger (kích hoạt):** installable `onEdit` trigger canh đúng cột "Kết quả chấm" / "Ghi chú"; HOẶC time-driven trigger (chạy mỗi ~5 phút) quét các dòng đổi. Kèm 1 nút menu **"Sync ngay"** để bấm tay khi cần.
  - Khuyến nghị MVP: **time-driven mỗi 5 phút + nút Sync ngay** (đơn giản, tránh spam GitHub API mỗi lần gõ phím).
- **Logic mỗi dòng:**
  1. Nếu cột "Issue #" trống -> gọi GitHub API tạo issue mới (title, body, nhãn `plane` + `Module: X`), lưu số issue trả về vào cột "Issue #" + "Link".
  2. Nếu đã có "Issue #" -> so nội dung, có đổi thì `PATCH` cập nhật issue.
  3. Nếu có "Ghi chú" mới (khác lần sync trước) -> post comment vào issue.
  4. "Kết quả = Đạt" -> đóng issue (close) hoặc gắn nhãn trạng thái tương ứng.

### 3b. Luồng GitHub -> Sheet
- **MVP - polling:** time-driven trigger (mỗi ~5 phút) gọi GitHub API list issue có nhãn `plane` (đã cập nhật gần đây), map theo "Issue #" về đúng dòng, ghi cột "Dev status" (theo nhãn "dev đã fix" / issue đóng) + "Trạng thái".
- **Nâng cấp sau - real-time:** deploy Apps Script thành **Web App (URL)**; GitHub Action bắt sự kiện issue (đổi nhãn/đóng) -> gọi URL đó đẩy cập nhật xuống Sheet ngay. (Chỉ làm khi cần tức thì.)

## 4. Công nghệ + cấu hình

- **Google Apps Script** gắn trong file Sheet (Extensions -> Apps Script). Viết JavaScript, dùng `UrlFetchApp` gọi GitHub API.
- **Auth GitHub:** dùng **PAT** (Personal Access Token - mã truy cập cá nhân thay mật khẩu), loại fine-grained, chỉ cấp quyền repo elearning (Issues: read/write). **Lưu trong `PropertiesService`** (kho khoá của Apps Script), KHÔNG hardcode trong code.
- **Chống trùng khi chạy song song:** dùng `LockService` để 2 lần trigger không chạy đè nhau.
- **Nhớ trạng thái đã sync:** lưu hash/nội dung lần sync gần nhất mỗi dòng (cột ẩn hoặc `PropertiesService`) để biết dòng nào thật sự đổi -> khỏi gọi API thừa.

## 5. Xử lý xung đột + edge case
- **Khoá cột hệ thống:** đặt Protected Range cho cột Dev-status / Trạng thái / Issue# -> khách không sửa được -> không đụng độ.
- **Xoá dòng ở Sheet:** không tự xoá/đóng issue (an toàn) - chỉ log cảnh báo.
- **Đổi tên/thứ tự cột:** map theo **tên cột (header)** chứ không theo vị trí -> đổi thứ tự không vỡ.
- **Rate limit GitHub:** gộp theo batch + chỉ gọi cho dòng đổi; polling 5 phút là an toàn.
- **Ghi chú tiếng Việt / ký tự đặc biệt:** encode UTF-8 khi gửi API.

## 6. Các bước triển khai (phases)

1. **Phase 1 - Khung + Sheet -> GitHub (create/update).** Dựng schema cột + Apps Script tạo/cập nhật issue từ dòng + lưu Issue# khoá. Test: thêm 1 dòng -> ra issue GitHub có nhãn `plane` -> thấy nó qua Plane.
2. **Phase 2 - GitHub -> Sheet (polling dev-status).** Time-driven đọc issue -> ghi Dev-status/Trạng thái ngược về đúng dòng. Test: đổi nhãn "dev đã fix" trên GitHub -> 5 phút sau cột Dev-status ở Sheet đổi.
3. **Phase 3 - Comment + Kết quả chấm.** Ghi chú khách -> comment issue; "Đạt" -> đóng issue. Khoá các cột hệ thống.
4. **Phase 4 (tuỳ chọn) - real-time.** GitHub Action -> Apps Script Web App để đẩy tức thì thay polling.

## 7. Rủi ro + giới hạn (nói thẳng)
- Đây là **giải pháp tạm** cho giai đoạn khách còn dùng Sheet. Khi khách chuyển sang Plane thì **bỏ cầu này** (đừng đầu tư quá sâu).
- Google Apps Script có **giới hạn quota** (thời gian chạy, số lần UrlFetch/ngày) - đủ cho quy mô UAT nhỏ, không hợp khối lượng lớn.
- Việc **đẻ task con tự động** (fail -> child bug) KHÔNG nằm trong cầu này; để agent hoặc làm tay.

## 8. Nghiệm thu (DONE khi)
- Thêm/sửa dòng ở Sheet -> issue GitHub tạo/cập nhật đúng, có nhãn `plane`, và thấy sang Plane.
- Dev đổi trạng thái trên GitHub -> cột Dev-status ở Sheet cập nhật (<= 5 phút).
- Chạy sync nhiều lần không đẻ issue trùng.
- Khách không sửa được cột hệ thống.

## 9. Câu hỏi mở cần chốt trước khi làm
1. Repo đích để tạo issue là repo nào (elearning-platform)? Nhãn Module map ra sao?
2. "Dev đã fix" thể hiện bằng gì trên GitHub: nhãn riêng (VD `dev-fixed`) hay đóng issue? (ảnh hưởng cách polling).
3. Mức real-time: 5 phút (polling) đủ chưa, hay cần tức thì (phải làm Phase 4)?
4. Ai giữ PAT + file Sheet (quyền sở hữu/chia sẻ)?
5. Có cần map luôn "Kết quả = Chưa đạt" thành hành động gì trên GitHub ở MVP không, hay chỉ post comment?
