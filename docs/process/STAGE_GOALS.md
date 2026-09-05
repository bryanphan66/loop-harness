# Stage Goals

Per-step `/goal` condition text the human or the `stage-runner` subagent uses to
drive one workflow step to a verifiable finish. Use with the interactive
`/goal <condition>` command or headless `claude -p "/goal …"`.

**Authority:** `docs/process/WORKFLOW.md` step tables. **Token grammar:**
`docs/about/TRACE_SPEC.md` (`GAP-NNN → REQ-ID = MODULE.AREA.NN → SC-NNN → TC-NNN`,
`CR-NN` — never `US-NNN.REQ-MMM`). **Lanes:** `docs/process/WORKFLOW.md` § Lanes — in
the **Lite** lane the route is `1.1 → 1.2 → 1.5-lite → 1.9-lite → 1.10-lite →
1.11 → 1.12 → 1.13 → 2.1` (1.14/1.15 auto-N/A-by-decision); Macro 2 and 3 are
identical in both lanes.

**Substitute placeholders before pasting:**

- `{date}` → today, `YYYY-MM-DD`
- `{slug}` → project / change-request slug, kebab-case
- `{client}` → client name from the intake brief
- `{module}` → SRS module abbreviation (e.g. `IF`, `AUTH`, `PAY`)
- `{N}` → a turn cap appropriate to the step

**MANUAL_CHECKPOINT rule (every goal):** if the work needs offline human action
(signing, design tool, credentials, UAT), emit a `MANUAL_CHECKPOINT:` block per
`AGENTS.md` § Manual Checkpoint Signaling and stop the turn **without** satisfying
the goal. The next session resumes via `--resume` after the human returns. The
five client-paging gates are **PB-G2, PB-G3, PB-G4, ACCEPTANCE, HANDOVER**;
**PB-G1 is internal — it does NOT page the client.** In the Lite lane the paging
gates page the **owner**; a one-line written ack clears them.

**Turn cap:** every goal ends with `Stop after {N} turns` so a mis-stated
condition cannot loop forever.

**Each entry below lists:** Goal · Inputs · Output path · Gate · Manual?

---

> **File này chỉ còn Macro 2.** Macro 1 và Macro 3 đã cắt khỏi loop-harness ngày
> 2026-09-05 cùng lúc với `WORKFLOW.md` - loop-harness sở hữu đúng một thứ là Macro 2,
> còn Macro 1/3 thuộc bộ harness mà từng dự án mang theo. Giữ goal text của Macro 1/3
> ở đây trong khi `WORKFLOW.md` và `macro-2.md` đã cắt là để lại đúng cái bẫy MD-10 và
> MD-11: hai file cùng mô tả một quy trình rồi lệch nhau.
> Chi tiết: `macro-2-deltas.md`.

## Macro-Stage 2 — BUILD & GO-LIVE

> **Canonical process shape = `docs/process/macro-2.md`** (step → driver →
> gate → playbook → output → exit). That file is the SoT for the SHAPE; this
> file is the goal-prose each step runs against. As of 2026-09-01 three steps are
> **folded** to cut duplication (the goal text stays below, tagged): **2.5 → 2.4**
> (seed is part of the P0 milestone), **2.7 → 2.10** (6-dim review shares DoD's
> floor rules), **2.11 → 2.13** (go-live readiness is part of the release
> contract). Security is one VERIFY pass at 2.9 over the 2.2 threat-model + 2.6
> floor, not a 3rd from-scratch STRIDE.

> Same goals in both lanes. In the Lite lane, `docs/ROADMAP.md` is born at 2.3
> (with the plan) instead of 1.15.

### Step 2.0 — Kiểm sẵn sàng trước khi xây

- **Inputs:** tier-2 design tokens của dự án · thư viện UI đã chọn (`registry.json` của nó) · Component Coverage Matrix trong `design-guidelines.md` · `WORKFLOW.md` + `macro-2.md` của dự án.
- **Output path:** `docs/design/component-mapping-<thư-viện>.md` + `scripts/gate-config.json` khối `uiRegions` (nếu app đã scaffold).
- **Gate:** `tier2-ui-compat` ⚙️ + `dangling-refs` ⚙️ + component-mapping *(người)* **@một-lần**.
- **Manual?** no.

**Bước này tồn tại vì ba lỗi đã xảy ra thật, không phải phòng xa.** Trên autocontent
2026-09-05: tier-2 sinh ở 1.10 theo Tailwind v3 trong khi thư viện UI đòi v4 (MD-01);
`WORKFLOW.md` gọi 22 engine mà chỉ 9 tồn tại (MD-05); ma trận 79 component chưa ai đối
chiếu với 60 component thư viện có (MD-08). Cả ba đều **rẻ ở đây, đắt sau 2.4** - lúc
đó mỗi màn đã bám vào một lựa chọn rồi.

