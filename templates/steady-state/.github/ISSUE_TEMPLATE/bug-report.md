---
name: Issue chuẩn (Bug / Enhancement / Feature)
about: Khung chuẩn duy nhất - 5 khối + DoD 13 mục. Agent nên chạy scripts/new-issue.mjs thay vì gõ tay.
title: ""
labels: plane
assignees: ""
---

<!--
  KHUNG CHUẨN DUY NHẤT (github-issue-standard.md). Giữ đủ 5 khối + khối DoD 13 mục.
  Agent: ĐỪNG gõ tay - chạy `node scripts/new-issue.mjs --input issue.json --create`
  (DoD do script tự ghi, không thể sai). Tạo tay xong PHẢI qua `--check <n>`.
  Nhớ: gắn thêm nhãn `Module: <Tên>` + Issue Type (Bug/Enhancement/Feature) + Milestone(Phase).
-->

## Bối cảnh

<1-3 câu: hiện trạng + vì sao cần đổi (nguyên văn khách nếu là bug). Nhạy cảm nghiệp vụ (giá/đơn/thanh toán/phân quyền/dữ liệu): ghi quyết định Tech Lead đã chốt.>

## Phạm vi

**Trong phạm vi:**
- <điền>

**Ngoài phạm vi:**
- <điền>

## Tiêu chí nghiệm thu (Acceptance Criteria - AC)

- [ ] Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>.  Demo: <điền khi QC xong> | HDSD: <điền khi QC xong>

## Định nghĩa hoàn thành (Definition of Done - DoD)

> Mỗi mục xong đính thông số/link. Mục không áp dụng: ghi `N/A - <lý do>` (ĐỪNG xoá dòng, ĐỪNG rút gọn).
- [ ] Xong toàn bộ AC ở trên (mỗi AC QC-pass được trên staging)
- [ ] Lint pass (CI) - (link)
- [ ] Unit test pass, coverage đạt ngưỡng (dự án tự đặt) - (link)
- [ ] Integration test pass - (link)
- [ ] E2E test pass - (link)
- [ ] Security test (OWASP / NFR bảo mật) - (link)
- [ ] Regression - không phá chức năng/số liệu liên quan (kiểm hồi quy sau khi lên staging)
- [ ] Mobile 375px + WCAG AA (nếu có UI) - (link)
- [ ] HDSD tính năng đầy đủ (user guide cả tính năng) - (link)
- [ ] Cập nhật tài liệu liên quan trong source - (commit)
- [ ] Deploy staging + verify-at-source (health ok, SHA == commit đã merge) - (link)
- [ ] QC pass (human) - (ghi chú)
- [ ] UAT khách đạt (mirror sang PM-tool) - (link)  -> mới chuyển Done

## Liên kết

- Commit / PR: dùng `Refs #N` - KHÔNG Closes/Fixes/Resolves (không đóng issue sớm).
- PM-task (Plane...): đồng bộ 1-1 với issue.
- Link staging tính năng liên quan; issue/PR liên quan.
