# Devops handoff — vps02 clock skew làm self-hosted runner offline, deploy staging kẹt

Ngày: 2026-07-23 · Máy: vps02 `160.250.134.226` (ssh `deploy@…:2222`) · Org: RenoAI-Labs

## Triệu chứng
- Deploy staging elearning (`deploy-staging.yml`) + `ci.yml` cho commit `94d92b9` **kẹt `queued`** vô thời hạn.
- `GET /orgs/RenoAI-Labs/actions/runners` → 3 runner `reno-runner-1/2/3` (id 120/121/122) **status=offline**.
- 3 service `actions-runner@{1,2,3}` (user `deploy`, systemd --user) **crash-loop** (`activating/auto-restart`), rò rỉ ssh-agent (đã dồn 27 tiến trình).

## Nguyên nhân gốc (ROOT CAUSE) — ĐỒNG HỒ MÁY SAI GIỜ
- `date -u` trên vps02 = **`2026-07-23T11:53:44Z`**, giờ thực cùng lúc ≈ **`03:0x UTC`** → vps02 **nhanh ~9 tiếng**.
- `timedatectl`: **`System clock synchronized: no`**, **`NTP service: inactive`**.
- Hệ quả: runner đăng ký được + "√ Connected to GitHub" (bước handshake dễ tính giờ), NHƯNG khi tạo **session** GitHub kiểm token theo giờ chặt → token giờ-tương-lai bị loại → trả lỗi gây hiểu nhầm:
  `Failed to create a session. The runner registration has been deleted from the server, please re-configure.`
  Runner không giữ nổi kết nối → GitHub tự dọn đăng ký → job không có runner nhận → kẹt.
- Đã kiểm loại trừ: RAM ổn (19Gi trống, không OOM); không phải tranh chấp file (`.runner`); đăng ký lại sạch bằng `config.sh remove --local` + `config.sh --replace` VẪN lỗi y hệt khi chạy `run.sh` tay ở tiền cảnh → chứng minh do giờ, không do cấu hình.

## Cách sửa (CẦN ROOT/sudo trên vps02 — deploy user KHÔNG có sudo)
1. Chỉnh giờ + bật đồng bộ NTP:
   ```
   sudo timedatectl set-ntp true
   # nếu chưa có timesyncd:
   sudo apt-get install -y systemd-timesyncd && sudo systemctl enable --now systemd-timesyncd
   timedatectl   # xác nhận: System clock synchronized: yes, UTC đúng thực tế
   ```
2. Khởi động lại 3 runner (chạy DƯỚI user `deploy`, KHÔNG cần PAT vì đăng ký 120/121/122 còn nguyên):
   ```
   sudo -u deploy XDG_RUNTIME_DIR=/run/user/$(id -u deploy) systemctl --user start actions-runner@1 actions-runner@2 actions-runner@3
   # hoặc: đăng nhập deploy rồi: for i in 1 2 3; do systemctl --user start actions-runner@$i; done
   ```
3. Kiểm online: `GET /orgs/RenoAI-Labs/actions/runners` → 3 runner `status=online`.
4. Xong: 2 job `queued` (deploy-staging + ci cho `94d92b9`) **tự chạy** — KHÔNG cần push lại. Deploy #203 (hero trắng + HDSD light) sẽ tự lên staging.

## Vấn đề phụ (cùng gốc thiếu sudo, không chặn deploy)
- `ci.yml` bước `playwright install --with-deps chromium` fail vì `deploy` không có passwordless sudo (`sudo: a password is required`). Sửa: hoặc pre-bake chromium system-deps vào máy runner, hoặc bỏ `--with-deps` (dùng deps đã cài sẵn), hoặc cấp passwordless sudo cho `deploy` ở đúng lệnh cài.
- Rò rỉ ssh-agent: mỗi vòng crash-loop để lại 1 `ssh-agent` (đã dồn 27, đã `pkill` dọn). Sau khi giờ đúng + runner ổn định sẽ hết. Có thể thêm dọn trong ExecStopPost.

## Bảo mật
- PAT (admin:org) người dùng cấp CHỈ dùng tạm trong phiên để đăng ký lại + kiểm online; **KHÔNG lưu lên vps02**. User nên **thu hồi PAT** sau khi devops sửa xong (việc khởi động runner không cần PAT).

## Trạng thái để lại
- 3 service đã **stop hẳn** (inactive), 0 ssh-agent rò rỉ — tránh crash-loop/leak tới khi giờ được sửa.
- Đăng ký runner 120/121/122 còn trên GitHub.

## Đã thử đường vòng ubuntu-latest — CHẾT vì billing (2026-07-23)
Đã thử né việc sửa giờ bằng cách đổi repo var `CI_RUNNER` -> `ubuntu-latest` (job deploy tự chứa: kamal SSH vào vps02 bằng `secrets.KAMAL_SSH_PRIVATE_KEY`, chạy runner nào cũng được). Dispatch `deploy-staging.yml` -> job nhận nhãn `ubuntu-latest` nhưng fail tức thì 0 step:
> "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section."
=> **Org RenoAI-Labs không dùng được GitHub-hosted runner (billing lỗi / spending limit = 0)** — đây chính là lý do tồn tại self-hosted. Đã **đảo `CI_RUNNER` về `self-hosted`** để post-fix route đúng.

**Kết luận: chỉ có 2 đường, đều cần admin khác:**
1. **(Khuyến nghị) Sửa giờ vps02** — root/devops, 2 phút, miễn phí, dùng lại self-hosted sẵn có. Bắt buộc dù sao (giờ lệch 8.5h hại cả app: OTP/JWT/TLS/timestamp).
2. Sửa billing GitHub org — chủ org, tốn phút Actions có phí; chỉ cần nếu muốn bỏ hẳn self-hosted.

## Câu hỏi chưa giải quyết
- Vì sao đồng hồ vps02 lệch ~9h (NTP tắt từ bao giờ)? Cần devops xác nhận nguyên nhân để không tái diễn (VM host drift? image thiếu timesyncd?).
