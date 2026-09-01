# Status Surfaces — Ops-Board + Client Roadmap

**When To Run:** standing up or updating the two status trackers — the internal ops-board (team) and the client-facing roadmap (buyer). **Skip when:** no external client and no status-tracking need.

**Lifecycle:** experimental · **First use:** 2026-07-11 (Nhất Nghệ eLearning) · **Verified by:** none

> Owns the **two hosted status Artifacts** a run keeps: the **internal ops-board**
> (team) and the **client-facing roadmap** (buyer). Authority: `docs/about/HARNESS.md`
> § Status Artifact → Two surfaces + Locked Decision **D4**. This is the *how*;
> HARNESS.md is the *why/what*. Composes with `bilingual-delivery-template-pattern.md`
> (D4 forks) — it never duplicates it.

## Engine

No `ck-*` skill. Each surface is a self-contained hosted HTML **Artifact**,
published + re-published to a **stable URL**, anchored to the run. Both mirror the
**same verified state** (the gate results + verify-at-source checks, FC6) — they
never introduce a second source of truth.

## The two surfaces (never merge them)

1. **Internal ops-board** — full engineering truth for the team: phase IDs, SHAs,
   harness version, deploy/gate state, live service links (clickable, verify-at-
   source), harness lessons this run, blockers (all FC/OQ). Operator's language +
   inline gloss. Stand up early, refresh every milestone. *(HARNESS.md § Status
   Artifact.)*
2. **Client-facing roadmap** — a **curated** buyer view, separate file → separate
   URL. Same facts, filtered + reframed. A **PM deliverable**; **CS forwards** it
   to the client. The internal board is NEVER the thing sent out.

## Producing the client roadmap

**Step 1 — pull the verified state**, don't re-derive: phase completion from the
build-manifest Status column (only `human-ok` / `agent-pass` count), live checks
from the same verify-at-source the ops-board uses, dates from the SOW/roadmap.

**Step 2 — collapse phases → value buckets.** The client thinks in capabilities,
not P-numbers. Roll the P-list up into business buckets; a bucket's state is the
roll-up of its phases. Example mapping (eLearning; adapt per project):

| Value bucket (client sees) | Phases behind it | State = roll-up |
|---|---|---|
| Tài khoản & Phân quyền | auth, RBAC, user-admin, impersonation | all done → **Đã bàn giao** |
| Khóa học & Bài giảng | course CRUD, chapter/lesson, video | mixed → **Đang hoàn thiện** |
| Thanh toán & Đơn hàng | payment, orders, order-history | none → **Sắp triển khai** |
| Chuyển dữ liệu cũ | migration set | blocked-on-client → **Chờ dữ liệu** |

Bucket states: **delivered / in-progress / upcoming / waiting-on-client**.

**Step 3 — strip the machine.** Remove phase numbers, commit SHAs, harness
versions, gate names, stack nouns (HLS, authz, dnd-kit, Prisma…). Say the
capability, not the tech.

**Step 4 — one honest number, positively framed.** Same %/count as the ops-board
(never inflate); frame as "foundation + core first, delivering in sequence."

**Step 5 — client-owed blockers as a courteous callout only.** Surface just the
items the client must act on (e.g. legacy-DB credentials for migration), phrased
so it does not read as our delay. Hide internal FC/OQ.

**Step 6 — SOW-date timeline**, milestone level (GĐ1 → GĐ2 → GĐ3 → warranty).

**Step 7 — publish to its own stable URL**, refresh at the same milestones as the
ops-board. Client-facing → localized per D4.

## Curation checklist (fail any → not client-ready)

- [ ] Zero internal tokens (P#, SHA, vX.Y, gate/FC/OQ codes, stack nouns).
- [ ] % identical to the ops-board's verified count (no inflation).
- [ ] Every bucket state traces to real phase states.
- [ ] Only client-owed blockers shown, as an action item.
- [ ] Separate file + URL from the ops-board; localized (D4).

## Variant — solo run

The operator wears PM + CS hats, but **still keeps two files**. The discipline is
the separation, not the headcount: the internal board is never pasted to the client.
