# Phase 3 — Proof run: sample project through the harness

**Precondition:** Phase 1 + 2 done (harness v2 + verified template).
**Sample project:** `~/Desktop/Workspace/videcode-samples/quan-ly-cong-viec-tho/` (NEW dir, own git repo) — "Thợ Việc" mini job-dispatch SaaS: owner posts jobs, workers claim + update status, admin manages users. Deliberately small: entities User, Job, JobAssignment, AuditLog; roles owner|worker|admin; 6-8 screens (login, job list [List Report], job detail [Object Page], create job [form], my assignments [Worklist], admin users [List Report], dashboard-lite [Overview]).

## Steps
1. Bootstrap: run `harness/scripts/install-harness.sh` into the sample dir; STAGE.md Lane=Lite.
2. Pre-Build Lite: intake (1-page brief written from the description above) → srs-lite (REQ-IDs; scenarios only for auth + job-claim race) → feature list freeze → tokens (default theme fine) → screen-inventory with floorplan classes → SKIP external prototype tool (Lite: written screen specs suffice; record N/A-by-decision) → freeze.
3. Build 2.1–2.5: ERD freeze (4 entities) → stack = template (TDR cites template version) → build-manifest (P0 skeleton + P1 jobs CRUD + P2 assignments/claim flow + P3 admin+dashboard) → scaffold via template → CI local-equivalent green → seed (admin+owner+worker+3 jobs).
4. Build 2.6 loop: `/build-phase` per phase P1..P3 (implement → validate:quick → e2e smoke → register row → commit).
5. Close: 2.7 6-dim review (fix to ≥7) → 2.8 e2e per REQ-ID + TC rows → 2.9 security pass (no Critical/High) → 2.10 DoD checklist → 2.13 release note + tag v0.1.0. UAT/2.12 = owner-ack N/A-by-decision (internal sample).
6. Final verify against `plans/reports/hasi-hub-benchmark-260705.md` §Minimum bar (9 checks) — all green with command output evidence.

## Acceptance
- `pnpm install && docker compose up` + seed → login works for all 3 roles; job claim flow e2e passes.
- CI-equivalent local run green; ≥1 Playwright e2e per critical journey (login, create job, claim job, admin user list).
- STAGE.md History shows every 2.x step with commit SHAs; no step returned BLOCKED-on-stub.
- Report → `plans/reports/phase-03-proof-run-report.md` (in videcode-harness) incl. friction log: every place the harness was ambiguous/missing → feeds Phase 4 fixes.