Goal:
Chạy `check-tier2-ui-compat.mjs <thư-mục-thư-viện> <file-css-tier2>` và để nó **xanh**:
phiên bản build tool khớp major, mọi token thư viện đọc đều có trong tier 2, không còn
cú pháp đời cũ. Đỏ thì **port tier-2 ngay tại bước này**, giữ nguyên giá trị màu - đổi
cách viết, không đổi màu; giá trị màu là quyết định của Macro 1, không mở lại ở đây.

Chạy `check-dangling-refs.mjs . --file docs/WORKFLOW.md --engines ~/.claude`. Mọi
tham chiếu treo còn lại phải **khai vào `docs/gates/dangling-refs-allow.md`**, mỗi dòng
một tham chiếu kèm lý do và nguồn - không giải thích bằng văn trong ghi chép của bước.
Gate xanh khi khai hết; còn một dòng chưa khai thì đỏ. Ba nhóm lý do thường gặp: engine
của Macro 1/3 (ngoài phạm vi), output của bước sau chưa sinh, và thứ đã có quyết định
N/A ghi trước đó (trích số hiệu quyết định làm nguồn). Ngoài ba nhóm đó thì **sửa**,
đừng khai. Bước này đóng khi gate **xanh**, không phải khi đã viết xong giải trình.

Lập `docs/design/component-mapping-<thư-viện>.md`. **Dòng đầu file phải ghi nguồn đã
đọc**: tên repo thư viện, commit, ngày. Không có dấu đó thì bảng này sẽ sai mà không ai
biết - đã xảy ra thật: một bảng commit buổi sáng đọc registry trước khi hai PR merge,
nên **sai ngay lúc commit**. Trước khi tin số cũ trong bảng, **đọc lại registry**, không
chỉ đọc lại trước khi ghi số mới.

**Mỗi dòng** của Component Coverage
Matrix phân đúng một loại - `trực tiếp` (có một component thư viện làm được),
`ghép` (dựng từ 2+ primitive), `thiếu` (thư viện chưa có), `N/A` (vùng public custom
100%). Phân loại bằng **đọc mô tả và mở code**, không khớp tên - khớp tên cho kết quả
sai (`Toast` thực ra là `sonner`, `Wizard` là `stepper`). Mỗi dòng `thiếu` phải có
**một PR mở lên repo thư viện gốc** trước khi bước này xong; cấm vá trong dự án, vì
lần sync thư viện sau sẽ ghi đè mất.

Nếu app đã scaffold: khai `uiRegions` trong `scripts/gate-config.json` - đường dẫn nào
là public (custom 100%), nào là portal (dùng component thư viện), `libraryDir`, và
`registryFile` trỏ bản chụp danh mục registry (`apps/web/reno-registry.lock.json`, do
`pnpm ui:sync` sinh ra ở 2.4). Chưa scaffold thì để nguyên - bước 2.4 khai.

**Mở hai sổ theo dõi.** Cả lượt chạy này là một test case để chấm chính Macro 2, mà
một lượt chạy không đo được thì không chứng minh được gì:

- `docs/macro2-run-log.md` - chạy `node scripts/measure-macro2.mjs --step 2.0`. Script
  ghi một dòng: REQ-ID · register% · test% · issue% · prototype% + trạng thái 3 gate
  phủ. Đây là **mốc gốc**. Đo lại ở 2.3, 2.6, 2.13 bằng đúng lệnh đó - độ chênh giữa
  các dòng mới là bằng chứng, một dòng lẻ không nói lên gì.
- `docs/macro2-friction-log.md` - chép từ `docs/mau-tai-lieu/macro2-friction-log.md`.
  Ghi **ngay lúc vướng**, không gom cuối bước: goal-text mơ hồ chỗ nào, gate bắt nhầm
  gì, phải làm tay việc gì. Nhớ lại sau khi chạy xong là mất gần hết.

**Đừng tin con số 0** cho tới khi biết nó là "chưa làm" hay "đọc sai chỗ" - MD-12:
lệch một ký tự tên file làm register đọc ra 0% trong khi thật là 60%. Ghi mốc gốc sai
kiểu đó thì 60 điểm phần trăm công của Macro 1 bị tính nhầm thành công của Macro 2.

STAGE.md Current = 2.1. Stop after 12 turns.

### Step 2.1 — Solution/data architecture — freeze ERD (SA)

