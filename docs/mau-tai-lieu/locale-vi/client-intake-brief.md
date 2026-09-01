<!-- Bản dịch khách-facing của ../client-intake-brief.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (PB-G1, GAP-NNN, REQ-ID, MODULE.AREA.NN) giữ nguyên tiếng Anh. -->

# Đánh giá khách hàng (Client Intake Brief) — <khách / tên dự án nháp>

Ngày: YYYY-MM-DD · Trạng thái: review | proceed | park | decline

> **Bước 1.2 — Macro-Stage Pre-Build, Block A (PM Intake).** Đầu ra là một trang
> nội bộ của vendor để ra quyết định **go/no-go**: có tiến tới discovery + báo giá,
> hay từ chối?
>
> **Cổng:** `PB-G1` — intake go/no-go. Đây là **capture nội bộ**, KHÔNG page khách
> hàng (khác với `PB-G2`/`PB-G3`/`PB-G4` là cổng khách ký). Quyết định `proceed`
> mở đường sang discovery (1.3) và gap analysis (1.4 → sinh `GAP-NNN`).
>
> Sống tại `docs/intake/YYYY-MM-DD-<slug>-intake-brief.md` trong repo dự án. Có
> TRƯỚC `docs/requirements/gap-analysis.md` (cần độ rõ vấn đề kinh doanh mà brief
> này khai thác để đúc `GAP-NNN`).

## 1. Khách hàng

| | |
| --- | --- |
| Tên | <người + công ty> |
| Nguồn | <giới thiệu / inbound / cold> |
| Có người ra quyết định? | có / không — tên |
| Có quan hệ với vendor trước đó? | không có / dự án cũ: <ref> |

## 2. Nhu cầu khách đặt ra (một đoạn)

Khách đã nói muốn gì, theo lời của khách (paraphrase nếu trộn VN/EN, giữ nguyên ý).

## 3. Vấn đề kinh doanh đằng sau nhu cầu

Vấn đề thật sự khách đang cố giải quyết là gì? Đây là **nguồn cho `GAP-NNN`** ở
bước gap analysis (1.4) — mỗi gap trace ngược về một vấn đề kinh doanh ghi ở đây.
Nếu khách chỉ nói "giải pháp", đào sâu trong discovery (1.3).

## 4. Người dùng mục tiêu

| Vai trò | Số lượng ước lượng | Tác vụ chính |
| --- | --- | --- |
| <vai trò> | <NN> | <tác vụ> |

## 5. Tính năng khách yêu cầu (nguyên gốc)

Danh sách bullet, đúng như khách diễn đạt. Chưa cần tinh chỉnh — đó là việc của
discovery (1.3) và gap analysis (1.4).

- <tính năng>
- <tính năng>

## 6. Loại dự án

Đánh dấu một. Quyết định độ sâu template và chọn lane.

- [ ] Landing page / website marketing
- [ ] Web app (mục đích đơn)
- [ ] SaaS MVP (multi-tenant)
- [ ] Internal tool / admin panel
- [ ] Tool tự động hoá / workflow
- [ ] AI app (UX dựa LLM)
- [ ] E-commerce
- [ ] Dashboard / analytics
- [ ] Mobile app
- [ ] Khác: ____

## 7. Độ phức tạp ước lượng

Đánh dấu một.

- [ ] Thấp — một vai trò người dùng, không thanh toán, không tích hợp bên thứ ba ngoài auth + email
- [ ] Trung bình — đa vai trò, thanh toán đơn giản HOẶC 1-2 tích hợp, admin cơ bản
- [ ] Cao — multi-tenant HOẶC đa vai trò có phân quyền HOẶC checkout e-commerce HOẶC 3+ tích hợp HOẶC dữ liệu nhạy cảm (PII, tài chính, y tế)
- [ ] Rất cao — ngành chịu quản lý, real-time / streaming, mobile + web parity, > 10 tích hợp

## 8. Tiến độ

| Mục | Giá trị |
| --- | --- |
| Deadline khách đặt | YYYY-MM-DD |
| Lý do của deadline | <sự kiện / funding / mùa / tuỳ ý> |
| Vendor đánh giá khả thi | thực tế / sát / không khả thi |

## 9. Ngân sách

| Mục | Giá trị |
| --- | --- |
| Khoảng ngân sách khách nói | <khoảng số, loại tiền> |
| Vendor đánh giá so với scope | phù hợp / thiếu / dư |
| Hình thức thanh toán đã xác nhận | có / không |

Nếu "không nói ngân sách" hoặc "tuỳ báo giá rồi tính", flag trong § 13 — đi tiếp
mà không có khoảng thường lãng phí thời gian cả hai bên.

## 10. Câu hỏi sàng lọc có điều kiện (đánh dấu N/A nếu không áp dụng)

Hỏi ngay trong cuộc trao đổi đầu hoặc discovery. Phát hiện sớm tránh đập đi làm
lại sau khi ký (PB-G4). Đánh dấu **N/A bằng quyết định** nếu rõ ràng không liên quan.

- [ ] **Tuân thủ / lưu trú dữ liệu / DPA** — dữ liệu PII, tài chính, y tế? Yêu cầu
  lưu dữ liệu trong nước? Cần ký DPA? → N/A nếu: __________
