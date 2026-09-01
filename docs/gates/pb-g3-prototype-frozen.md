# Gate PB-G3 — Prototype Frozen

> **Type:** **CLIENT** — pages the client (emit `MANUAL_CHECKPOINT`). The visual
> contract (D2). Clears step 1.13 and the Design Prototype block.
> **Step:** 1.13 (`docs/process/WORKFLOW.md`). **Output:** `docs/visuals/prototype/feedback-final.md`.

PB-G3 freezes the **visual contract** before any price is set. This is the
**PROTOTYPE-THEN-QUOTE invariant**: the bao-gia (1.14) must anchor to a frozen
prototype, the #1 defense against scope dispute. More than two review rounds is a
scope problem, not a design problem.

## Checklist

- [ ] The prototype covers **every in-scope feature-register line** (PB-G2 frozen).
- [ ] Each screen shows ≥1 sample-data state and ≥1 empty/error state.
- [ ] `docs/visuals/prototype/README.md` records the tool, share URL, version, and freeze date.
- [ ] The prototype was built in an **approved external design tool** (Claude Design / Open Design / Google Stitch / Pencil.dev) — **not generated in Claude Code**.
- [ ] Every review round is captured in `docs/visuals/prototype/feedback-*.md`.
- [ ] Each revised round re-passed **`design-system-compliance` + floorplan conformance** before going back to the client (not only checked once at freeze).
- [ ] Any scope drift surfaced in review is logged as a change request (`CR-NN`), **not** silently absorbed into the prototype. A feedback item that changes a **feature's behavior/description** (not just its visual) is scope drift — the feature-register froze at PB-G2.
- [ ] Review rounds ≤ 2; if more, the scope problem is named and routed to a change request before freezing.
- [ ] The role-permission-matrix and status-flow diagrams (1.11) match the frozen screens.
- [ ] **Process-complex features** (async / scheduled / state-machine / branching rules / multi-actor) were **walked through with the client** against their **BPMN / status-flow / user-flow** diagram (the process annex); the client confirmed the **process logic**, not only the screens — recorded in `feedback-final.md`. A clickable prototype freezes screen states, not process behavior; unconfirmed process logic escapes the frozen contract.
- [ ] If the process annex is **mirrored as flow screens on the prototype board** (single-surface review), those board screens **match the `locale-vi/` Mermaid source** (no drift) — the `.md` is canonical; board screens are CUSTOM presentation (exempt from §4 floorplan).
- [ ] `MANUAL_CHECKPOINT` was emitted asking the client to confirm the freeze in writing.
- [ ] `feedback-final.md` records the **written** freeze confirmation referenced below.
- [ ] `STAGE.md` advanced to Current = 1.14 only **after** the written freeze.

## Sign-Off

```text
PB-G3 — prototype frozen
Frozen by client:      <name>           on  YYYY-MM-DD
Written freeze ref:    <email id / PDF path / chat ref>
Countersigned (PM):    <name>           on  YYYY-MM-DD
Prototype URL:         <share link>     version: <vN>
Review rounds:         <count>          (>2 → scope problem; CR refs: <CR-NN…>)
```

> The bao-gia (1.14) cannot start until this sign-off is filled — PROTOTYPE-THEN-QUOTE.
> The next client-paging gate is **PB-G4** (contract + deposit).