- **Inputs:** SRS(-lite) data-model + use-cases + `docs/visuals/diagrams/` (ERD draft, status-flows, screen inventory).
- **Output path:** `docs/system-architecture.md` (ERD section) + `docs/decisions/<domain>-data-model-freeze.md`.
- **Gate:** **ERD FROZEN** — entities, normalization, audit + tenant fields reviewed.
- **Manual?** no.

Goal:
`docs/system-architecture.md` contains the frozen ERD (Mermaid `erDiagram` or
equivalent) covering every entity the SRS(-lite) and screen inventory imply:
entities with fields + types, relations with cardinality, normalization
reviewed, **audit fields** (created/updated timestamps + actor) and
**tenant/organization scoping** decided per entity (single-tenant is a valid
recorded decision), soft-delete policy, and status enums matching each
status-flow diagram. Every in-scope REQ-ID maps to ≥1 entity or carries an
explicit "no data footprint" note. The ADR
`docs/decisions/<domain>-data-model-freeze.md` records the freeze and the
non-obvious modeling choices. STAGE.md Current = 2.1b (brownfield) or 2.2.
Stop after 15 turns.

### Step 2.1b — Data migration & cutover *(CONDITIONAL — brownfield only)*

- **Inputs:** legacy schema/dump + frozen ERD.
- **Output path:** migration plan + dry-run report under `plans/`.
- **Gate:** **CONDITIONAL — N/A by decision** for greenfield; else ETL mapped + dry-run cutover done + rollback-of-data plan + RTO/RPO stated.
- **Manual?** no.

Goal:
Either the project is greenfield and `2.1b — N/A by decision (greenfield)` is
recorded in STAGE.md Snapshot + `docs/gates/dod-build.md` toggles, OR a migration
plan exists mapping every legacy table/field to the frozen ERD (ETL steps,
validation queries, cutover order), a dry-run report proves the ETL on a copy,
and a rollback-of-data plan + RTO/RPO are stated. STAGE.md Current = 2.2.
Stop after 15 turns.

> **Applicability (stays a real numbered step, NOT an appendix).** This step is
> **N/A-by-decision for a greenfield Lite/internal** build (record the one line
> and move on), and **APPLICABLE only for brownfield** — replacing a legacy
> system that carries real data (real use: nhatnghe.net Phase-1.5 + the Phase-2
> migration). Keeping it inline means a brownfield project cannot skip it by
> forgetting it exists.

### Step 2.2 — Technical design + stack decision (TDR) + threat-model (Tech Lead)

- **Inputs:** NFR + frozen ERD + screen inventory.
- **Output path:** `docs/decisions/<project>-stack-selection.md` + `docs/decisions/<project>-threat-model.md` + API contract (`docs/api-contract.md` or OpenAPI file).
- **Gate:** stack justified vs NFR; API contract complete; authz model stated; STRIDE threat-model done (red-team required).
- **Manual?** no.

Goal:
`docs/decisions/<project>-stack-selection.md` records the stack **vs the NFRs**.
**Default = the harness walking-skeleton stack template** (pnpm workspaces
monorepo; NestJS + Prisma + PostgreSQL API; Next.js App Router + Tailwind web;
shared-types package — `scaffolds/stack-pnpm-nest-next/` in the harness source);
choosing it needs one paragraph, deviating needs explicit NFR-based reasons. The
API contract lists every endpoint per module (path, method, auth, roles,
request/response shape) covering every in-scope REQ-ID that has an API surface.
The authz model (roles, guard strategy, resource ownership rules) is stated.
`docs/decisions/<project>-threat-model.md` holds a STRIDE table over the main
assets/flows with a red-team pass (attacker personas: external, authenticated
abuser, insider) and each threat mapped to a mitigation or an accepted-risk
note. **When any in-scope REQ-ID is async / media / storage / integration** (grep
the NFR + SRS for transcode/HLS/upload/queue/webhook/signed-url/storage/PDF-render/
email-blast), the stack decision **surfaces the opt-in tier-2 primitives** — Redis
queue (`apps/api/src/common/queue/`), object-storage adapter
(`apps/api/src/common/storage/`), worker app (`apps/worker/`) — and names the
matching playbook per capability; a CRUD-only project leaves tier-2 off (YAGNI).
STAGE.md Current = 2.3. Stop after 15 turns.

### Step 2.3 — Implementation plan + BUILD MANIFEST + DoR

- **Inputs:** TDR + scope baseline (or srs-lite) + frozen ERD + screen inventory + API contract.
- **Output path:** `plans/<YYMMDD-HHMM>-<slug>/` (plan.md) + **`docs/build-manifest.md`**.
- **Gate:** **DoR** (`docs/gates/dor-build.md`, SoT) — incl. build-manifest complete (manifest-completeness rule).
- **Manual?** no.