- [ ] **Brownfield (thay hệ cũ)** — có thay thế hệ thống đang chạy không? Nếu có →
  cần **data migration** (cổng có điều kiện ở Build 2.1b). → N/A nếu greenfield.

## 11. Cờ đỏ

Đánh dấu mọi mục đúng. 2+ thường là từ chối hoặc đàm phán lại nặng.

- [ ] Không có người ra quyết định trong cuộc trao đổi
- [ ] Muốn giá cố định cho scope mơ hồ
- [ ] So sánh với competitor lớn hơn nhiều như "chắc dễ copy"
- [ ] Đã có nhiều vendor trước đó được nhắc đến ("anh trước nghỉ rồi")
- [ ] Ngân sách < 30% của khoảng vendor bình thường cho loại dự án này
- [ ] Deadline bất khả thi bất kể ngân sách
- [ ] Yêu cầu bỏ qua hợp đồng / "cứ tin em đi"
- [ ] Muốn sở hữu component tái sử dụng của vendor
- [ ] Không diễn đạt được vấn đề kinh doanh, chỉ giải pháp
- [ ] Khăng khăng dùng stack mà vendor không bảo trì được

## 12. Cờ xanh

- [ ] Có chỉ số kinh doanh rõ ràng
- [ ] Sẵn sàng đánh đổi scope để vừa ngân sách/timeline
- [ ] Có tài sản sẵn (thương hiệu, nội dung, dữ liệu mẫu)
- [ ] Dự án trước với vendor đã ổn
- [ ] Sẵn sàng ký hợp đồng và đặt cọc trước khi build (điều kiện `PB-G4`)
- [ ] Chỉ định một người ra quyết định

## 13. Câu hỏi mở cho Discovery (1.3)

Câu hỏi vendor cần trả lời TRƯỚC khi sang gap analysis (1.4) + báo giá (1.14). Nhóm
theo chủ đề để cuộc discovery nhanh hơn.

- Mục tiêu kinh doanh: <câu hỏi>
- User & vai trò: <câu hỏi>
- Dữ liệu: <câu hỏi>
- Quy trình nghiệp vụ: <câu hỏi>
- Admin / phân quyền: <câu hỏi>
- Thanh toán / billing: <câu hỏi>
- Nội dung / media: <câu hỏi>
- Tích hợp bên thứ ba: <câu hỏi>
- Deadline / ngân sách: <câu hỏi>
- Tiêu chí thành công: <câu hỏi>

## 14. Đánh giá rủi ro ban đầu

| Rủi ro | Khả năng | Ảnh hưởng | Biện pháp giảm thiểu nếu nhận |
| --- | --- | --- | --- |
| Scope creep | <thấp/TB/cao> | <thấp/TB/cao> | Báo giá § 9 mạnh + change-request-log |
| Trễ thanh toán | | | Thanh toán theo mốc trong báo giá § 7 |
| Trễ nội dung | | | Trách nhiệm khách trong báo giá § 12 |
| Rủi ro kỹ thuật (tích hợp lạ) | | | Spike trong discovery trước báo giá |

## 15. Quyết định PB-G1 (go/no-go)

Đánh dấu một. Đây là quyết định nội bộ — không cần khách ký.

- [ ] **Proceed (tiến tới discovery)** — lên lịch discovery (1.3). Sau đó gap
  analysis (1.4) → SRS (1.5) → feature register (1.9, cổng `PB-G2`).
- [ ] **Proceed có điều kiện** — phải giải quyết <các mục> trước discovery (e.g.
  khoảng ngân sách, người ra quyết định có mặt, câu hỏi tuân thủ § 10).
- [ ] **Park (tạm gác)** — thú vị nhưng thời điểm chưa đúng (dung lượng, fit). Đặt
  ngày follow-up: YYYY-MM-DD.
- [ ] **Decline (từ chối)** — không qua được kiểm tra cờ đỏ/ngân sách/khả thi. Gửi
  từ chối lịch sự (§ 16).

Lý do quyết định (một đoạn):

<text>

## 16. Phản hồi từ chối / tạm gác (nếu áp dụng)

```text
Tiêu đề: <dự án> — cảm ơn cuộc trao đổi

Chào <khách>,

Cảm ơn anh/chị đã chia sẻ chi tiết. Sau khi cân nhắc, em <chưa phù hợp /
chưa thể nhận trong quý này> vì <một lý do cụ thể — dung lượng / lệch
scope / lệch domain>.

<Nếu tạm gác: em rất sẵn lòng quay lại sau <ngày>. Em sẽ liên hệ lại lúc
đó.>
<Nếu từ chối: vài lựa chọn có thể phù hợp hơn: <giới thiệu hoặc công cụ
self-serve>.>

Chúc dự án thành công.

— <vendor>
```

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/client-intake-brief.md`.
- Discovery interview (1.3): `docs/playbooks/discovery-interview-playbook.md` (5 persona × 3 mode). **Engine:** `ck-rri`.
- Tiếp theo (1.4): `docs/mau-tai-lieu/locale-vi/gap-analysis.md` (sinh `GAP-NNN`).
- Bản đồ macro-stage + danh sách cổng: `docs/process/WORKFLOW.md`.
- Token grammar (GAP-NNN → REQ-ID → SC-NNN → TC-NNN → CR-NN): `docs/about/TRACE_SPEC.md`.
