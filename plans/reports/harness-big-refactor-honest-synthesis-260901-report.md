# Harness — tổng hợp thành thật trước big refactor (trọng tâm Macro-2 + luồng tạo issue)

> 2026-09-01. Gom mọi vấn đề đã lộ ra trong phiên làm rõ với Nghĩa. Mọi kết luận có bằng chứng file/số git đã verify. Mục tiêu: chuẩn bị 1 đợt refactor lớn, và làm harness "chạy đến đâu biết đến đó".

## 0. Mục tiêu refactor (Trung đặt)
- Chạy tới đâu biết tới đó: không thừa, không thiếu, dễ tiếp cận, hết mơ hồ.
- Neo lại luồng tạo task cho đúng cách team thật sự làm việc (chi tiết ở SRS + prototype, không phải register).

## 1. Bản đồ hiện tại (sự thật, có số git)

3 tài liệu, 3 vai trò, 3 nhịp cập nhật (cửa sổ phase-2, từ 15/8):

| Tài liệu | Vai trò thật | Commit phase-2 | Mốc tạo đầu |
|---|---|---|---|
| `docs/requirements/srs/` (SRS sống) | chi tiết chức năng + AC gốc | 23 | 22/6 |
| `docs/visuals` (prototype) | giao diện (layout, số nút) | 31 | 22/6 |
| `feature-register.source.json` | mục lục scope + giá | 6 | 29/6 (xlsx 26/6) |

- Thứ tự tạo THẬT: SRS + prototype TRƯỚC (22/6), register SAU (26-29/6). Không phải "register đẻ ra SRS".
- `docs/discovery/2026-06-22/.../srs/` = bản gốc ĐÓNG BĂNG (0 sửa) — đừng nhầm với SRS sống.
- Cách tạo issue HIỆN TẠI: agent soạn tay chủ yếu từ SRS -> `new-issue.mjs`. Quét 120 issue: 0 issue có khối AUTO -> **không issue nào sinh bằng `feature-issues-sync`**.

## 2. Kho vấn đề (mỗi cái: hiện trạng + bằng chứng + tác hại)

**P1 — Script sync đời cũ, chỉ đọc register stub.**
`feature-issues-sync.mjs` đầu vào duy nhất là register json (dòng 23), dựng issue từ field `goal/desc/ac`. Không đọc SRS/prototype. Register phase-2 là STUB (F-054/F-058: goal/ac rỗng). -> chạy ra issue rỗng ruột. Không dùng làm chuẩn được.

**P2 — 3 tài liệu tách rời, nối tay, không đồng bộ.**
Register (scope) + SRS (chi tiết) + prototype (visual) maintain 3 nơi, khác nhịp (6 vs 23 vs 31). Không có khoá nối tự động. REQ-ID lẽ ra là neo nhưng chưa được ép xuyên suốt.

**P3 — Không có gate "module đủ chưa" (RTM).**
Không kiểm được cơ học 1 module đã có đủ SRS + featlist + prototype + issue + test. Có mảnh rời (`check-manifest-coverage` REQ↔phase, `check-ac-coverage` REQ↔test, `check-new-screen-fidelity` màn↔spec) nhưng KHÔNG có bảng tổng.

**P4 — Không có check chống agent bịa.**
Đường agent (soạn từ SRS) có thể chế REQ-ID giả / AC không gốc. Không có script kiểm "REQ-ID trong issue có tồn tại trong SRS không". Chỉ người bắt được.

**P5 — Prototype phase-2/3 chưa freeze (PB-G3.2/G3.3 pending).**
`pb-g3-prototype-frozen.md` ghi rõ phase-2 "rebuilt fresh, reviewed at PB-G3.2". Không có bản prototype chốt -> không adopt-export -> gate fidelity không có mốc so -> lỗ "code 3 nút hay 4 nút" mở, chỉ người QC bắt.

**P6 — CR/feedback không tự đồng bộ vào issue đã tạo.**
Issue là bản chụp lúc tạo, docs sửa sau thì issue không đổi. `feature-issues-sync` CÓ cơ chế re-sync khối AUTO (khớp `feat-id`) nhưng phase-2 soạn tay nên vô dụng.

**P7 — Phase-2 đi tắt, luồng thật ≠ luồng thiết kế.**
Issue phase-2 không qua feat-list-sync, không qua build-manifest 2.3 (manifest cố ý loại phase-2, dòng 12). Đi qua plan-fold riêng (`plans/260829-...fold`). "Luồng chuẩn" trên giấy và luồng chạy thật lệch nhau.

**P8 — G2: gate chỉ chạy local, gh-merge bypass.**
`ci.yml` không chạy trên pull_request; `lint:gates` + verify-gate chỉ hook local. gh-merge bỏ qua hết. Repo private free không bật được branch-protection. (Đã biết, Trung tạm hoãn.)

