# Seed Data Pattern

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Deterministic, FK-valid demo data shape for DEV and TEST environments only.
> Ships the pattern; the project provides the locale data. Owns Build & Go-live
> **step 2.5** (seed + foundation data).

**Macro-stage / step:** Build & Go-live · 2.5 (after 2.4 env, before 2.6 code).
**Gate:** app boots with RBAC + admin; FK-valid.

> The ID convention + FK order below are authoritative.

## Engine

- **Fast path:** `ck-seed` (auto-detects stack — Prisma / SQL / MongoDB / Django /
  Laravel — and emits RBAC roles/permissions, admin accounts, app settings, and VN
  master data: 34 tỉnh thành, phường/xã, currencies).
- **Role:** DevSecOps + Dev. **Bare-agent fallback:** hand-write the seed script
  following the FK order below. Per D1 the skill is an accelerator.

> **Locale split:** the *pattern* (deterministic IDs, FK order, scoped cleanup) is
> harness-owned and locale-free. The *VN master data* (provinces, currencies) is
> what `ck-seed` adds for VN projects — it is project data, not part of this
> generic pattern. Keep test-fixture seed (this playbook) and production master
> data separate.

## When To Use

- Any DB-backed test (integration or E2E) that needs predictable rows.
- Local dev bootstrap (`seed:dev`-style script).

Skip when: the test is unit-level and uses framework fixtures (Jest snapshots,
pytest fixtures) — those belong in framework docs. Or the environment is
production. **Never seed production.**

## Deterministic ID Convention

Each seeded row has a stable, prefixed identifier so tests reference rows by
symbolic name instead of a generated UUID.

| Pattern | Example | When |
|---|---|---|
| `seed-<entity>-<n>` | `seed-user-1`, `seed-order-3` | Unscoped top-level objects. |
| `seed-<parent>-<entity>-<n>` | `seed-tenant-acme-user-1` | Entities scoped under a parent (multi-tenant, project-scoped). |

Persist the symbolic ID either as the PK (when the schema allows string IDs) or as
a unique secondary column the seed code looks up.

## FK-Valid Construction Order

Insert in dependency order. If A references B, insert B first.

```text
1. Roots: tenant, organisation, account (no inbound FKs).
2. Identity: user, role, permission (FK to roots).
3. Entities: project, document, asset (FK to identity / roots).
4. Relationships: membership, assignment, share (FK to entities).
5. State / events: audit log, notification, transaction (FK to anything).
```

A test that violates this order produces a confusing FK error instead of a clear
"missing parent" signal. Author top-down.

## Scoped Cleanup

Each seed run owns a scope tag (e.g. `seed:test-run-<uuid>` on every inserted
row). Cleanup deletes only rows carrying that tag:

```text
cleanup(scope):
  for table in reverse(insertion_order):
    DELETE FROM table WHERE seed_scope = scope
```

Never use `TRUNCATE` or schema-level drops in shared environments — they erase
concurrent test runs.

## Determinism

Use a fixed RNG seed (e.g. `seed=42`) so demo rows are identical across runs — a
Readonly E2E test (`canonical-e2e-flow-playbook.md`) that asserts `kpi == 142`
depends on this. Non-deterministic seed data makes Readonly assertions flaky.

## Scope

DB seed only. Unit-test fixtures (Jest snapshots, pytest fixtures, factory_bot)
are framework-specific and out of scope.

## Hand-Off

- Seeded symbolic IDs (e.g. `seed-manager-1`) are referenced by name in
  `canonical-e2e-flow-playbook.md` skeletons.
- The seed-run tag (`seed_scope`) appears in test logs so triage maps a failing
  test back to the seed batch that produced its data.

## Variant Section

(Append a Variant block here when this pattern fails or partially works. Do not
delete the original rules.)

## Related

- `docs/process/WORKFLOW.md` § 2.5 — the step this playbook owns.
- `canonical-e2e-flow-playbook.md` — consumes seed IDs (2.8).
- `build-execution.md` — wires the seed script into the dev bootstrap (2.6).
- `docs/about/ROLE_MAP.md` — DevSecOps role + `ck-seed` engine binding.
