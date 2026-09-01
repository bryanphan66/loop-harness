# Build Execution

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Build-phase discipline: what an agent (or solo dev) actually does between "phase
> is planned" and "code is up for review". Composes with the story's Implementation
> Guardrails — guardrails state the rules; this playbook says how to enforce them.
> Owns Build & Go-live **step 2.6**.

**Macro-stage / step:** Build & Go-live · 2.6 (after 2.5 seed, before 2.7 review).

> Branching / commit / hook recipes below are authoritative. Executed per
> manifest phase via `/build-phase` (`docs/process/WORKFLOW.md` § Macro-Stage 2).

## Engine

- **Fast path:** `cook` (implement features/phases) → `fullstack-developer` →
  `code-simplifier`; `fix` / `ck-debug` for defects. `git` for commits.
- **Role:** Fullstack Dev. Per D1 these are accelerators — a bare agent + git +
  bash executes the same recipes.

## When To Run

- Starting any phase implementation (2.6).
- Setting up a fresh project after stack-selection (2.2) lands.
- Onboarding a collaborator onto an in-flight project.

Skip when the task is a doc-only change with no code touched.

## Branching Strategy

Solo dev / small team default: **trunk-based** on `main`.

- Direct commits to `main` are fine for tiny-lane work.
- Normal + high-risk phases: short-lived feature branch per phase, merged to
  `main` via PR after the 2.7 review. Branch name `feat/<module>-NN-slug` or
  `fix/<module>-NN-slug`. Lifetime ≤2 days — if a phase spans longer, split it.
- Long-lived branches (`dev`, `staging`, `release/*`) only when CI/CD targets
  them.

Use Pull Requests as the review surface even when solo (creates the 2.7 audit
trail). Never force-push a shared branch.

## Commit Cadence

Commit on a clean, runnable state:

- Every 30-90 minutes of focused work.
- Always before stopping for the day / switching phases.
- Never on a broken-test state without an explicit `WIP:` prefix + same-day fix.

The 2.7 rubric penalizes massive commits that hide review-blockers. Smaller
commits score higher.

> **Stage-boundary commits (control plane):** each step that produces a repo
> artifact = one bundled commit at the step boundary that ALSO updates `STAGE.md`
> + `docs/ROADMAP.md`. Never split that into a follow-up commit (see
> `docs/process/WORKFLOW.md` § Always-On Layer).

## Commit Message Format

Conventional commits. The body MUST cite ≥1 token per `docs/process/TRACE_SPEC.md` — a
REQ-ID (`MODULE.AREA.NN`), an SC-NNN, or a TC-NNN.

```text
<type>(<scope>): <subject under 70 chars>

<paragraph explaining WHY, not WHAT — the diff shows WHAT>

Cites: IF.RBAC.02, SC-007
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`,
`build`, `ci`. No AI references in commit messages. Do not reference plan
artifacts (phase numbers, finding codes) in commit messages — describe the change.

### Token-Citation Hook (recommended)

`.git/hooks/commit-msg` (chmod +x) — note the **D3 grammar** (no
`US-NNN.REQ-MMM`):

```bash
#!/usr/bin/env bash
msg_file="$1"
first_line="$(head -1 "$msg_file")"
case "$first_line" in
  "Merge "* | "Revert "* | "fixup! "* | "squash! "* | "WIP:"*) exit 0 ;;
esac
# Require a REQ-ID (MODULE.AREA.NN), SC-NNN, TC-NNN, or CR-NN in the body.
if ! grep -qE '([A-Z]{2,}\.[A-Z]{2,}\.[0-9]{2}|SC-[0-9]{3}|TC-[0-9]{3}|CR-[0-9]{2})' "$msg_file"; then
  echo "commit-msg: missing trace token (MODULE.AREA.NN / SC-NNN / TC-NNN / CR-NN). Cite at least one." >&2
  exit 1
fi
```

Tiny-lane work is exempt — use the `WIP:` prefix or a `chore:` subject.

## Pre-Commit Hook Recipe

Catch lint / format / typecheck before the commit lands. Varies by stack.

### Node / TypeScript

`pnpm add -D husky lint-staged && pnpm dlx husky init`. `.husky/pre-commit`:
`pnpm exec lint-staged`. `package.json`:

```json
{ "lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yml,yaml}": ["prettier --write"] } }
```

### Python

