# auto-script — Macro-2 UI port + fix leg summary (2026-07-07)

Branch `worktree-macro2-build` (5 code commits + docs), deployed lên Dokploy compose `EBvEqNSqJES3xRjhyQB_S`, smoke live PASS. Chi tiết + screenshots: `auto-script/plans/reports/macro2-ui-port-fidelity-report.md` (+ `assets/live-app-*.png`).

## Màn đã port SÁT prototype (claude-design-v3 export)

- **Shell APP** (mọi trang /app): topbar 56px (brand mark, search, VI/EN, bell, avatar menu chứa Cài đặt/Thanh toán/Quota/Tài liệu) + sidebar icon 232px đúng OWNER_NAV + ws-switch. CSS token/component port verbatim (`app-tokens.css`/`app-shell.css`/`app-feed-v3.css`).
- **Feed Outlier `/app/feed`** (màn operator chỉ đích danh): 2 cột chan-panel|feed, channel rows nhóm theo pillar + tier dot + hover stats popover + click-để-lọc (CR-07), Long/Shorts tabs (CR-11), pillar select + time chips + nút Quét cam (CR-12a), filter strip Score≥/tier/freshness (CR-09), section 4 tier + card vc3 đầy đủ badge %, Avg/Base + bar, freshness tag, VIRAL/IDEA/TỐT, 3 action (CR-08). Data wiring thật giữ nguyên.
- **Dashboard `/app/dashboard`**: KPI row 4 stat-card (kênh / outlier 7d + minibar tier / token AI + bar ngưỡng / trạng thái quét + Quét ngay) trên các data card P22.

## Fix chức năng (verified live)

- **Script-gen UX**: job error thật surface ra tray (hết "đã có lỗi xảy ra" — giờ thấy đúng "Mô hình … yêu cầu gói pro trở lên…"); dialog có selector Mô hình AI mặc định theo tier (basic → deepseek-chat), model pro-only disabled + hint nâng cấp. Live smoke: gen deepseek-chat ra kịch bản thật 3.4k ký tự (token API thật).
- **QR SePay**: root cause = `docker-compose.prod.yml` không truyền `SEPAY_BANK_ACCOUNT/CODE` vào api container → fix compose; billing giờ hiện ẢNH VietQR thật (qr.sepay.vn/img) + nút mở link dự phòng.

## Còn lại cho leg sau

- Script editor `/app/scripts/[id]`, Brand Blueprint, Idea/Prompt/Chat/Channels list bodies (đã hưởng shell mới, body chưa port).
- Dashboard charts row (outlier 12 tuần + donut thể loại) — cần endpoint time-series.
- Polish nhỏ: lang-switch pill, nav-count badges, CR-12b modal quét-theo-lịch, copy trùng "Mới đăng" (tier early vs freshness).

Gates: validate:quick ✅, unit 172+12 ✅, Playwright 59/59 ✅ (2 spec cập nhật selector theo markup mới). STAGE.md giữ 2.12.
