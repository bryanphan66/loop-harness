# Gate PB-G4 — Contract + Deposit

> **Type:** **CLIENT — the hardest gate** (D2). Pages the client (emit
> `MANUAL_CHECKPOINT`). **The hard "no build code before this" line.** Exits
> Pre-Build. **Step:** 1.15 (`docs/WORKFLOW.md`). **Output:** signed contract +
> deposit record; `docs/ROADMAP.md` skeleton.

PB-G4 is the single line the whole Pre-Build foundation defends: **not one line of
build code is written before the contract is signed and the deposit is received.**

## Checklist

- [ ] The bao-gia (`docs/bao-gia/{01..05}.md` + PDF) is final, and every price line maps to exactly one feature-register row (1.14 gate).
- [ ] The contract draft *generates* real terms — acceptance conditions, IP / source ownership, liability, and **SLA terms** (3.2 depends on the SLA) — not an empty template.
- [ ] PROTOTYPE-THEN-QUOTE held: PB-G3 (prototype frozen) cleared **before** the bao-gia was priced.
- [ ] **Contract signed** by the client — signed copy referenced below.
- [ ] **Deposit received** — payment confirmed and referenced below.
- [ ] `docs/ROADMAP.md` is born from the skeleton: each module mapped to its milestone; dates sourced from the SOW/bao-gia, never invented here.
- [ ] `MANUAL_CHECKPOINT` was emitted asking the client to sign + pay the deposit.
- [ ] **No build code exists** in the repo — verified before clearing (the Pre-Build → Build boundary).
- [ ] `STAGE.md` advanced to Current = Build / 2.1 only **after** both signature and deposit are confirmed.

## Sign-Off

```text
PB-G4 — contract + deposit (EXIT Pre-Build)
Contract signed by:    <client name>    on  YYYY-MM-DD
Signed copy ref:        <PDF path / contract id>
Deposit received:       <amount / %>     on  YYYY-MM-DD   ref: <payment id>
Countersigned (PM):     <name>           on  YYYY-MM-DD
ROADMAP born:           docs/ROADMAP.md  (skeleton vN)
Build authorized:       YES — only after both rows above are filled
```

> This is the gate the human signs in the real world. Until it is filled, the
> agent must refuse to start any Build step. The next client-paging gate is the
> Build **ACCEPTANCE** gate (UAT + sign-off, step 2.12).
