<!--
TEMPLATE: Process Annex (one per project — the client-facing process packet for PB-G3)
Used by: WORKFLOW step 1.13 (review loop + FREEZE). Reviewed WITH the prototype.
Role: Designer + PM · Engine: facilitation (walk the client through the diagrams).
Output path: docs/visuals/prototype/process-annex.md   (lives with the prototype it accompanies).
Bilingual: CLIENT-FACING — write in the client locale (locale-vi for VN clients) per D4.
Authority: docs/process/STAGE_GOALS.md § Step 1.13 (Process-annex rule), docs/gates/pb-g3-prototype-frozen.md.

WHY THIS EXISTS
  A clickable prototype freezes SCREEN STATES, not PROCESS LOGIC. Async/scheduled
  behavior, state machines, branching business rules, and multi-actor hand-offs
  cannot be seen by clicking screens. If the client signs off on screens only,
  that logic escapes the frozen visual contract and surfaces as a dispute at UAT
  — after the price is set. This annex puts the process in front of the client at
  the SAME gate as the prototype (PB-G3), so the whole behavior is frozen together.

WHAT GOES IN IT
  Only PROCESS-COMPLEX features (flagged at 1.11). A feature is process-complex if
  it has ANY of: async/scheduled behavior · a non-trivial state machine ·
  branching business rules (thresholds, scoring) · multi-actor hand-off.
  For each, point the client at the relevant BPMN / status-flow / user-flow
  diagram (locale-vi fork) and walk them through it. Do NOT dump raw swimlanes.

DELIVERY (two modes — pick per client)
  (1) Walkthrough: render the locale-vi Mermaid diagrams to SVG/PNG and screen-share.
  (2) Single-surface: mirror the flows as PRESENTATION-ONLY screens embedded in the
      prototype board (client reviews + comments in one place). The locale-vi Mermaid
      .md stays SOURCE OF TRUTH; the board screens are a mirror and MUST match it at
      freeze. A flow change goes into the .md source first, then re-mirrors to the
      board — never let the board become an independent second source. Mark these as
      CUSTOM presentation screens in screen-inventory (no data grid/form → exempt
      from the §4 floorplan classification).

Shape-only scaffold. Replace <placeholders>; keep IDs/paths/code-fences stable.
-->

# Process Annex — <project name>

**Step:** 1.13 (reviewed with the prototype at PB-G3) · **Date:** YYYY-MM-DD
**Status:** <draft / reviewed / confirmed> · **Prototype version:** <vN>

> Reviewed **together with** the prototype. The prototype freezes the screens;
> this annex freezes the **process behavior** behind them. Both are confirmed at
> PB-G3 (`feedback-final.md`).

---

## Process-Complex Feature Register

Each row is a feature whose behavior the screens cannot fully show. Walk the
client through the named diagram, then record their confirmation.

| FID | Feature | Why process-complex | Diagram (`locale-vi/`) | Confirmed |
|---|---|---|---|---|
| <F-0NN> | <feature> | <async / state-machine / branching / multi-actor> | `diagrams/locale-vi/<file>.md` (<ID>) | y/n |

---

## Walkthrough Notes

Per feature: the 2–3 behaviors to make explicit to the client (timing, state
transitions, branching thresholds, who-does-what hand-offs) — the things a
screenshot hides.

### <F-0NN> — <feature>

- **Behavior to confirm:** <e.g. scan runs as a background job; client is notified when done — not instant>
- **States / branches:** <e.g. queued → running → completed/failed; failed = manual retry only>
- **Diagram ref:** `diagrams/locale-vi/<file>.md` <ID>
- **Client confirmed:** <y/n + date + note>

---

## Confirmation

```text
Process annex confirmed by client:  <name>     on  YYYY-MM-DD
Reviewed alongside prototype:        <vN>
Process-complex features confirmed:  <N / N>   (all rows = y before freeze)
Recorded in:                         docs/visuals/prototype/feedback-final.md
```

> Any process-complex row left unconfirmed **blocks PB-G3**. A behavior the
> client wants changed is **scope drift** → mint a `CR-NN` (the feature-register
> froze at PB-G2), do not edit feature docs inside the loop.

## Cross-References

- Loop spec: `docs/process/STAGE_GOALS.md` § Step 1.13 (Process-annex rule).
- Freeze gate: `docs/gates/pb-g3-prototype-frozen.md`.
- Feedback rounds: `docs/mau-tai-lieu/prototype-feedback-round.md` (Process-Logic Review block).
- Source diagrams: `docs/visuals/diagrams/` (1.11) + `docs/requirements/BPMN_DIAGRAMS.md` (1.7).