Goal:
`docs/build-manifest.md` exists per `docs/mau-tai-lieu/build-manifest.md`,
compiled per `docs/playbooks/build-manifest-compilation.md`: ordered phases
**P0..PN** where **P0 = walking skeleton** (stack-template scaffold + boot +
seed-admin login) and each later phase block lists: id, name, REQ-IDs covered,
entities touched, API endpoints, screens (+floorplan class from
screen-inventory, + each screen's **prototype export source file** and its
fidelity strategy `port from export` | `rebuild (decision: <slug>)` — port is
the default per `playbooks/build-execution.md` § Prototype → Code Fidelity),
**concrete runnable acceptance checks**, verify commands, and
size (S/M/L), plus a **`Phase-type`** (`crud` default | `async-job` |
`media-pipeline` | `external-integration` | `storage`) — every REQ-ID citing an
async/media/storage/integration signal routes to its non-CRUD phase-type carrying
that type's acceptance categories (`build-manifest-compilation.md` step 4b; folding
it into a CRUD phase is a 2.3 defect). **Every in-scope REQ-ID appears in exactly
one phase** (manifest-completeness rule — SoT `docs/gates/dor-build.md`; the
manifest ends with the coverage checklist proving it); any phase
estimated
beyond one agent session (~10 files touched) is split; any PUB product-shot
capture phase depends on the APP screen phases it depicts. A thin
`plans/<YYMMDD-HHMM>-<slug>/plan.md` records ordering rationale + risks (the
manifest is the executable source, the plan is the why). The DoR checklist
(`docs/gates/dor-build.md`) is filled and green. In the Lite lane
`docs/ROADMAP.md` is born here from the template. STAGE.md Current = 2.4.
Stop after 15 turns.

### Step 2.4 — Walking skeleton (manifest P0) + env + CI/CD + observability