**P9 — Nghĩa có 3 thứ harness CHƯA có (đang tưởng đã có).**
(a) UAT chia 3 loại (bug/CR nhỏ/CR lớn) — không có trong docs. (b) CR nhỏ bỏ qua báo giá — bước 3.5 LUÔN chạy impact+báo giá, không có nhánh nhẹ. (c) DoD bắt buộc update SRS mọi bug — DoD có mục cập nhật tài liệu nhưng cho N/A.

**P10 — Không có lớp observability.**
Không có cách nhìn 1 phát biết "harness đang ở đâu, module nào đủ/thiếu, issue nào lệch docs". Đây là gốc của cảm giác "mơ hồ".

**P11 — Deploy mong manh (ops).**
Hôm nay: 1 env var mới (`FORM_PII_ENC_KEY`) làm api crash boot -> deploy fail. Beta Release chạy nhưng deploy.yml không kích (đang dở chẩn). Tách riêng khỏi refactor luồng-issue nhưng cần xử.

## 3. Đích refactor (nhóm lại)

1. **Neo = REQ-ID.** Ép REQ-ID xuyên register ↔ SRS ↔ prototype ↔ issue ↔ test ↔ code.
2. **Generator mới (hướng B).** Thay `feature-issues-sync`: với mỗi REQ-ID, kéo scope từ register + AC từ SRS + link giao diện từ prototype. Register hết vai "chứa chi tiết", về đúng vai "mục lục".
3. **RTM completeness gate.** 1 bảng REQ-ID × [register, SRS, prototype, issue, test, state], ô trống = thiếu -> fail. Giải quyết P3.
4. **Anti-fabrication check.** Mọi REQ-ID trong issue phải có trong SRS; verifier-agent kiểm chéo AC vs SRS. Giải quyết P4.
5. **Prototype freeze + fidelity theo phase.** Freeze PB-G3.2/3.3 -> có export -> gate so khớp visual. Giải quyết P5.
6. **CR re-sync.** Docs đổi -> đánh dấu issue bị ảnh hưởng để tạo lại/cập nhật (qua REQ-ID). Giải quyết P6.
7. **Bù 3 thứ Nghĩa cần (P9).** Định nghĩa UAT 3-loại + nhánh CR-nhỏ + luật DoD-SRS vào harness.
8. **Observability layer (P10).** Xem mục 4.

## 4. Observability — "chạy đến đâu biết đến đó" (cốt lõi)

Đề xuất 1 thứ duy nhất giải quyết cảm giác mơ hồ: **1 bảng RTM sống, sinh bằng lệnh từ repo.**

Hàng = REQ-ID. Cột = từng chặng. Mỗi ô xanh (có + hợp lệ) / vàng (có, chưa freeze) / đỏ (thiếu):

```
REQ-ID       | register | SRS | prototype(freeze) | issue | test | code | state
MD.CUST.01   |   ✓     |  ✓  |     ✓ (frozen)    |  #985 |  ✓   |  ✓   | Ready for Test
MD.CUST.05   |   ✓     |  ✓  |     ⚠ chưa freeze |  #985 |  ✓   |  ✗   | In Dev
AF.LINK.01   |   ✓stub |  ✓  |     ✗            |   -   |  -   |  -   | Backlog
```

- Nhìn bảng = biết ngay module nào đủ, REQ nào thiếu chặng nào, không thừa không thiếu.
- 1 lệnh `node scripts/rtm-status.mjs` sinh bảng (Markdown/HTML) từ: quét register + SRS + prototype-manifest + gh issue + test + git.
- Đây vừa là **observability** (Trung nhìn tiến độ), vừa là **completeness gate** (CI fail nếu REQ in-scope có ô đỏ ở chặng bắt buộc).

Đây là "1 màn hình biết harness đang ở đâu" — thay cho mơ hồ hiện tại.

## 5. Ưu tiên đề xuất (làm gì trước)

1. **RTM status + gate (mục 4)** — làm TRƯỚC. Nó cho thấy toàn cảnh + là nền kiểm mọi thứ sau.
2. **Generator hướng B** — thay script cũ, neo REQ-ID, đọc 3 nguồn.
3. **Anti-fabrication check** — đi kèm generator.
4. **Prototype freeze phase-2** — mở khoá gate visual.
5. **CR re-sync + 3 bổ sung của Nghĩa** — sau khi neo REQ-ID xong.
6. **Deploy P11** — xử song song, không chặn refactor.

## Cần Trung/Nghĩa quyết
- Chốt hướng B (generator mới) thay `feature-issues-sync` — đồng ý không.
- Register về đúng vai "mục lục scope", chi tiết ở SRS/prototype — chốt vai trò này thành luật.
- Thứ tự ưu tiên mục 5 — giữ hay đổi.
- Phase-2 đang chạy dở: dừng tạo thêm issue kiểu cũ tới khi có generator mới, hay cứ chạy nốt rồi refactor sau.
