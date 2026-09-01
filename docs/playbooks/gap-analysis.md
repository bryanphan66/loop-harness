# Gap Analysis Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> BA technique. Compare the client's current state (As-Is) to the desired future
> state (To-Be), structure the gaps, propose solutions. Mints **GAP-NNN** — the
> first token in the trace chain. Owns Pre-Build **step 1.4**.

**Macro-stage / step:** Pre-Build · 1.4 (after 1.3 discovery, before 1.5 SRS).
**Output feeds:** SRS REQ-ID rationale (1.5) + RTM backward link (1.7) +
feature-register scope decisions (1.9).

## Engine

- **No ck-skill owns gap analysis — this is a manual BA technique** run by the
  `researcher` agent against the discovery summary. `ck-xre VALIDATE` can surface
  missing-NFR / inconsistency gaps as a cross-check, but the As-Is/To-Be
  comparison and MoSCoW call are human/agent judgment.
- **Role:** BA. **Output:** `docs/requirements/gap-analysis.md` (`locale-vi/`
  fork — client-facing per D4).

## Why This Playbook Exists

Without structured gap analysis:

- Scope creeps. Client adds "small" requests post-contract because the brief never
  enumerated what was OUT.
- Solutions are speculative — features built for a To-Be nobody validated.
- MoSCoW priority is opinion, not analysis.
- The SRS starts from a blank page with no gap-to-requirement mapping.

With it:

- Each in-scope feature traces to a **GAP-NNN**, which traces to a specific As-Is
  pain or To-Be metric → and forward to a REQ-ID (the RTM backward link).
- Out-of-scope is documented WITH REASON, defending the bao-gia in future disputes.
- Risks and open questions surface **before** pricing.

## When To Run

- **Primary:** Pre-Build step 1.4, after the discovery interview (1.3) surfaced
  the REQ-candidate list and decisions log.
- **Secondary:** mid-project, when a change request (CR-NN) touches multiple areas
  and the team must re-baseline.

Skip when:

- Greenfield with no prior system or process — there is no As-Is. Skip step 2;
  build To-Be directly from the spec, and mark REQ-IDs "no-gap — new feature" in
  the RTM.
- Pure refactor / migration with no business-process change — As-Is and To-Be are
  technical, not behavioral. Document in a `docs/decisions/<slug>.md` instead.

## Inputs

1. `docs/intake/YYYY-MM-DD-discovery-summary.md` — REQ candidates (1.3).
2. `docs/intake/…-intake-brief.md` — stated business problem + project type (1.2).
3. `docs/discovery/*` — raw inputs (meeting notes, screenshots, sample data).
4. Any prior gap analysis from a previous phase, if mid-project.

If any input is missing, **pause and gather** — gap analysis on incomplete inputs
produces speculative gaps.

## The 4 Steps

### Step 1 — Define Future State (To-Be)

Make the target unambiguous. Restate the intake-brief business goals in measurable
form. Outputs (§ 1 of the artifact):

- Business goals (one-line, measurable where possible).
- Success metrics: baseline + target + measurement window.
- Target users × target actions table.
- Constraints (deadline, budget, regulatory, existing-systems-must-keep-running).

Time-box 30 min. If To-Be is fuzzy after 30 min, escalate to the client — do NOT
guess.

### Step 2 — Assess Current State (As-Is)

Map what exists today (the step solo devs skip and regret). Sources:

- Discovery notes (`docs/discovery/`) — process descriptions, tool names, pains.
- Existing system access — log into the client's current tool, walk one full
  workflow end-to-end.
- Stakeholder roles in As-Is — who does what today.
- Workarounds users invent — the gap between intended and actual use.

Outputs (§ 2): existing process map (numbered) · existing-systems table (system ×
purpose × owner × integrates × pain) · pain-points table with verbatim citations
from `docs/discovery/` · workarounds list · stakeholder × responsibility table.

Time-box 60-90 min (medium); 4-8 hours over sessions for multi-stakeholder
enterprise.

### Step 3 — Identify the Gap