`.pre-commit-config.yaml` with `ruff` (+ `--fix`), `ruff-format`, `mypy`; then
`pre-commit install`.

### Go

```bash
# .git/hooks/pre-commit
#!/usr/bin/env bash
set -e
gofmt -l -s . | grep . && { echo "gofmt failed"; exit 1; } || true
go vet ./...
golangci-lint run
```

## Secrets & `.env` Policy

- `.env` is **never** committed. `.env.example` IS committed — every required var
  with empty value + one-line purpose.
- `.gitignore` MUST contain `.env`, `.env.*`, but NOT `.env.example`.
- Production values live in the secret vault chosen at stack-selection (2.2).

### Secret-Scan Hook (recommended)

```bash
# Block accidental .env commit (not .env.example)
if git diff --cached --name-only | grep -E '^\.env(\..*)?$' | grep -v '^\.env\.example$' >/dev/null; then
  echo "pre-commit: refusing to commit .env — use .env.example for shape only" >&2; exit 1
fi
# Crude secret-pattern scan
if git diff --cached -U0 | grep -E '(AWS_SECRET_ACCESS_KEY|API_KEY|PRIVATE_KEY|BEGIN [A-Z]+ PRIVATE KEY)=' >/dev/null; then
  echo "pre-commit: possible secret in staged diff — verify before committing" >&2; exit 1
fi
```

## Validate Bootstrap

Before 2.6 starts, the project MUST have at least `validate:quick` runnable. The
2.2 stack decision picks the framework; this playbook produces the script.

Minimum `validate:quick`: `format → lint → typecheck → unit tests → **boot smoke**
→ architecture check (if any)`.

**Boot smoke (non-negotiable for a DI-framework backend).** Compile + unit tests do
NOT boot the app — unit tests inject positionally and mock modules, so a runtime
DI/wiring or fail-closed-config error passes the gate green and only surfaces as a
prod **crash-loop** (health 404). Add a step that instantiates the **real
AppModule** — Nest `Test.createTestingModule({ imports: [AppModule] }).compile()`,
or a `--dry-run` bootstrap against a throwaway DB — so a boot error fails the GATE,
not the deploy. Code corollary: any constructor param that is an *optional
collaborator with a runtime default* (a test-injected stub, a config-built
instance, a plain function default) MUST carry `@Optional()` — the framework
ignores the TS `?`/default and tries to resolve it by type, throwing "can't resolve
dependencies" at boot. (Evidence: two elearning deploys took the whole API down with
a green gate — a fail-closed secret that threw at boot, and a service with an
un-`@Optional()` optional collaborator not in its module.)