- **Inputs:** stack decision + manifest P0 + the stack template — **primary:** the embedded copy at `.harness/stack-template/` (placed by `install-harness.sh` at install time; see `STAGE.md` Snapshot § Harness source); **fallback only** (embed missing/stale): the harness source itself — local clone or repo tarball (`scaffolds/stack-pnpm-nest-next/`; see the template README).
- **Output path:** scaffolded monorepo at repo root + `.github/workflows/ci.yml` + `docker-compose.yml` + `.env.example`.
- **Gate:** **WALKING SKELETON** — install/build green, compose boots, health OK, CI(-equivalent local) green, secret scan clean (gitleaks, or the template's `scripts/secret-scan.sh` grep fallback).
- **Manual?** no.

Goal:
The project root contains the scaffolded monorepo produced by
`.harness/stack-template/scripts/scaffold.sh <target> <slug>` (project slug
substituted) — the embedded, proven copy is the PRIMARY scaffold path so the
walking skeleton reuses the shipped, red-teamed tier-2 primitives
(`packages/queue-core`, `packages/storage-core`) instead of re-deriving them.
Only when `.harness/stack-template/` is missing does scaffold fall back to
cloning/fetching the harness source directly (re-run `install-harness.sh` to
repair the embed first). A hand-built equivalent scaffold is a LAST RESORT —
only when the ADR (2.2) explicitly chose a different stack — and it MUST be
recorded as a decision (`docs/decisions/<slug>.md`); silently hand-rolling an
equivalent because the template "wasn't reachable" is the exact defect this
step exists to prevent. Then: (1) `pnpm install` (or stack
equivalent) completes clean; (2) lint + typecheck + unit + build all green
locally (the CI-equivalent run); (3) `docker compose up` boots db + api + web;
(4) the health endpoint returns 200; (5) the CI workflow file runs those same
jobs; (6) `.env.example` lists every required var and no secret is committed
(secret scan clean — gitleaks or `scripts/secret-scan.sh`). **Offline caveat:**
if the base-image pull is network-blocked, follow the shared **Offline boot
caveat** (§ cuối file) — substitute cached-db / prod-command boot evidence + record
the caveat; do not block the gate on the network.
Observability is decided: structured logging on by
default; alerting/SLO configured or recorded `N/A by decision` in the
dod-build toggles.

**UI: kéo từ thư viện, không tự code.** Ngay sau `pnpm install`, chạy
`pnpm ui:sync`. Lệnh này đọc `apps/web/reno-ui.manifest.json`, cài theme tier-2 cùng
mọi component khai trong đó từ registry, rồi ghi `apps/web/reno-registry.lock.json`
(bản chụp danh mục để gate đối chiếu offline). Chưa chạy thì `pnpm build` đỏ vì
`components/ui/` trống - đó là cố ý, thà đỏ còn hơn để ai đó tự viết vào đấy.

Ba ràng buộc, gate `check-ui-region-boundary.mjs` + `ui:check` giữ:

1. **`apps/web/src/components/ui/` chỉ chứa đồ của registry.** File tự viết ở đó sẽ bị
   lần sync sau ghi đè mất. Thứ dự án tự dựng (ghép nhiều primitive, form field...)
   để `components/forms/`, `components/<miền>/` - ngoài thư mục thư viện.
2. **Vùng portal không tự vẽ primitive** (`<button>`, `<input>`, `<select>`,
   `<textarea>`, `<dialog>`). Vùng public thì ngược lại - custom 100% bê từ prototype,
   ở đó màu cứng chỉ bị cảnh báo.
3. **Thiếu component thì nâng ở repo thư viện gốc rồi kéo xuống** (`pnpm ui:sync --add
   <tên>`), không vá trong dự án. Thư viện là nguồn dùng chung cho nhiều dự án - vá
   trong dự án là lần nâng phiên bản sau mất trắng.

Đối chiếu `docs/design/component-mapping-<thư-viện>.md` (lập ở 2.0): mọi dòng
`trực tiếp` phải có tên trong manifest; dòng `ghép` không được nằm trong `components/ui/`.

Đo lại: `node scripts/measure-macro2.mjs --step 2.4`.

STAGE.md Current = 2.6. Stop after 25 turns.

### Step 2.5 — Seed + foundation data  *(FOLDED into 2.4 — same P0 milestone; see macro-2.md)*

- **Inputs:** frozen ERD + RBAC (permissions doc / RPM).
- **Output path:** seed script(s) under the API app (extends the template's admin seed).
- **Gate:** app boots with RBAC + seeded admin login works; FK-valid; P0 marked done in the manifest.
- **Manual?** no.

Goal:
The seed script extends the stack template's admin seed with the domain
foundation data the frozen ERD requires: roles/permissions, status/reference
tables, and at least one FK-valid sample row per core entity. The seed is
re-runnable (idempotent upserts or reset-then-seed). Against the running app:
migrations apply clean, the seed completes, and **logging in with the seeded
admin succeeds** (verified via the e2e smoke or an HTTP check). The manifest's
P0 checkbox is flipped done in the same stage-boundary commit. STAGE.md
Current = 2.6. Stop after 12 turns.

### Step 2.6 — Code feature by phase (`/build-phase` loop)

- **Inputs:** `docs/build-manifest.md` (next incomplete phase block) + frozen ERD + the SRS module file(s) the phase names + the screen-inventory rows for its screens + design tokens.
- **Output path:** code + tests + verification-register rows (`docs/about/TEST_MATRIX.md`) + manifest progress (incl. the `Accepted` cell).
- **Gate:** per phase — compiles/runs, `validate:quick` green, phase e2e smoke passes, design-system floor self-check clean, commit cites ≥1 token, manifest checkbox flipped, **+ PHASE ACCEPTANCE** (`docs/gates/phase-acceptance.md`): independent agent verifier PASS on the phase's Acceptance checks against the running preview; human checkpoint per the manifest cadence when `Verify-by: both`.
- **Manual?** **cadence-driven** — phases with `Verify-by: both` emit a MANUAL_CHECKPOINT (internal, pages the operator — not the client).

**Execution model:** this step is a **loop driven by `/build-phase`** — one
invocation implements exactly ONE manifest phase in an isolated context. Do not
run "all of 2.6" in one invocation, and do not hand a build agent the whole BA
spine — only the phase block + the files it names.

Goal (one phase, P<N>):
The next incomplete manifest phase is implemented: entities/migrations, API
endpoints, and screens named in the phase block, with loading/empty/error states
on every screen and input validation at the boundary. Before coding any
grid/form screen its screen-inventory floorplan row is confirmed (missing row =
blocker — escalate, never invent a floorplan), and its **prototype export source
file** (cited in the phase block) is opened — screens **adopt the export as
code** (NOT re-drawn in fresh Tailwind) following the method in
`docs/gates/visual-fidelity.md` + `playbooks/build-execution.md` § Prototype →
Code Fidelity + `prototype-export-adoption.md` (SoT) — unless the phase
block records `rebuild (decision: <slug>)` (no export for that screen).
Failed operations surface their real cause to the UI (no generic error-swallow);
a fix touching a systemic pattern sweeps ALL its call-sites. Then, in order:
`validate:quick` green; the phase's e2e smoke (the journeys its acceptance
checks name) passes against the running app; a verification-register row
(TC-NNN) is added per acceptance check with `Result: pass`; the design-system
floor self-check is clean for touched screens (§4 floorplan / §7 actions / §8
modals, Tier-2 tokens only, Tier-3 reuse); the **visual-fidelity check**
(`docs/gates/visual-fidelity.md`) passes — each screen's **Playwright fidelity
assertions** (element completeness + interaction behaviour) are green and its
screenshot is captured for the human side-by-side glance (no self-certified
"matches export"). One stage-boundary commit closes the
phase: it cites ≥1
token (REQ-ID / SC-NNN / TC-NNN), flips the phase checkbox in
`docs/build-manifest.md`, adds a `2.6/P<N>` History row in STAGE.md, and
updates `docs/ROADMAP.md` progress — all in the same commit. **Then the phase
must be ACCEPTED before the next phase starts**
(`docs/gates/phase-acceptance.md`): an INDEPENDENT agent verifier (never the
implementer) re-runs the phase's Acceptance checks against the running preview
(functional + visual-fidelity per shipped screen + negative-path) and returns
PASS/FAIL; FAIL is fixed inside the same phase and re-verified (cap 3 rounds,
then BLOCKED). PASS fills the manifest's `Accepted` cell + a TC-NNN acceptance
row. When the phase's `Verify-by` is `both` (manifest cadence knob, default
`per-ui-phase`), emit the gate's MANUAL_CHECKPOINT with the preview URL and
wait for the operator's OK before the next phase. STAGE.md Current stays 2.6
while phases remain; when the last phase closes AND is accepted, Current = 2.8. Đo lại: `node scripts/measure-macro2.mjs --step 2.6`.
Stop after 25 turns.

