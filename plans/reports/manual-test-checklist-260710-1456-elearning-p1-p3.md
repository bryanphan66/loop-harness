# Manual Test Checklist — elearning P1→P3 (live dev deploy)

**App:** https://elearning.160.250.134.226.sslip.io · **API:** https://api-elearning.160.250.134.226.sslip.io
**Build:** branch `videcode-build` @ `be9ae79` · deployed on dokploy `Nhat Nghe eLearning`.

## Chuẩn bị (đọc trước)
- **Lấy mã OTP** (app chạy `NODE_ENV=production` nên response KHÔNG trả mã — mã nằm trong log):
  dokploy dashboard → project *Nhat Nghe eLearning* → service *api* → **Logs** → tìm dòng
  `otp code issued (dev channel) ... "code":"NNNNNN"` ngay sau khi bấm gửi OTP.
  *(Nếu đào log phiền, báo tôi bật toggle preview trả devCode trong response.)*
- **Account seed sẵn** (đăng nhập bằng email này, passwordless OTP):
  - Admin: `admin@nhatnghe.local` · Superadmin: `superadmin@nhatnghe.local`
  - COO: `coo@nhatnghe.local` · Marketing: `marketing@nhatnghe.local` · Giảng viên: `instructor@nhatnghe.local`
  - **Học viên (target impersonate / test 403): `student@nhatnghe.local`**
- Có 2 tab trình duyệt (hoặc ẩn danh) để test 2 vai song song sẽ tiện.

---

## P1 — Auth & Session (OTP + session)
| # | Thao tác | Kỳ vọng | ✔ |
|---|---|---|---|
| 1.1 | Mở `/auth/login`, nhập `admin@nhatnghe.local`, bấm gửi | Chuyển màn nhập OTP (`/auth/otp-verify`); UI khớp prototype | ☐ |
| 1.2 | Lấy mã từ log api, nhập đúng, verify | Đăng nhập thành công, vào được khu vực cần auth (không bị đá về login) | ☐ |
| 1.3 | Đăng xuất, login lại, nhập **sai** OTP (vd `000000`) | Báo lỗi **thật** ("mã sai/hết hạn"), KHÔNG phải lỗi generic; không cho vào | ☐ |
| 1.4 | Bấm gửi OTP **>5 lần** trong 1 giờ cho cùng email | Tới lần thứ 6 bị chặn "quá nhiều yêu cầu" (rate-limit ≤5/giờ) | ☐ |
| 1.5 | (tuỳ chọn) Đăng nhập xong, để yên rồi refresh trang | Vẫn còn phiên (session/refresh-cookie hoạt động), không bị đá ra | ☐ |
| 1.6 | Google login (nút nếu có) | **Skip** — chưa cấu hình OAuth creds ở dev (client id trống) | n/a |

## P2 — RBAC & Permission Matrix
| # | Thao tác | Kỳ vọng | ✔ |
|---|---|---|---|
| 2.1 | Login `admin@nhatnghe.local` → mở `/admin/roles` | Thấy **ma trận role × quyền** (sticky 2 chiều), UI khớp prototype; các role hệ thống hiển thị | ☐ |
| 2.2 | Tick/bỏ tick 1 ô quyền của 1 role, bấm **Lưu** | Lưu thành công (toast/thông báo); reload lại thấy giữ trạng thái | ☐ |
| 2.3 | Bỏ 1 quyền của role Học viên (vd quyền vào 1 khu admin) | Lưu OK | ☐ |
| 2.4 | Tab 2: login `student@nhatnghe.local`, thử vào khu vực admin (vd `/admin/roles`) | **Bị chặn / 403 lỗi thật** — student không có quyền admin | ☐ |
| 2.5 | (tuỳ chọn) Tạo/đổi tên 1 custom role | Tạo được, xuất hiện trong ma trận | ☐ |

## P3 — Impersonation (Login-As)
| # | Thao tác | Kỳ vọng | ✔ |
|---|---|---|---|
| 3.1 | Login admin → tìm chức năng **Impersonate** 1 user (vd `student@nhatnghe.local`) | Vào được phiên "đóng vai" học viên đó | ☐ |
| 3.2 | Quan sát màn khi đang impersonate | Có **banner cảnh báo** "đang đăng nhập thay …" (khớp prototype) | ☐ |
| 3.3 | Thao tác vài thứ dưới danh nghĩa target, rồi bấm **Thoát impersonate** | Quay về đúng tài khoản admin gốc, banner biến mất | ☐ |
| 3.4 | (admin) Kiểm tra **audit log** phiên impersonate | Có bản ghi: ai impersonate ai, thời điểm | ☐ |
| 3.5 | Tab student: thử gọi chức năng impersonate | **403 lỗi thật** — non-admin không được impersonate | ☐ |

---

## Cách ghi kết quả
- Tick ☑ nếu đúng kỳ vọng; nếu sai → ghi ngắn "mục X.Y: <hiện tượng>" gửi lại tôi.
- Mục nào **UI lệch prototype** (màu/bố cục/thiếu nút) cũng ghi — đó là phần verifier tự động KHÔNG bắt được, chỉ mắt bạn thấy.

## Lưu ý honest
- Verifier tự động đã PASS phần **chức năng/API** (OTP, 401 sai mã, rate-limit, RBAC guard 403, impersonate audit, non-admin 403) — checklist này để BẠN xác nhận lại + **judge UI/UX** (thứ AI chưa tự chứng).
- Vài mục (1.4 rate-limit, 1.5 refresh) hơi khó thấy trên UI; nếu ngại, tôi đưa lệnh `curl` để test trực tiếp.
