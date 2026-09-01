# BUILD gate: AC-coverage floor cho Macro-2 phase-acceptance (Leg 1)

**Ngày:** 2026-08-31 · **Worker:** harness build · **Trạng thái:** DONE
**Context:** harness gốc `loop-harness/harness` + dogfood `elearning-platform`

## Vấn đề gốc

Leg 1 "Functional AC" của `docs/gates/phase-acceptance.md` (dòng :87-88) chỉ là
prose do verifier-agent chạy tay - không có script kiểm MỖI REQ-ID/AC của phase
có test map tới. Hậu quả (field run): 10/17 feature lọt QC lần đầu vì có REQ-ID
không hề có test nào chạm tới, nhưng gate vẫn xanh.

## Script làm gì

`scripts/check-ac-coverage.mjs` (đặt template + copy elearning):

1. Đọc **build-manifest** (`docs/build-manifest.md`) - lấy tập REQ-ID in-scope từ
   các dòng `**REQ-IDs covered:**` / `**REQ-IDs:**` của từng phase block (CÙNG hợp
   đồng mà `check-manifest-coverage` map sang phase). Gồm cả **dòng gấp** (manifest
   wrap REQ-ID list xuống dòng indented - sibling gate bỏ sót; gate này bắt).
2. **Nở range/list:** `IF.AUTH.01–03` -> 01,02,03 ; `MD.CUST.02/06` -> 02,06. Dùng
   CÙNG một extractor cho cả 2 phía (manifest + test) để notation kiểu range khớp
   với id viết rời (`IF.AUTH.02`).
3. Duyệt test dir (mặc định `apps/web/e2e`, `apps/web/e2e-ui`, `apps/api/src`,
   `apps/api/test`) gom mọi `*.spec.ts`/`*.e2e-spec.ts`/`*.test.ts`, trích + nở
   REQ-ID thành 1 Set.
4. REQ-ID in-scope nào KHÔNG có trong Set test (và không nằm allowlist) -> FAIL,
   liệt kê. Xanh nếu mỗi REQ-ID được >=1 test tham chiếu.

Config qua `gate-config.json -> acCoverage.{buildManifest, testDirs, allowlist}`.

**Fail-soft (skip, exit 0):** không có build-manifest / manifest chưa khai REQ-ID /
chưa có file test nào (bare skeleton). Giống các coverage gate anh em.

## Giới hạn (thành thật - đây là "coverage FLOOR", KHÔNG phải RTM)

Gate chứng minh mỗi REQ-ID **được nhắc trong >=1 test**. Nó KHÔNG chứng minh:
- mỗi AC dưới 1 REQ-ID có test riêng (REQ 3 AC + 1 test nhắc REQ đó vẫn qua sàn);
- test đó **assert đúng** AC, hay có chạy xanh (integrity là việc của verifier +
  gate chạy test, không phải static grep này).

-> Xanh `[ac-coverage]` = "không REQ-ID nào hoàn toàn không có test" - sàn cơ học
dưới Leg 1. Hành vi AC thực sự đúng vẫn do verifier-agent chạy app thật.

## Wire

- **Template** `package.json` `lint:gates`: thêm `check-ac-coverage.mjs` (HARD, cuối
  chuỗi) - dự án mới sinh ra sạch.
- **Elearning** `package.json` `lint:gates`: thêm `check-ac-coverage.mjs --advisory`
  (cuối chuỗi).
- `gate-config.json` (cả 2): thêm key `acCoverage`.
- `phase-acceptance.md`: thêm script vào danh sách shipped + hàng bảng enforcement
  mới `[AUTO] (coverage-floor)` cho Leg 1 (nửa coverage; nửa hành vi vẫn `[VERIFIER]`).

### Vì sao elearning dùng `--advisory` (không HARD)

Chạy thật trên elearning: **125/183 REQ-ID in-scope KHÔNG có test tham chiếu** (nợ
có sẵn từ trước khi có gate). Nếu wire HARD `&&` -> chuỗi chết ngay -> phá ràng buộc
"lint:gates phải chạy tới cuối". Nhồi 125 id vào allowlist = pass giả (vi phạm
"no cheats to pass build"). Nên chọn `--advisory`: gate **báo cáo** breach rồi exit
0, chuỗi chạy tiếp. Burn nợ xuống (thêm test đặt tên REQ-ID) rồi **bỏ `--advisory`**
trong package.json là thành HARD gate. Đây là escape-hatch trung thực, không che.

Flag `--advisory` thêm ở tầng CLI (runGate vẫn thuần code=1 để selftest assert
đúng); advisory chỉ hạ exit xuống 0 kèm banner cảnh báo.

## Kiểm chứng (verify-at-source)

- `node check-ac-coverage.mjs --selftest`: **12/12 pass** cả 2 copy (template +
  elearning). Case: PASS, FAIL, FAIL-RANGE (id giữa range untested), ALLOWLIST,
  SKIP-no-manifest, SKIP-no-tests, CONTINUATION (dòng gấp).
- Template real run: skip (chưa có manifest) - exit 0.
- Elearning real run: FAIL liệt kê 125 REQ-ID (đúng, tín hiệu thật).
- **Ràng buộc "không phá lint:gates":** chạy đuôi chuỗi
  `manifest-coverage && authz-test && money-concurrency && ac-coverage --advisory`
  -> **exit 0** (advisory không chặn). Chuỗi đầy đủ `pnpm run lint:gates` đỏ ở
  `check-prototype-fidelity` (bug CRM-customers `<table>` chép thô prototype - **có
  sẵn từ trước, KHÔNG do thay đổi này**; gate ac-coverage nằm cuối, advisory).

## Việc còn lại (cho bg-session elearning, KHÔNG phải harness)

1. Burn 125 REQ-ID backlog: thêm test đặt tên REQ-ID (describe/comment/title) hoặc
   allowlist REQ-ID verifier-only/pure-infra (VD `IN.OPS.01`). Xong -> bỏ `--advisory`.
2. Fix bug prototype-fidelity CRM-customers (raw `<table>` -> DataGrid) - lỗi chép
   thô prototype đã biết, nằm ngoài task này.

## Output

CHỈ tạo file + wire + selftest. **KHÔNG commit** (để CTL review + commit). File đổi:
- `templates/stack-pnpm-nest-next/scripts/check-ac-coverage.mjs` (mới)
- `templates/stack-pnpm-nest-next/scripts/gate-config.json` (+acCoverage)
- `templates/stack-pnpm-nest-next/package.json` (+gate HARD)
- `elearning-platform/scripts/check-ac-coverage.mjs` (copy)
- `elearning-platform/scripts/gate-config.json` (+acCoverage)
- `elearning-platform/package.json` (+gate --advisory)
- `docs/gates/phase-acceptance.md` (doc + bảng enforcement)