### Step 2.7 — Code review (6-dim) — at manifest completion (+ mid-point if >6 phases)  *(FOLDED into 2.10 — shares DoD floor rules; see macro-2.md)*

- **Inputs:** the full diff since P0 (or since the last 2.7 review).
- **Output path:** review record → `plans/reports/code-review-<date>-<slug>.md`.
- **Gate:** score ≥7, no dimension = 0; Design-System Compliance floor rule; blocking findings fixed.
- **Manual?** no.

Goal:
A 6-dimension review record exists per `playbooks/code-review-scoring.md` over
the diff since P0 (or since the previous mid-point review): overall score ≥7
with no dimension at 0, and the floor rules verified — **Design-System
Compliance** per screen (any unclassified or rule-violating grid/form screen =
automatic block), **Visual Fidelity** per screen (any APP/ADM screen divergent
from its prototype export render, or lacking both an export citation and a
recorded rebuild decision, = automatic block — `docs/gates/visual-fidelity.md`),
and **no generic error-swallow** (any user-facing failure surfacing a generic
message instead of its real cause = automatic block). The systemic-pattern
sweep rule is applied: any fix of a systemic pattern is checked against all
grep'd call-sites, siblings left broken = finding.
Blocking findings are fixed and re-verified in this step; non-blocking findings
are logged with a disposition. If this is the mid-point review (manifest >6
phases, roughly half done), STAGE.md Current returns to 2.6; otherwise
Current = 2.8. Stop after 15 turns.

### Step 2.8 — E2E from BA docs + user manual

- **Inputs:** BA acceptance criteria (SRS/srs-lite + scenarios) — not the code.
- **Output path:** E2E test suite + **TC-NNN** rows in `docs/about/TEST_MATRIX.md` + user manual under `docs/`.
- **Gate:** every in-scope REQ-ID ≥1 passing E2E + TC row.
- **Manual?** no.

Goal:
An E2E suite written **from the BA acceptance criteria** (never reverse-derived
from the code) covers every in-scope REQ-ID with ≥1 passing test, each recorded
as a TC-NNN row in the verification register (2.6 phase smokes count where they
map 1:1 to a REQ-ID — the register row is what matters). The **Mandatory
Coverage Rules** (`playbooks/canonical-e2e-flow-playbook.md`) hold: (1) every
user-facing operation that can fail — AI/generation, tier/quota-gated, payment,
provider-dependent, permission-gated — has ≥1 **negative-path** e2e that
triggers the failure and asserts the REAL cause surfaces in the UI (asserting a
generic error message = fail); (2) **every auth method** has an e2e that logs in
AND loads real authenticated data (data calls 200 + rendered values — route
reached is not proof), plus one switch-auth-method-on-same-browser
cookie-hygiene case. The RTM is forward-progressing: no in-scope REQ-ID without
a TC-NNN. A field-by-field user manual exists for every screen (per the e2e-qa
playbook), ready to hand to UAT. STAGE.md Current = 2.9. Stop after 25 turns.

### Step 2.9 — Independent security review

- **Inputs:** the codebase + `docs/decisions/<project>-threat-model.md`.
- **Output path:** security report → `plans/reports/security-review-<date>-<slug>.md`.
- **Gate:** **SECURITY SIGN-OFF** — 0 Critical/High open (red-team required).
- **Manual?** no.

