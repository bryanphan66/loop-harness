# The Loop (Mode B) — spine 1 bảng

> **Nửa CHÍNH của harness** (doctrine 2-mode: A = xây hữu-hạn, **B = loop vĩnh-viễn**).
> Bắt đầu ngay khi app **go-live**: hết "bước hiện tại", chuyển sang **hàng đợi issue**.
> Đơn vị việc = 1 **issue** (có AC), KHÔNG phải phase. Đây là phần VỮNG NHẤT (mỗi luật = 1 lần đau đã kiểm chứng).
> Chi tiết đầy đủ: [`../playbooks/steady-state-issue-pipeline.md`](../playbooks/steady-state-issue-pipeline.md). Kit code: `scaffolds/steady-state/`.

## 6 nhịp của 1 vòng (mỗi issue chạy qua)

| Nhịp | Làm gì | Công cụ |
|---|---|---|
| **discover** | Bug/đổi/feedback → 1 issue (gắn Parent nếu là bug con) | `new-issue.mjs` · `github-issue-standard` (chuẩn issue) |
| **dispatch** | Giao 1 coder/issue, worktree riêng | (ctl dispatch) |
| **verify** | verify-at-source + gate + QC checklist | `qc-checklist.mjs` · gate |
| **recover** | Tự-sửa khi lỗi (bounded, fail-closed) | `push-retry.sh` (R2), `ship-and-verify.sh` (R3) |
| **persist** | Lưu trạng thái trên bảng 10-state | `issue-state.mjs` (ép cạnh hợp lệ) |
| **decide-next** | QC pass → tiến; fail → luật vàng | — |

## 10 trạng thái (issue chỉ đóng ở Done)

```
Backlog → Ready for Dev → In Dev → Deploying → Ready for Test
        → QC Testing → Ready for UAT → UAT Testing → Done        (+ Cancelled)
```
`issue-state.mjs` **ÉP** cạnh chuyển (nhảy cóc Backlog→Done bị chặn; `--force "<lý do>"` chỉ cho người; **`--advance` tự đi các bước hợp lệ tới đích, tối đa In Dev**). QC = **hybrid**: agent-QC lo phần KHÁCH QUAN (assert API/DB/RBAC + tick DoD) + **flag thị giác cho human**, đẩy tới Ready for UAT; **UAT + Done vẫn HUMAN** (thị giác/cuối). **Verify PHẢI 2 lượt, lượt 2 ADVERSARIAL (REFUTE)** — 1 lượt sót ~50% false-PASS (dogfood 260902). Control set state TẠI dispatch/QC-dispatch (bind vào hành động, đừng để worker tự nhớ).

## Luật đã đổ máu (mỗi cái từng gây bug thật)

- **Luật vàng khi QC fail:** lỗi TRONG AC → lùi `In Dev` sửa issue cũ; lỗi NGOÀI AC → **issue mới**.
- **Refs-not-Closes:** `Refs #N` ở CẢ commit lẫn PR body (squash gộp `Closes` → đóng nhầm sớm).
- **verify-at-source:** sau deploy, container CHẠY phải mang đúng commit — không tin CI-xanh/HTTP-200.
- **Issue Type vs Label:** Feature/Bug/Enhancement = Issue Type; label CHỈ `github`+`plane`; Module=body; Phase=Milestone.

## Bug / UAT / CR đi đâu (routing)
- **Bug** (QC/UAT): issue con, KHÔNG vào feature-register.
- **CR nhỏ-free:** như bug.
- **CR lớn-tính-tiền:** `CR-NN` full luồng (impact + báo giá + duyệt) → REQ-ID mới re-entry ở **2.3** → vào register.
- Test: có phải FEATURE khách trả tiền? Có → register. Chi tiết: [`../playbooks/steady-state-issue-pipeline.md`](../playbooks/steady-state-issue-pipeline.md) § Bug vs UAT vs CR.

## Recover (Frontier 1)
- **R2** `push-retry.sh` `PROVEN` — retry push flaky (bounded).
- **R3** `ship-and-verify.sh` `PROVEN` — verify SHA staging, re-trigger 1 lần, drift → mở issue.
- **R1** auto re-dispatch khi BLOCKED = `ASPIRATIONAL` (chưa build — đừng tưởng đã có).

## Đọc thêm
- Đặc tả 2-mode: [`../about/OPERATING-MODES.md`](../about/OPERATING-MODES.md) · Vào loop sau khi dự án bàn giao xong (bàn giao -> hypercare -> loop); phần đó thuộc workflow của dự án, không thuộc loop-harness.