Compare § 1 and § 2 dimension-by-dimension. Categorize each gap into one of six
classes:

1. **Functional** (features missing).
2. **Process** (workflows missing or broken).
3. **Technology** (systems not integrated).
4. **Data** (data not captured or not accessible).
5. **Role / skill** (people without access or training).
6. **Compliance** (regulation not met).

Each gap gets a **GAP-NNN** token (`GAP-001`, `GAP-002`, … — global
zero-padded counter per `docs/about/TRACE_SPEC.md`). The token traces forward when
REQ-IDs are written at 1.5 and lands in the RTM backward column at 1.7.

Severity: **High** (blocks To-Be vision OR regulatory) · **Medium** (blocks a goal
but a workaround exists) · **Low** (nice-to-have). Re-read each gap once before
stamping High.

### Step 4 — Propose Solutions (Plan of Action)

Each gap gets a solution row: solution shape · owner (vendor / client / both) ·
effort (XS / S / M / L / XL) · MoSCoW priority · linked feature candidate · "In
scope?" disposition.

MoSCoW rules:

- **Must** = goes into the feature register in-scope no matter what. Cutting a
  Must means renegotiating the To-Be vision.
- **Should** = in-scope if budget/time allow; else phase 1.5 / phase 2.
- **Could** = default out-of-scope; document as a phase-2 candidate.
- **Won't** = explicit reject for this project → `docs/decisions/<slug>.md` with
  reason.

Force the "In scope?" answer (yes / no / partial) for every row — the single most
useful column for the feature-register freeze (PB-G2).

Time-box 60-90 min for the Plan of Action table.

## Output

Save to `docs/requirements/gap-analysis.md`, with a `locale-vi/` fork when the
client reads it directly (D4). Even when the client never reads it, the
feature-register in-scope list derives from § 4 of this artifact — the audit trail
must hold.

## Integration Rules

**Upstream:** discovery REQ candidates → To-Be § 1 · intake-brief business
problem → To-Be § 1 · raw discovery → As-Is § 2.

**Downstream:** feature-register in-scope = all Must + selected Should · feature
register out-of-scope = all Could + Should-not-in-scope + Won't · SRS REQ-IDs
trace back to GAP-NNN (RTM backward) · BPMN As-Is references § 2 process map ·
handover history includes this artifact.

## Anti-Patterns

- **Only To-Be, no As-Is.** The most common failure — without As-Is you have a
  wishlist, not a gap. Forbid 1.4 → 1.5 hand-off if § 2 is empty (unless
  greenfield, recorded as such).
- **Gap too large for MVP.** Don't paper over — escalate, propose a phase split,
  re-baseline.
- **MoSCoW by vote.** Priority is gap severity + business value, not volume in the
  room. High severity = Must by default; exceptions need a one-line reason.
- **Skipping the Owner column.** Misses that the client must do training, content
  prep, credential provisioning.
- **No "In scope?" disposition.** "TBD" = the scope debate happens with no anchor.
- **Gap-analysis as discovery-summary v2.** Discovery lists what the client said;
  gap analysis says what it means.
- **Frozen too early.** Iterate ≥1 round with the client (round-1 draft → review →
  round-2 → freeze, max 2 rounds) before PB-G2.

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny | Skip. Inline narrative in the intake brief is sufficient. |
| Normal | Required when the client has any existing system or process being replaced or integrated with. |
| High-risk | Required + a stakeholder validation round (artifact read aloud with the client, edits captured live). |

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/about/TRACE_SPEC.md` § Token Types — GAP-NNN format + chain position.
- `docs/process/WORKFLOW.md` § 1.4 — the step this playbook owns.
- `discovery-interview-playbook.md` — produces the REQ candidates this consumes.
- `ba-core-doc-bundle.md` — RTM backward column links REQ-ID → GAP-NNN.
- `bilingual-delivery-template-pattern.md` — the `locale-vi/` fork pattern (D4).
- `docs/about/ROLE_MAP.md` — BA role + `researcher` engine binding.
