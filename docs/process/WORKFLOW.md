# Workflow — Macro 2 (Build & Go-live)

**File này chỉ nói về Macro 2.** Macro 1 (Pre-Build) và Macro 3 (Post-Build) đã
được cắt khỏi loop-harness ngày 2026-09-05.

## Ranh giới — đọc trước

loop-harness sở hữu **đúng một thứ: Macro 2**. Macro 1 và Macro 3 thuộc về bộ
harness mà từng dự án mang theo (`<dự án>/docs/WORKFLOW.md`), không thuộc file này.

Lý do cắt: trước 2026-09-05 tồn tại **hai định nghĩa Macro 1 khác nhau** - một
trong loop-harness, một trong bộ harness mà autocontent bootstrap từ
`vibecode-harness`. Hai bản mâu thuẫn ở chỗ nặng nhất có thể: **thứ tự tiền và
thiết kế**. loop-harness ghi *"prototype chốt TRƯỚC báo giá"* (PB-G3 = chốt
prototype, PB-G4 = hợp đồng + cọc); autocontent ghi ngược lại (PB-G3 = contract +
deposit, và *"loop 1.15 chỉ chạy sau PB-G3 - không lặp thiết kế sâu khi chưa trả
tiền"*). Giữ cả hai là mời người đọc chọn nhầm. Chi tiết: `macro-2-deltas.md` MD-10.

Nên trong file này:
- **Điều kiện VÀO Macro 2** (`PB-G3`, `PB-G4` đã bắn) do workflow của dự án định nghĩa
- **Điều kiện RA** (`HANDOVER`, hypercare, steady-state) cũng vậy
- Ở giữa, từ **2.0 đến 2.13**, là phần loop-harness chịu trách nhiệm

## Cách đọc

Mỗi bước có goal block trong `docs/process/STAGE_GOALS.md` và chạy được bằng
`/stage-next` (riêng 2.6 dùng vòng `/build-phase`). Bảng thi hành một-nhìn-là-rõ
nằm ở `macro-2.md`.

**Authority:** file này cho bản đồ bước, gate và vai. `macro-2.md` cho cách làm
từng bước. `STAGE_GOALS.md` cho mục tiêu-text từng bước. Trạng thái hiện tại:
`STAGE.md` ở gốc repo dự án.

Cột của bảng bước: **# · Step · Role · Engine · Inputs · Output path · Gate ·
Manual?**. *Engine* là skill `ck-*` hoặc agent toàn cục thực thi bước đó (engine
sống, không bao giờ vendor - `docs/about/HARNESS.md` § Independence Principle).
*Manual?* = bước đó có phải gọi người/khách xử lý ngoài hệ thống không.

> **Lane** (Full / Lite) do dự án khai trong `STAGE.md`. Lane chỉ quyết định
> Macro 1 chạy nặng hay nhẹ - **Macro 2 chạy như nhau ở cả hai lane**, nên file
> này không bàn tới lane nữa.

---

## TL;DR Flow

```text
VÀO: PB-G3 + PB-G4 của dự án đã bắn (thứ tự do workflow của dự án định nghĩa)
     ▼
MACRO 2 — BUILD & GO-LIVE
  2.0 kiểm sẵn sàng: tier-2 hợp thư viện UI · tài liệu không gọi tên ma · ánh xạ component
  → 2.1 ERD freeze (SA) → 2.2 stack/threat-model (Tech Lead)
  → 2.3 plan + BUILD MANIFEST + DoR → 2.4 walking skeleton + env/CI (P0)
  → 2.5 seed → 2.6 /build-phase loop P1..PN (per-phase ACCEPTANCE verify)
  → 2.7 review (manifest-complete) → 2.8 E2E → 2.9 security sign-off
  → 2.10 QA (DoD) → 2.11 go-live readiness
  → 2.12 UAT + sign-off (ACCEPTANCE, CLIENT) → 2.13 release
     ▼
RA: bàn giao + hypercare + steady-state - thuộc workflow của dự án
```

---

## Macro-Stage 2 — BUILD & GO-LIVE

> **Canonical process shape = `docs/process/macro-2.md`.** This table is the
> human-readable view; the yaml is what /stage-next + the RTM dashboard read.
> Folded steps (2026-09-01): **2.5→2.4**, **2.7→2.10**, **2.11→2.13**; security
> is one VERIFY pass at 2.9. The rows below keep the folded steps' detail, tagged.

**Entry:** PB-G4 passed (Full lane) or PB-G3-lite frozen + 1.14/1.15 marked
N/A-by-decision (Lite lane).
**Exit:** signed sign-off + go-live readiness PASS + every released REQ-ID in the
release note → production release. *(payment milestones attach here in Full)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 2.1 | Solution/data arch — **freeze ERD** | **SA** | `ck-tech-design` (databases) + `tech-graph` | SRS(-lite) data-model + use-cases + screen inventory | `docs/decisions/<slug>.md` + `docs/system-architecture.md` (ERD) | ERD review: entities, normalization, audit + tenant fields; **ERD FROZEN** | no |
| 2.1b | Data migration & cutover (brownfield) | SA + DevSecOps | `databases` + `devops` | legacy schema + ERD | migration plan + dry-run report | **CONDITIONAL — N/A by decision** for greenfield / Lite internal; APPLICABLE only when brownfield (replacing a legacy system — real use: nhatnghe.net Phase-1.5 + migration Phase-2): ETL + dry-run cutover + rollback-of-data + RTO/RPO | no |
| 2.2 | Technical design + choose stack (TDR) | **Tech Lead** | `ck-tech-design` + `ck-predict` | NFR + ERD | `docs/decisions/<slug>.md` (stack) + API contract | stack justified vs NFR (**default = the shipped walking-skeleton stack template**; deviations need the ADR to say why), API contract complete, authz; **STRIDE threat-model here** | no |
| 2.3 | Implementation plan + **BUILD MANIFEST** + DoR | Tech Lead + PM | `ck-plan` + build-manifest-compilation playbook | TDR + scope baseline + ERD + screen inventory | `plans/<YYMMDD-HHMM>-<slug>/` + **`docs/build-manifest.md`** | **DoR GATE** — manifest-completeness + all clearing conditions in `docs/gates/dor-build.md` (SoT) | no |
| 2.4 | **Walking skeleton** (manifest **P0**) + env + CI/CD + observability | DevSecOps | stack template `scaffold.sh` + `devops` + `deploy` | stack decision + manifest P0 | scaffolded monorepo + pipeline + compose | **WALKING SKELETON**: `install && build` green, `docker compose up` boots, health OK, CI(-equivalent local) green, secret scan clean; alerting/SLO live or N/A-by-decision | no |
| 2.5 | Seed + foundation data **(FOLDED→2.4)** | DevSecOps + Dev | `ck-seed` + seed-data-pattern | ERD + RBAC | seed scripts (extends the template's admin seed to the domain) | app boots with RBAC + **seeded admin login works**; FK-valid; P0 marked done in manifest | no |
| 2.6 | **Code feature by phase — `/build-phase` loop P1..PN** | Fullstack Dev | `/build-phase` → `fullstack-developer` (·`cook`) + independent verifier subagent | build-manifest + ERD + SRS module file(s) + screen-inventory rows + **prototype export files** + tokens | code commits + verification-register rows + manifest progress (incl. `Accepted` cell) | per phase: compiles/runs, `validate:quick` green, e2e smoke for the phase's journeys, **floor self-check** (design-system floor rules + **visual-fidelity** — each screen's Playwright fidelity assertions green + screenshot captured for the human glance; screens **adopt the export as code** per `build-execution.md` § Prototype → Code Fidelity + `prototype-export-adoption.md`), commit cites ≥1 token, phase marked done in manifest, **+ PHASE ACCEPTANCE** (`docs/gates/phase-acceptance.md`): independent agent-verifier PASS on the phase's AC vs the running preview; human checkpoint per the manifest cadence | **cadence** — `Verify-by: both` phases page the operator (internal, not the client) |
| 2.7 | Code review (6-dim) — **once at manifest completion** (+ mid-point if >6 phases) **(FOLDED→2.10)** | Tech Lead (reviewer) | `ck-code-review` | full diff since P0 | review record | score ≥7, no dimension = 0; **+ FLOOR rules: Design-System Compliance · Visual Fidelity · no generic error-swallow** (note below) + systemic-pattern sweep | no |
| 2.8 | E2E from BA docs + user manual | QC/QA | `ck-e2e-flow` (+ `ck-scenario`) | acceptance criteria | E2E tests + **TC-NNN** rows | every REQ-ID ≥1 E2E pass + TC row (phase smokes from 2.6 count when they map to a REQ-ID); **+ Mandatory Coverage Rules** (canonical-e2e playbook): negative-path e2e for every failable op asserting the REAL cause surfaces; every auth method login→data-load (200) + cookie-hygiene switch case | no |
| 2.9 | Independent security review — **once, after manifest complete** | DevSecOps (sec hat) | `ck-security` (STRIDE+OWASP, **red-team required**) | code + threat-model | security report | **SECURITY SIGN-OFF**: 0 Critical/High open | no |
| 2.10 | QA real-browser + video | QC/QA | `ck-qa` | running build + prototype exports | QA evidence + filled `docs/gates/visual-fidelity.md` | **DoD GATE** (`docs/gates/dod-build.md`): review + E2E + security + QA evidence + user-manual + design-system-compliance green per screen + **visual-fidelity pass per key screen** (fidelity assertions green + human side-by-side glance recorded); PUB product-shots captured after the APP screens they depict | no |
| 2.11 | Go-live readiness **(FOLDED→2.13)** | DevSecOps + PM | `ck-prod-readiness` | build + infra | readiness checklist | readiness green; **rollback rehearsed**; **DR restore-drill + RTO/RPO (CONDITIONAL — N/A by decision)**; **NFR/load test (CONDITIONAL — N/A by decision)** | no |
| 2.12 | **UAT + sign-off (one client session)** | BA + Release Mgr + Client | `ck-uat` → `ck-signoff` | running build + prototype | `docs/uat/*` + signed sign-off (`locale-vi/`) | **ACCEPTANCE (CLIENT)**: critical journeys pass + matches prototype + sign-off signed (Lite: owner runs UAT + ack) | **yes** |
| 2.13 | Release | Release Manager | `ship` + `deploy` | accepted build | release note + tag | release-note (every released REQ) + **verify-at-source** (health `.status==ok` + a build-specific content marker, NOT CI-green / HTTP-200 / a version string) + rollback = one `IMAGE_TAG` line — the 5 release rules + Post-Deploy Checklist are in `docs/playbooks/go-live-deploy-verify.md` | **MANUAL_CHECKPOINT** — the prod deploy is a named-endpoint human decision (`go-live-deploy-verify.md` Rule 5) |

> **Build Manifest (step 2.3 output — the spec→code conversion layer).** ONE
> file, `docs/build-manifest.md` (template:
> `docs/mau-tai-lieu/build-manifest.md`, playbook:
> `docs/playbooks/build-manifest-compilation.md`), compressing the whole BA
> spine into ordered executable phases **P0..PN**. P0 = walking skeleton
> (scaffolded from the stack template). Each later phase: REQ-IDs covered,
> entities, endpoints, screens (+floorplan class), concrete acceptance checks,
> verify commands, size S/M/L. **A phase must be completable in one agent
> session (≤~10 files touched) — split it otherwise.** A build agent reads its
> phase block + the files that block names — never the whole spine.

> **Gate rebalance (per-phase vs once).** During 2.6, every phase runs the
> **light floor self-check** (`validate:quick` + the design-system floor rules
> (§4 floorplan / §7 actions / §8 modals for touched screens) + the phase's e2e
> smoke) **and then the PHASE ACCEPTANCE verification**
> (`docs/gates/phase-acceptance.md`): an independent agent verifier re-runs the
> phase's acceptance checks against the running **incremental preview**
> (functional + visual-fidelity + negative-path), FAIL is fixed in the same
> phase before the next phase starts, and a human checkpoint fires per the
> manifest's cadence knob (default `per-ui-phase`). The **heavy** gates — 2.7
> six-dimension review, 2.9 security review, 2.10 full QA — still run **once
> when the manifest is complete** (plus one mid-point 2.7 review if the
> manifest has more than 6 phases), but as **aggregation and cross-phase
> confirmation** — no longer the first place a phase's defect can be caught. Do
> not page a full review per phase; do not skip the floor self-check or the
> acceptance verification on any phase. **Why per-phase — the token-curve
> rationale (defect-in-phase = one fix cycle; defect-at-end = cross-phase rework,
> the biggest token sink) → `docs/gates/phase-acceptance.md` § Why this gate exists (SoT).**

> **Conditional enterprise gates (each marked N/A by decision if not needed —
> never silently dropped):** 2.1b data-migration/cutover · 2.11 NFR/load (k6 p95
> + Lighthouse) · 2.11 DR + RTO/RPO restore-drill (separate from rollback) ·
> Compliance/Privacy/WCAG · Contract/SLA terms generated (Full lane).
> Red-team is **required** at the 3 high-risk gates: 2.2 (threat-model), 2.9
> (security), 2.10 (DoD).

> **Non-CRUD phase-types (2.3 routing + 2.6 acceptance).** The build-manifest
> phase block carries a **`Phase-type`**: `crud` (default) `| async-job |
> media-pipeline | external-integration | storage`. At 2.3 a REQ-ID citing an
> async/media/storage/integration signal (transcode, HLS, upload, queue, webhook,
> signed-url, storage, PDF-render, email-blast) MUST route to its non-CRUD
> phase-type — folding it into a CRUD phase is a 2.3 compile defect
> (`docs/playbooks/build-manifest-compilation.md` step 4b). Each non-CRUD type adds
> **type-specific acceptance categories** the 2.6 independent verifier exercises
> against the running preview at THAT phase (`docs/gates/phase-acceptance.md`) — the
> **streaming NFR** (first-byte, signed-URL entitlement, multi-bitrate present) is
> asserted at the media phase, not only at 2.11. Playbooks:
> `async-job-queue.md` · `object-storage.md` · `media-pipeline.md` ·
> `external-integration.md` (payment stays the concrete money instance). The stack
> ships opt-in **tier-2 primitives** — queue (`apps/api/src/common/queue/`),
> storage adapter (`apps/api/src/common/storage/`), worker (`apps/worker/`) — wired
> only when a non-CRUD phase exists; CRUD-only projects never boot them (YAGNI). The
> 2.2 stack pick surfaces tier-2 when any such capability is in scope.

> **Design-System Compliance is a code-review FLOOR rule (2.7) and a per-phase
> self-check rule (2.6).** It reuses the "any dimension scoring 0 is an
> automatic block" mechanic — it does **NOT** change the 6-dimension scoring or
> the **≥7** threshold. The floor: *a screen with no floorplan classification OR
> that violates its assigned §4 floorplan / §7 action-placement / §8 modal rules
> = automatic merge block.* A missing `screen-inventory.md` classification for
> any grid/form screen is itself a block. Authority: Tier-1
> `docs/design-system/design-rules.md`.

> **Two more floor rules ride the same mechanic (2.6 self-check + 2.7 block +
> a DoD line):** **Visual Fidelity** — a UI screen whose **Playwright fidelity
> assertions** (element completeness + interaction behaviour) are RED, or lacking
> both an export-source citation and a recorded `rebuild (decision: <slug>)`
> marker, = automatic block (`docs/gates/visual-fidelity.md`; adopt-export-as-code
> default: `docs/playbooks/build-execution.md` § Prototype → Code Fidelity +
> `prototype-export-adoption.md`). **No generic
> error-swallow** — a user-facing failure surfacing a generic message instead of
> its real cause = automatic block (`docs/playbooks/code-review-scoring.md`);
> 2.8 proves the surfacing with negative-path e2e.

---

---

## Canonical Gate List

| Gate | Macro | Type | Clears when |
|---|---|---|---|
| **DoR** | Build | internal | baselined + ERD frozen + design approved + acceptance criteria + NFR + **build-manifest complete** (manifest-completeness + full clearing conditions → `docs/gates/dor-build.md`, SoT) |
| **ERD FROZEN** | Build | internal | entities / normalization / audit+tenant fields reviewed |
| **WALKING SKELETON** | Build | internal | scaffolded app installs, builds, boots via compose, health OK, seeded admin login works, CI(-equivalent local) green |
| **SECURITY SIGN-OFF** | Build | internal | 0 Critical/High open (red-team required) |
| **DoD** | Build | internal | review + E2E (incl. negative-path + auth-to-data coverage) + security + QA evidence + user-manual + design-system-compliance + visual-fidelity green per screen |
| **Design-System Compliance** | Build | internal (floor-rule auto-block) | every grid/form screen classified to one §4 floorplan (or CUSTOM) + obeys §4/§7/§8 rules — per-phase self-check (2.6) + 2.7 floor rule + a DoD line |
| **Visual Fidelity** | Build | internal (floor-rule auto-block) | every key UI screen's Playwright fidelity assertions (element completeness + interaction behaviour) are green + a human side-by-side glance is recorded (built screenshot vs prototype image), or the screen carries a recorded rebuild decision — per-phase acceptance leg (2.6) + 2.7 floor rule + 2.10 evidence pass + a DoD line; adopt-export-as-code, NOT LLM image-compare (`docs/gates/visual-fidelity.md`) |
| **Phase Acceptance** | Build | internal (per-phase auto-block) | per 2.6 phase: independent agent-verifier PASS on the phase's acceptance checks (functional + visual-fidelity + negative-path) against the running preview, recorded in the manifest `Accepted` cell + a TC-NNN row; human checkpoint OK when the phase's `Verify-by` is `both` — the next phase MUST NOT start before both (`docs/gates/phase-acceptance.md`) |
| **ACCEPTANCE** | Build | **CLIENT** (Lite: owner ack) | critical journeys pass + matches prototype + sign-off signed |

**Conditional enterprise gates** — each must be explicitly marked **N/A by
decision** when not applicable, never silently dropped: data-migration/cutover
(2.1b), NFR/load test (2.11), DR + RTO/RPO (2.11), compliance/privacy/WCAG,
observability/SLO (2.4 — usually always-on). The single tracked **toggle table (SoT)** where
each is cleared-or-N/A lives in `docs/gates/dod-build.md` § Conditional Enterprise
Gate Toggles.

> **Client-paging gate inside Macro 2:** ACCEPTANCE (2.12). The Pre-Build gates
> (PB-G1..G4) and HANDOVER belong to the project's own workflow, not to this
> file — see § Ranh giới.

---

---

## Always-On Layer

Chạy song song với mọi bước của Macro 2:

- **Change-control (async)** — any post-freeze client/owner request → CR-NN log;
  impact + re-estimate + approval **before** code; push-notifies the human,
  never blocks the session (lane change-control của dự án; re-enters at 2.3 / 2.6 — the manifest
  gains a new phase, never an in-place scope stretch).
- **Audit trail** — every architecture/behavior choice → `docs/decisions/<slug>.md`
  (stable slug, never a number); every released REQ-ID → ≥1 TC-NNN; every
  multi-task session end → session-retrospective.
- **Stage-boundary commits** — each step that produces a repo artifact = one
  bundled commit at the step boundary. The same commit updates `STAGE.md`
  (current-stage pointer + History row) and `docs/ROADMAP.md` (module progress).
  Never split into a follow-up commit. In 2.6, **each completed phase** is a
  stage-boundary commit (STAGE.md stays on 2.6 but its History gains a
  `2.6/P<N>` row; the manifest checkbox flips in the same commit). A
  stage-boundary commit that changes no module progress (doc-only or repair)
  still stages `docs/ROADMAP.md` — refresh its `Updated:` line so the file is
  honestly current; the verify-gate's atomicity check requires both staged.

---

---

## Token Chain

End-to-end traceability (full spec: `docs/about/TRACE_SPEC.md`). The canonical scheme
— **the only scheme; do NOT use `US-NNN.REQ-MMM`**:

Macro 2 nhận chuỗi này từ Macro 1 của dự án (REQ-ID và feature-register đã có
sẵn khi vào 2.1) và nối tiếp từ `build-manifest phase` trở đi:

```text
REQ-ID = MODULE.AREA.NN     (do Macro 1 của dự án sinh, vd IF.AUTH.01)
feature-register line       (do Macro 1 của dự án đóng băng ở PB-G2)
    ↓ compiled to build order
build-manifest phase        (2.3 — every in-scope REQ-ID in exactly one phase)
    ↓ proven (Build)
TC-NNN                      (2.6 phase smoke / 2.8 E2E + verification register)
    ↓ validated (Build)
UAT (2.12) → release-note (2.13) → handover (3.1)
```

**Change requests** mint `CR-NN` và, khi được duyệt, sinh REQ-ID mới. Giữa lúc
build thì chúng vào lại ở **2.3 dưới dạng một phase mới của manifest**, không bao
giờ nong scope của phase đang chạy.

**RTM completeness rule:** every feature-register line traces back to ≥1 REQ-ID
and ≥1 use case, and forward to ≥1 TC-NNN before ACCEPTANCE. **Manifest
completeness rule (2.3):** every in-scope REQ-ID appears in exactly one manifest
phase (SoT: `docs/gates/dor-build.md`). The verify-gate reads the RTM rule; the
DoR gate reads the manifest rule.

---

---

## Quick Links

- **Bảng thi hành từng bước:** `macro-2.md`
- **Mục tiêu-text từng bước:** `STAGE_GOALS.md`
- **Thay đổi harness phát hiện từ dự án thật:** `macro-2-deltas.md`
- **Mô hình vận hành 2 mode:** `../about/OPERATING-MODES.md`
- **Vai:** `../about/ROLE_MAP.md`
- **Ngữ pháp token:** `../about/TRACE_SPEC.md`
- **Build manifest:** mẫu `../mau-tai-lieu/build-manifest.md` · playbook `../playbooks/build-manifest-compilation.md`
- **Playbook giao hàng không-CRUD:** `../playbooks/async-job-queue.md` · `object-storage.md` · `media-pipeline.md` · `external-integration.md`
- **Danh sách gate cơ học:** `../gates/lint-gates-registry.md`