| Stack | `validate:quick` shape |
|---|---|
| Node / TS | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit` |
| Python | `ruff format --check && ruff check && mypy . && pytest tests/unit -q` |
| Go | `gofmt -l . && go vet ./... && golangci-lint run && go test -short ./...` |

Wire `validate:quick` into pre-commit (or pre-push) once reliable. The
verify-gate (`scripts/harness-verify-gate.sh`) is the hard gate at stage close —
**never instruct bypassing a failing verify-gate or test to close a stage.**

> **Stale-dist trap (rebuild before trusting `validate`).** After a `git pull` /
> `rebase` that pulls new schema/types/deps from other merges, the workspace
> `packages/*` dist + `.prisma` client + linked `node_modules` lag the source, so
> `validate` throws FALSE errors (`Cannot find module 'exceljs'`, `property X does
> not exist on PrismaClient`, `no exported member Y`). These are NOT code bugs — run
> `pnpm install && pnpm --filter <db> run prisma:generate && pnpm -r --filter
> "./packages/**" run build` then re-run typecheck; only a real error survives.
> Same rule in `AGENTS.md § Background-session hygiene`.

`test:integration` / `test:e2e` / `test:release` ladder out as the project grows —
add each when the first phase needs it, not preemptively.

## Before Coding A Screen (design-system contract)

Before writing any UI for a screen, the Fullstack Dev MUST:

1. Find the screen's row in `docs/visuals/diagrams/screen-inventory.md` and
   confirm its assigned §4 floorplan + table/message/modal/create behaviors.
2. Open the screen's **prototype export source file** (cited in its
   build-manifest phase block) — the implementation reference per
   § Prototype → Code Fidelity below. No export + no recorded rebuild decision =
   blocker.
3. Reuse the components listed in `src/components/README.md` (the Tier-3
   inventory) before writing new ones — reuse-first, do not re-derive.
4. Consult the relevant section of `docs/design-system/design-rules.md` for the
   assigned floorplan's rules (§7 action placement, §8 modals, §10 states).

A grid/form screen with **no inventory row is a build blocker** — escalate to the
Designer to classify it (1.11 / `visual-and-behavioral-modeling.md`). **Do NOT
invent a floorplan** at build time; an unclassified grid/form screen is exactly
the drift the inventory exists to prevent. The verify-gate blocks on any
empty/placeholder Floorplan cell once `screen-inventory.md` exists, and the 2.7
review (`code-review-scoring.md`) treats an unclassified or rule-violating screen
as an automatic merge block.

## Prototype → Code Fidelity (consume the export as code — do NOT re-draw)

The frozen prototype is built in an external design tool (Claude Design / Open
Design) that **exports real code** — a bundle at
`docs/visuals/prototype/exports/<engine-vN>/`: `tokens.css` + `components.css`
(+ product-specific `components-<domain>.css`), a component kit `kit.jsx`, and
per-screen `screens-*.jsx`. **When a frozen client-approved export exists, the
build ADOPTS that code verbatim — it does NOT re-implement the look in fresh
Tailwind by "reading" the export.** Full method: `prototype-export-adoption.md`.

**The rule, in brief:** bring the export's `tokens.css` + `components.css` into the
app, port each `kit.jsx` component KEEPING its exact classNames, rebuild each screen
from its `screens-*.jsx` element tree, then wire ONLY real data/behaviour. The full
4-step method, the **~80% (re-draw) vs ~99% (adopt)** failure evidence, and the
export-freshness / stale-export check live in **`prototype-export-adoption.md`
(single source — not restated here).**

Adopting the export does NOT waive the design-system contract — it composes:
- The export's `tokens.css` **is** the Tier-2 token layer for this project (its
  CSS variables are the tokens). Screens use those variables via the ported
  components — no hardcoded values re-introduced, no scaffold/default theme.
- The screen's §4 floorplan row (screen-inventory) still applies — a frozen
  prototype screen already conforms to its floorplan (the 1.12 gate checked it),
  so adopting its structure preserves conformance by construction.
- The ported kit **is** the Tier-3 inventory — record it in
  `src/components/README.md` so later screens reuse, never re-invent (a
  re-invented kit component is a build-phase BLOCK).
- **Every screen records its export source file** in its build-manifest phase
  block and satisfies the **visual-fidelity gate**
  (`docs/gates/visual-fidelity.md`): its required-element + interaction
  assertions pass on the running app AND the human glance approves the
  side-by-side.

**Fallback — no frozen export exists** (net-new screen, or a screen the
prototype never covered): build it via the design-system (Tier-1 floorplan +
Tier-2 tokens + Tier-3 components). This is a recorded `rebuild (decision:
<slug>)` in the phase block, never a silent choice — the build-manifest marks
each screen `adopt from export` (default when an export exists) or
`rebuild (decision: <slug>)`.

Guardrails (all zones):
- **Real assets required** — placeholders do not adopt. Logo + hero imagery must
  be provided or generated (`ai-artist` / `ai-multimodal`) before the build, so
  the real asset is in the adopted markup once.
- The plan (2.3) states adopt-vs-rebuild per zone; the manifest carries it per
  screen.

### Bước bắt buộc 2.6.b — adopt prototype QUA component có sẵn (HARD)

Đây là bước KHÔNG được bỏ khi build một màn có prototype. Lỗ nặng nhất của
Macro-2 (giai đoạn Build) là **re-draw** (vẽ lại UI từ đầu) thay vì **adopt**
(bê nguyên) prototype - màn trông "same same" nhưng lệch ~20% và gate cũ chỉ
kiểm "có file spec" nên vẫn xanh. Pattern đúng (đã chứng minh: elearning #985
rebuild đạt ~90% khớp) đi đúng 5 nhịp, THEO THỨ TỰ:

1. **ĐỌC prototype của màn TRƯỚC khi gõ dòng UI đầu tiên.** Mở đúng file export
   Claude Design mà phase block trích dẫn (`screens-*.jsx`) - đọc layout, hàng
   KPI (Key Performance Indicator - chỉ số chính), tab, section, cột của grid.
   Đây là "nguồn sự thật" (source of truth), không phải trí nhớ.
2. **Adopt đúng layout/KPI/tab/section/cột** - dựng lại cây phần tử của màn theo
   `screens-*.jsx`, không tự nghĩ bố cục mới.
3. **IMPLEMENT bằng component CÓ SẴN.** `grep components/ui/` (thư mục primitive
   dùng chung) TRƯỚC khi viết bất kỳ component nào. Grid BẮT BUỘC dùng
   `DataGrid` - cấm re-draw `<table>` tay. Tái dùng `StatCard`, `PageHead`
   (dạng tab), `Timeline`... **Cấm tạo component trùng** (một `StatsCard` mới
   cạnh `StatCard` sẵn có = build-phase BLOCK, đúng luật Tier-3 inventory).
4. **Thiếu primitive thì THÊM ở `components/ui/` dạng SHARED** (dùng chung), rồi
   ghi vào `src/components/README.md` để màn sau tái dùng - KHÔNG viết bản copy
   nội bộ trong thư mục 1 màn.
5. **Adopt CSS** (`tokens.css` + `components.css` từ export) rồi mới wire dữ liệu
   thật; **fidelity spec ASSERT cấu trúc prototype hiện diện** (component +
   section), không chỉ smoke-test (chỉ kiểm màn mở được).

**Bảng ánh xạ ĐỒ-GIẢ prototype -> COMPONENT dự án (đọc TRƯỚC khi gõ UI).**
Prototype export được vẽ bằng "đồ giả" (mock primitive) của riêng công cụ design,
KHÔNG phải component thật của dự án. "Adopt" = **MAP từng đồ-giả sang component dự
án**, TUYỆT ĐỐI không chép nguyên markup export. Đây là gốc của gần như MỌI "lỗi
vặt UI lặp lại" (bảng không filter, thiếu tooltip, chart tự vẽ, modal tràn):

| Đồ-giả trong `screens-*.jsx` | Map sang component dự án | Chép thô = lỗi gì |
|---|---|---|
| `<table className="tbl">` | `DataGrid` (filter/search từng cột + scroll nội bộ). Preview ngắn -> biến thể DataGrid gọn, KHÔNG `<table>` | grid không filter/search, scroll cả trang |
| `<div className="muted fzNN">` helper cạnh title card | `InfoTooltip` (icon "i") | card thiếu tooltip, chữ dày |
| `<div>` cột/thanh tự vẽ làm biểu đồ | chart component dự án (recharts wrapper trong `components/ui`) | biểu đồ tự vẽ, dính đáy card |
| modal/dialog sơ khai của export | shared `Dialog` (căn giữa, max-width, no-overflow) | modal tràn/cắt mép, list dài không cuộn |
| `<Select>` / `<Badge>` / `<Btn>` mock | `SelectInput` / `Badge` / `Button` dự án (grep `components/ui`) | double component, lệch style |

> Lưu ý: cột trái là **markup tự tay**, không phải bản thân tên class. Class
> `.tbl`/`.bars-chart`/`.card` là style dùng chung hợp lệ (chính `DataGrid` +
> chart thật dùng chúng) - vấn đề là **TỰ VẼ** bằng `<table>`/`<div>` thay vì gọi
> COMPONENT. Đừng đi cấm tên class; hãy ép component qua `requiredComponents`.

Quy tắc: nếu prototype có KPI card thì màn PHẢI có `InfoTooltip`; có biểu đồ thì
PHẢI dùng chart component; có grid thì PHẢI `DataGrid`; có modal thì PHẢI `Dialog`.
Liệt kê ĐỦ các component này vào `requiredComponents` của route trong
`fidelity-map.json` để gate ép bằng máy (xem dưới) - map thiếu = gate mù = lọt.

**Gate máy kiểm bước này:** `scripts/check-prototype-fidelity.mjs` (chạy trong
`lint:gates`). Nó đọc `scripts/fidelity-map.json` - mỗi route admin map tới
`{prototypeFile, requiredComponents, requiredSections}` - rồi ASSERT trên
`page.tsx` + mọi `.tsx` co-located cùng route (kể cả file tab/aside) đã build:
các `requiredComponents` được import TỪ thư mục shared + dùng trong JSX, các
`requiredSections` hiện diện, và không có `<table>` thô trên màn grid. Thiếu ->
FAIL, chỉ rõ route + component/section còn thiếu. Gate STRICT cho route CÓ trong
map, fail-soft cho route CHƯA map (baseline). Map được soạn khi prototype đóng
băng (PB-G3), trước khi build màn.

**Kiểm soát ĐÚNG = `requiredComponents`, KHÔNG phải cấm tên class.** Cạm bẫy đã
mắc (elearning 2026-08-31): dự án adopt NGUYÊN bộ stylesheet của export
(`styles/prototype/components.css`) nên tên class (`tbl`, `card`, `bars-chart`,
`dialog-*`, `filterbar`...) là **class DÙNG CHUNG hợp lệ** - chính `DataGrid`
render bằng `className="tbl"`, chart thật xài `bars-chart`. Vì vậy KHÔNG phân biệt
được chép-thô vs adopt-đúng qua tên class; cấm 1 class = bắn nhầm hàng loạt màn
đúng. Cách ép thật sự: liệt kê ĐỦ component vào `requiredComponents` (gate bắt
`<DataGrid`/`<InfoTooltip`/chart-component phải được import-từ-shared + dùng trong
JSX) - đây mới là "adopt qua component". `forbidPatterns` (top-level + per-route,
FAIL kể cả khi `forbidRawTable:false`) chỉ để chặn 1 signature **mock-ONLY** mà dự
án KHÔNG adopt, đừng seed bằng class dùng-chung. Và đừng blanket-tắt `forbidRawTable`
để né gate ở màn list (lỗ #985); object-page tắt được vì có bảng preview nhỏ hợp lệ.

> Giới hạn thành thật: gate chỉ kiểm **component-presence** (các khối cấu trúc
> mà export ngụ ý CÓ hiện diện). Phần **pixel-match** (khớp khoảng cách, theme,
> "trông có giống export không") máy KHÔNG phán được - vẫn cần verifier + người
> ở checkpoint verify-fidelity dưới đây.

### Checkpoint verify-fidelity (verify-at-source cho FIDELITY)

Sau khi build xong 1 màn CÓ prototype, verifier/ctl PHẢI đối chiếu bản build với
prototype TRƯỚC khi coi màn "đạt" - đây là verify-at-source (xác minh tại nguồn)
áp cho fidelity, y hệt nguyên tắc không-tin-CI-xanh của deploy:

1. Chạy `node scripts/check-prototype-fidelity.mjs` xanh (component-presence).
2. MỞ file prototype (`screens-*.jsx`) mà phase block trích dẫn và so cấu trúc:
   đủ hàng KPI? đủ tab? đủ cột grid? đúng section? Không được tin lời builder
   "đã khớp export" suông (FC7 - self-attest bị cấm).
3. Chụp screenshot màn đã build (desktop + 375px) để glance side-by-side với ảnh
   prototype - người chốt phần thẩm mỹ/pixel mà máy không phán được.

Thiếu 1 trong 3 = màn CHƯA đạt fidelity, không được đóng phase (fail-closed).

### PUB product-shot capture is a LATE phase

Marketing screens (landing hero, feature sections) often embed **screenshots of
the product itself**. Capture those from the RUNNING APP only **after** the APP
screens they depict are built + styled + fidelity-checked — never from an early
flat/scaffold UI. (Failure evidence: a run captured landing hero/feature shots
off the early unported UI; after the APP screens were ported to the design the
landing images were stale and had to be re-captured — auto-script Macro-2.)

- The build-manifest sequences the PUB product-shot capture phase (or 2.10
  sub-step) with an explicit **depends-on: every APP screen phase it depicts**.
- Commit the capture script/recipe so shots are re-generatable after later UI
  changes.

## Incremental Preview (a running app after EVERY phase)

Verification cannot wait for the end of the manifest — both legs of the
per-phase acceptance gate (`docs/gates/phase-acceptance.md`) inspect the
**running app**, phase by phase:

- **Local (default):** the compose/dev-server stack that booted at P0 (walking
  skeleton) stays bootable at every phase close. The build-manifest header
  records the ONE-line **Preview command** + URL (e.g. `docker compose up` →
  `http://localhost:3000`); the implementing agent leaves it runnable when it
  returns, and a phase that leaves the app un-bootable FAILs acceptance
  regardless of its diff.
- **Staging (optional):** when a shared/staging target exists (chosen at
  2.2/2.4), deploy each phase commit there and hand that URL to the verifier +
  operator — same mechanic, remote surface. Go-live readiness (2.11) then
  confirms the production variant; it is not the first time the app runs.

This is the delivery surface for the **human checkpoint**: the operator reviews
each module on the real app as it lands (cadence knob in the manifest header),
instead of meeting the whole product for the first time at UAT.

## Per-Phase Acceptance Verification (after commit, before the next phase)

The phase pipeline does not end at the stage-boundary commit. Per
`docs/gates/phase-acceptance.md`: an **independent agent verifier** (spawned by
the `/build-phase` orchestrator — never the implementer) re-runs the phase's
acceptance checks against the running preview (functional + visual-fidelity per
shipped screen + negative-path); FAIL → fix inside the same phase and
re-verify (cap 3 rounds); PASS → `Accepted` cell + TC-NNN row; then the human
checkpoint when the phase's `Verify-by` is `both`. The implementer's
self-checks above exist to make the verifier pass first try — they never
substitute for it. (Failure evidence: verifying only at 2.7/2.8/2.10 let
per-phase defects accumulate to the end and forced multiple UAT-fix rounds —
auto-script Macro-2; per-phase catch is the cheap point on the token curve.)

## Implementation Guardrails (reference)

The story's Implementation Guardrails section is the authority; restated for the
agent reading this at the start of 2.6:

- Stay inside scope. Out-of-scope cleanup → new story or backlog row.
- Architecture change → new `docs/decisions/<slug>.md` before merging.
- Don't delete referenced code without grep proof.
- UI: handle loading + empty + error states, not just happy path.
- **Errors surface their real cause** — a user-facing operation that fails must
  show the actual reason (tier/quota limit, provider error, validation detail),
  never a generic "something went wrong" that swallows it. Generic-swallow is a
  2.7 review floor block (`code-review-scoring.md`).
- Input validation at the boundary.
- **A fetch-all grid respects the endpoint's max pageSize.** A list screen that
  pulls every row to sort/filter/paginate client-side must set its fetch size ≤ the
  API's `pageSize.max(...)` — a page that requested 200 against a `max(100)` DTO got
  HTTP 422 and rendered its error state, while a plain `curl` at the default page
  size 200'd (so a naive verify missed it). Cap the fetch to the endpoint max, or
  switch to true server-side pagination.
- **Systemic fix = full sweep.** When a change fixes an instance of a systemic
  pattern (error handling, model/tier resolution, auth, quota, permission
  checks), grep ALL call-sites of that pattern and cover every sibling in the
  same change — prefer moving the logic into a **single chokepoint** (one
  resolver/guard/helper) over per-feature patches (DRY). A fix that leaves
  sibling sites broken is an automatic 2.7 review finding. (Failure evidence:
  a run patched tier-model resolution only in the one generator the bug was
  reported against; every other AI-gen entrypoint kept the same broken default
  and failed in UAT — auto-script Macro-2, systemic tier-model fix leg.)
- Commit body explains the change + cites ≥1 token.

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `docs/process/WORKFLOW.md` § 2.6 — the step this playbook owns; § Always-On — stage
  commits.
- `docs/process/TRACE_SPEC.md` — the token grammar the commit-msg hook enforces (D3).
- `code-review-scoring.md` — step 2.7 follows this playbook.
- `visual-and-behavioral-modeling.md` — produces `screen-inventory.md` (1.11), the
  floorplan row a screen build confirms first.
- `ui-design-system-contract.md` — produces `src/components/README.md` (Tier-3
  inventory) the build reuses from.
- `docs/design-system/design-rules.md` — Tier-1 §4/§7/§8/§10 rules a screen build
  consults; never invent a floorplan.
- `prototype-export-adoption.md` — the step-by-step method § Prototype → Code
  Fidelity points to (adopt the export's CSS + kit + screens verbatim).
- `docs/gates/visual-fidelity.md` — the toothy per-screen gate every UI phase
  must pass: machine-checkable Playwright assertions (element completeness +
  interaction behaviour) + a human side-by-side glance before the phase closes
  (2.6 leg, 2.7 floor rule, 2.10 DoD).
- `docs/about/HARNESS.md` § Control-Plane Failure Classes — **FC6** (verify at the real
  source, never a wrapper exit) + **FC7** (human review must be real — surface
  the side-by-side, no rubber-stamp) bind this playbook's commit/push +
  fidelity-gate legs.
- `docs/gates/phase-acceptance.md` — the per-phase acceptance-verification gate
  (independent verifier + cadence-driven human checkpoint) this playbook's
  Incremental Preview serves.
- `design-system-3-tier.md` — the cross-stage 3-tier enforcement chain.
- `seed-data-pattern.md` — step 2.5 precedes; provides demo data.
- `payment-integration.md` — applies when money is in scope at 2.6.
- `docs/process/ROLE_MAP.md` — Fullstack Dev role + `cook` engine binding.


## Phase Pre-flight — anchor every cited symbol / path / import / id-type to HEAD (2.6 phase-start)

**A static resolution gate run at 2.6 phase-start (no running app needed); a miss FAILs the phase — fix the block, never improvise the missing piece.**

A manifest/plan phase block names concrete anchors — guards, service methods, components, hooks, packages, file paths, entity/param types. The spec froze before most of them existed, so a block routinely cites an anchor that does NOT resolve at HEAD, and the build agent then IMPROVISES instead of stopping: it fabricates an always-true `MembershipOwnerGuard` (phantom-symbol), imports `@tanstack/react-query` the repo never installed (it uses `swr`), edits `apps/web/src/app/(m)/nhan-vien` when the real path is `/m/nhan-vien` so cook touches NOTHING (stale-path no-op), or types `membershipId: string` while the route is `@Param('id', ParseIntPipe): number` so the ownership check is non-deterministic (id-type-mismatch).

Before the first line of the phase, resolve EVERY anchor the block names against the current tree; any miss is a FAIL, not an "add it" invitation:

- (a) **symbol resolves + signature matches** — each cited class/guard/`service.method`/component/hook exists at HEAD (`grep`/ts-morph/`tsc --noEmit` on a written import) AND its real arity/columns match the citation — `PermissionService.resolve(userId, companyId, module)` whose real signature has no `module` arg, or a referenced column (`user.locale`, `Membership.joinedYear`) absent from the Prisma/ERD schema, is a miss; a symbol that must be NEWLY created is allowed ONLY when the block explicitly lists it under "new symbols this phase creates".
- (b) **import/package resolves** — every external package the block cites is in `package.json` + lockfile; a lib named in the plan but not installed means the plan picked the wrong one — reconcile to the repo's ACTUAL lib, never `npm i` a guessed dep to satisfy a phantom citation.
- (c) **path resolves** — every file/dir path the block cites exists at HEAD with real casing/route-group/pluralization (`/m/nhan-vien` not `(m)/nhan-vien`, `permissions/` not `permission.service.ts`) so an edit lands on a real file and cook is never a silent no-op.
- (d) **id/param type matches the canonical type at every layer** — the type a block gives an id/param equals the route's `@Param(...ParseIntPipe)`/Zod coercion, the Prisma model PK, and the DTO; a `string` id against a numeric `ParseIntPipe` PK (or vice-versa) makes ownership/lookup non-deterministic and is a miss.

Mechanism: a `resolve-plan-anchors` lint the orchestrator runs at phase start (greps/type-checks each anchor the block names) is RED on any unresolved anchor; the 2.7 review (`code-review-scoring.md`) treats any always-true/stubbed guard, any `npm i`-of-a-guessed-dep, any no-op edit on a nonexistent path, or any id-type coercion papering over a mismatch as an automatic floor block.

**DoR-build gains the matching entry line:** every manifest phase block's cited symbols/paths/imports/id-types resolve against HEAD (P1 anchors) / the frozen ERD + stack ADR (later-phase anchors) before build starts — a block citing an anchor nothing defines is under-specified, fix it at 2.3.

## Addendum (2026-07-22) — public-page rendering strategy + perf diagnosis

- **Public hot pages (home, catalog, blog) = ISR, not `force-dynamic`.**
  `export const dynamic = 'force-dynamic'` (+ `cache: no-store`) re-renders on every
  request and cold-starts multiple seconds on the first hit per route after each
  deploy/idle eviction — every first visitor eats it. Prefer `export const
  revalidate = <n>` (ISR: cached + periodically fresh) plus **on-demand
  `revalidatePath()`** fired from the admin publish/unpublish action, so content is
  immediately fresh without paying the dynamic-render tax.
- **Diagnose "slow" by isolating layers before guessing.** Measure the API endpoint
  TTFB vs the SSR page TTFB separately, and hit the same page twice (cold vs warm). A
  fast API (0.2s) behind a slow page (4s) that drops to 0.2s on the second hit is a
  render/cold-start issue, NOT the data layer and NOT the auth/refresh calls visible
  in the network tab. Prove the cause; do not pattern-match to a plausible suspect.
