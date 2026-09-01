<!--
TEMPLATE: Decision Record (ADR)
Used by: Always-on audit trail — any architecture/behavior/authz/data-ownership/API-shape/validation change. Key uses: ERD-freeze (2.1, SA), stack-selection (2.2, Tech Lead), threat-model (2.2).
Role: SA / Tech Lead / any role making a durable choice · Engine: brainstormer · ck-predict
Output path: docs/decisions/<stable-slug>.md   (SLUG, never a number)
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Naming: filename is a stable kebab-case slug describing the decision, e.g.
  adopt-event-sourcing-for-ledger.md, postgres-over-mongo-for-orders.md,
  use-server-components-by-default.md. Reference decisions BY SLUG elsewhere.
Shape-only scaffold. Replace <placeholders>. Do NOT use a numeric prefix.
-->

# <Decision Title>

Slug: `<stable-kebab-case-slug>` · Date: YYYY-MM-DD

> Referenced elsewhere by **slug**, never by number — plan numbers get renumbered
> and become unresolvable noise; the slug stays stable. State the *why*
> (invariant / trade-off / constraint), not the plan origin.

## Status

Proposed | Accepted | Superseded by `<other-slug>` | Rejected

## Context

What problem, constraint, or ambiguity forced this decision? Cite the REQ-IDs,
NFR, or gate it serves (e.g. "ERD-freeze gate at 2.1 needs entity normalization
settled before code").

## Decision

What did we decide? State it as an invariant a future reader can rely on.

## Alternatives Considered

1. <Alternative> — why not.
2. <Alternative> — why not.

## Consequences

Positive:

- Item.

Trade-offs:

- Item.

## Scope Of Impact

What this touches — so a future reader knows what breaks if it is reversed.

- Architecture / module: <list>
- Affected REQ-IDs: `<MODULE.AREA.NN>` …
- Affected gates: <ERD FROZEN / DoR / SECURITY SIGN-OFF / …>

## Follow-Up

- Item.

---

**Pointers**

- Audit-trail rule: `AGENTS.md` § Task Loop step 6, `docs/process/WORKFLOW.md` § Always-On.
- Trace vs decision: `docs/process/TRACE_SPEC.md` § Detailed Trace ≠ Decision Record.
