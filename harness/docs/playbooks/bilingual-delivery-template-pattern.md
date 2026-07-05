# Bilingual Delivery Template Pattern

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> How to fork harness templates into a locale variant (Vietnamese first, per D4)
> without losing portability of the automation, IDs, and cross-team references.
> Always-on across all three macro-stages — every client-facing surface uses it.

**Authority:** locked decision **D4** (bilingual client-facing surfaces — see
`docs/HARNESS.md` § Locked Decisions). The split rule below is its operational form.

## Engine

No skill — this is a structural fork pattern the `docs-manager` agent applies.
Several client-facing engines emit VN output natively (`ck-uat`, `ck-signoff`,
`ck-scope-confirmation`, `ck-client-update`, `ck-handover`) — when they do, the
output still obeys the split rule below.

## D4 — What Forks vs What Stays English

**`locale-vi/` forks exist for ALL client-facing surfaces:**

- Commercial: `intake-brief`, `gap-analysis`, `feature-register`, `bao-gia`,
  `change-request-log`, `release-note`, `maintenance-proposal`,
  `role-permission-matrix`, `status-flow`.
- Plus: handover docs + user-guide.

**Internal technical artifacts stay ENGLISH:** SRS, ADR/decisions, code, story,
spec-intake, validation, **playbooks**, `AGENTS.md`, `WORKFLOW.md`,
`TRACE_SPEC.md`. **IDs / paths / code stay EN even inside VN files.**

## When To Fork

- A client-facing deliverable must be in Vietnamese (or another locale). Fork from
  the canonical EN default; never invent a parallel shape.
- Internal automation, IDs, tokens, and file paths stay English so cross-region
  teams can still read and `grep` them.

Do NOT fork: playbooks (agent-facing, stay English); internal operating docs
(`HARNESS.md`, `WORKFLOW.md`, decisions, SRS, story packets).

## Split Rule

| Stays English | Localizes |
|---|---|
| File paths, folder names | Document titles |
| IDs and tokens (`IF.AUTH.01`, `SC-001`, `TC-001`, `CR-01`) | Section headers the client sees |
| Code fences, commands, env var names | Body prose addressed to the client |
| Comments inside code blocks | Table column labels the client sees |
| Internal links (`docs/...`) | Public-facing labels in those links |

Rule of thumb: if a cross-region grep needs to find it, keep it English. If a
client reads it, localize it.

## Fork Directory Pattern

Place locale variants next to defaults:

```text
docs/templates/
├── feature-register.md            # default (English structure)
├── locale-vi/
│   ├── feature-register.md        # Vietnamese titles + body, EN IDs
│   ├── bao-gia.md
│   └── ...
└── locale-ja/                     # only if/when needed
```

The default is the source-of-truth; locale variants may lag during a transition —
note staleness in a header comment:

```markdown
<!-- Synced from ../feature-register.md @ 2026-06-03. Re-sync after default updates. -->
```

## Concrete Example — Vietnamese UAT Snippet

```markdown
<!-- docs/uat/locale-vi fragment -->
# Biên bản kiểm thử nghiệm thu UAT — IF.RBAC

| Mã test | Mô tả | Kết quả mong đợi | Ghi chú |
|---|---|---|---|
| TC-001 | Quản lý cập nhật vai trò thành viên | Vai trò mới được lưu | |
| TC-002 | Thành viên không có quyền không sửa được | Trả về lỗi 403 | |
```

The REQ-ID (`IF.RBAC`), test IDs (`TC-001`), and HTTP status codes stay English
(D3 + D4). The titles, descriptions, and document name localize.

## Anti-Patterns

- **Translating IDs** (e.g. inventing a VN token instead of `TC-001`). Breaks grep
  and cross-region traceability immediately.
- **Forking the whole harness into a locale repo.** Use the `locale-vi/`
  subdirectory — keeps the default in sync, avoids per-locale upgrade pain.
- **Mixing locales inside one file.** One file = one locale. A bilingual table
  looks tidy until a third locale appears. (Exception: the `GLOSSARY.md` term table
  is intentionally bilingual by design — it IS the translation contract.)
- **Translating playbook content.** Playbooks are agent-facing; translating them
  creates dialects an agent cannot cross-reference.

## Variant Tracking

Log shipped locale variants in a single org index (not in the harness, which stays
locale-neutral):

```text
<org-repo>/docs/locales.md
- locale-vi: synced 2026-06-03 with templates/ @ commit abc123
```

The harness never assumes a specific locale list — the org owns its inventory.

## Variant Section

(Append a Variant block here when this pattern fails or partially works. Do not
delete the original split rule.)

## Related

- Locked decision D4 (`docs/HARNESS.md` § Locked Decisions) — the bilingual split this implements.
- `docs/README.md` § Bilingual Surfaces — the harness crosswalk of VN forks.
- `ba-core-doc-bundle.md` — the GLOSSARY VN fork (the bilingual term contract).
- `playbook-composition-pattern.md` — composition rules the client-facing chains
  honor.