Goal:
A security report exists covering STRIDE + OWASP Top-10 over the real code
(authn/authz on every endpoint, input validation, secrets handling, dependency
audit, injection/XSS/CSRF, rate limiting), including a **red-team pass** from
≥2 attacker personas, checked against the 2.2 threat-model (every threat's
mitigation verified or re-opened). Zero Critical/High findings remain open —
each is fixed and re-verified, or downgraded with evidence; Medium/Low have
recorded dispositions. The sign-off line is filled. STAGE.md Current = 2.10.
Stop after 20 turns.

### Step 2.10 — QA real-browser + video (DoD)

- **Inputs:** the running build + user manual + E2E results + the frozen prototype export bundle.
- **Output path:** QA evidence under `plans/reports/` + filled `docs/gates/visual-fidelity.md` + filled `docs/gates/dod-build.md`.
- **Gate:** **DoD** — review + E2E + security + QA evidence + user-manual + design-system-compliance green per screen; verification register all pass.
- **Manual?** no.

Goal:
Real-browser QA covers every critical journey with recorded evidence
(video/screenshots under `plans/reports/`), field-by-field against the user
manual. The **visual-fidelity evidence pass** is done: for each key APP/ADM
screen, a screenshot of the running app placed side-by-side with the render of
its prototype export, recorded as a `pass`/`divergent` row in
`docs/gates/visual-fidelity.md` — every row `pass` (divergent = fix or a
recorded rebuild decision, then re-check). PUB product-shot images (landing
hero/feature captures of the product) were captured AFTER the APP screens they
depict passed fidelity — stale early-UI captures are re-taken now. The DoD
checklist (`docs/gates/dod-build.md`) is filled: every core line
checked, every conditional enterprise toggle either cleared or marked N/A by
decision with reason + date, and the verification register has no `fail` /
`never-run` rows. Sequencing hazard: do NOT run the production build
(`pnpm build`) while the e2e dev server is serving — it clobbers the running
`.next` and fakes a login regression (template README § End-to-end tests);
build and browser-QA in separate steps. STAGE.md Current = 2.12. Stop after
15 turns.

### Step 2.11 — Go-live readiness  *(FOLDED into 2.13 — part of the release contract; see macro-2.md)*

- **Inputs:** accepted-candidate build + infra (compose/prod variant, CI).
- **Output path:** readiness checklist → `plans/reports/go-live-readiness-<date>-<slug>.md`.
- **Gate:** readiness green; rollback rehearsed; DR + NFR/load each cleared or N/A-by-decision.
- **Manual?** no.

Goal:
The readiness checklist is green: production build variant (Dockerfiles +
prod compose or deploy target) boots from a clean pull. **Offline caveat:** if
the base-image pull is network-blocked locally, follow the shared **Offline boot
caveat** (§ cuối file) — accept prod-command boot on built artifacts + config-valid +
CI-delegated build, record the caveat, and prove the containerized boot in
CI/deploy before the 2.13 release. Environments isolated
with `.env.<env>.example` complete; backups configured and a restore verified;
**rollback rehearsed** (deploy previous `IMAGE_TAG`, one-line procedure
recorded); monitoring/alerting live. DR restore-drill + RTO/RPO and NFR/load
test (k6/Lighthouse) each either done or explicitly `N/A by decision` in the
dod-build toggles. STAGE.md Current = 2.12. Stop after 15 turns.

### Step 2.12 — UAT + sign-off *(CLIENT GATE; Lite: owner)*

- **Inputs:** running build + frozen prototype + UAT plan (delivery-closure-story templates).
- **Output path:** `docs/uat/*` + signed sign-off (`locale-vi/` for VN client).
- **Gate:** **ACCEPTANCE (CLIENT)** — critical journeys pass + matches prototype + sign-off signed.
- **Manual?** **yes** — pages the client (Lite: the owner).

Goal:
A UAT plan exists (`docs/uat/`, from the delivery-closure-story templates)
walking the client through every critical journey against the frozen prototype.
Emit MANUAL_CHECKPOINT inviting the client (Lite: owner) to run the UAT session;
record results per journey. The ACCEPTANCE gate clears only when the client's
written sign-off is recorded and the RTM is **forward-complete** (every in-scope
REQ-ID → ≥1 passing TC-NNN). Do not advance STAGE.md before the written
sign-off. STAGE.md Current = 2.13 only after sign-off. Stop after 10 turns.

### Step 2.13 — Release

- **Inputs:** accepted build + sign-off.
- **Output path:** release note (template `docs/mau-tai-lieu/release-note.md`, `locale-vi/` fork) + git tag + deployed production.
- **Gate:** release-note lists every released REQ-ID; **verify-at-source PASS** (not a smoke-200) + rollback = one `IMAGE_TAG` line — the 5 release rules + Post-Deploy Checklist are the SoT in `docs/playbooks/go-live-deploy-verify.md`.
- **Manual?** **MANUAL_CHECKPOINT** — the prod deploy is a named-endpoint human decision (`go-live-deploy-verify.md` Rule 5).

Goal:
The release is tagged and deployed to production. The release note (EN + VN fork
for a VN client) lists **every released REQ-ID**, the version, and the one-line
rollback (`IMAGE_TAG` of the previous release).

**Verify-at-source, fail-closed (closes L1 / FC6 — a green CI run and an HTTP-200
are liars for "the new build is live").** Apply the 5 rules in
`docs/playbooks/go-live-deploy-verify.md` (SoT) and fill its **Post-Deploy
Checklist** before declaring the release done:
1. health `.status==ok` (+ db/redis where applicable) AND a **build-specific
   content marker** observed in the served artifact — never CI-green / HTTP-200 /
   a version string (Rule 2);
2. build-time-inlined env (`NEXT_PUBLIC_*`, sitemap/OG/json-ld) baked via build
   ARG on a **real rebuild**, not a cached redeploy (Rule 1);
3. money / identity / legal secrets carry **real deploy-env values**, placeholder
   defaults rejected in prod, fail-closed proven at source (Rules 3-4);
4. the deploy is fired against a **named endpoint with human go-ahead** — emit
   `MANUAL_CHECKPOINT` naming the target host; never auto-fire a prod deploy
   (Rule 5).

**Then flip Mode A → Mode B (graduation — `docs/about/OPERATING-MODES.md` § The
graduation).** Go-live is the graduation point; in the SAME close edit `STAGE.md`:
its Macro-stage flips to **Steady-state (Macro 3)**, the **"current step" field is
dropped** (meaningless now) and replaced with **"Steady-state since {date}; board
= <issues link>"**, and it records that `/stage-next` is no longer the driver — the
**loop (issue-pipeline)** takes over and new work enters as **issues**, not stage
steps. A live product still naming a finite "current step" is the smell that it
graduated but nobody flipped the mode.

**Chốt hai sổ trước khi rời Macro 2.** Đây là lần cuối còn chạm được vào chúng:

1. `node scripts/measure-macro2.mjs --step 2.13 --note "go-live"` - dòng cuối của sổ đo.
   So với dòng `2.0`: `test%` và `issue%` phải đi từ gần 0 lên gần 100. Hai cột
   `register`/`prototype` **không** phải công của Macro 2, đừng tính vào.
2. `docs/macro2-friction-log.md` - làm phần "Cuối lượt" của chính sổ đó: đếm theo loại,
   và **mỗi dòng còn `chưa` ở cột "sửa harness?" phải thành một delta `MD-NN`** trong
   `loop-harness/docs/process/macro-2-deltas.md`, hoặc bị đóng kèm lý do. Sổ ma sát
   không chuyển thành delta thì lượt chạy này không cải thiện được Macro 2 lần sau.

STAGE.md Current = Post-Build / 3.1 (the
one-time 3.1 handover / 3.2 hypercare-kickoff / 3.6 retro ceremonies still run via
`/stage-next`; 3.3 + 3.5 are the continuous loop). Stop after 12 turns.

---

---

## Offline boot caveat

Hai bước trích mục này: **2.4** (walking skeleton phải boot được) và **2.13** (bản
production phải boot từ một lần pull sạch). Trước đây cả hai ghi "(§ below)" mà **không
có section nào tên vậy** - tham chiếu cụt, người chạy không kiểm được caveat thật sự đòi
gì. Lượt chạy thật bắt được ở 2.4.

**Nguyên tắc:** mạng chặn kéo image không phải lỗi của dự án, nên **không chặn cổng vì
mạng**. Nhưng cũng không được nhận xanh suông - phải thay bằng bằng chứng khác và **ghi
lại là đã thay**.

Ba việc, đủ cả ba mới được đi tiếp:

1. **Thay bằng chứng.** Boot bằng db đã cache, hoặc chạy thẳng lệnh production trên
   artifact đã build, thay cho `docker compose up` từ image mới kéo.
2. **Ghi caveat** vào ghi chép của bước: thay cái gì, vì sao.
3. **Hẹn chỗ trả nợ.** Bước 2.4 trả ở lần CI đầu tiên có mạng; bước 2.13 phải chứng minh
   boot trong container ở CI/deploy **trước khi phát hành**. Caveat không được sống qua
   mốc go-live.

Không đủ ba thì cổng **đỏ**, không phải "tạm chấp nhận".
