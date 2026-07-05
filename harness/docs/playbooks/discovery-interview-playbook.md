# Discovery Interview Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Portable 5-persona × 3-mode interview shape for turning a new spec, change
> request, or brownfield mystery into a **REQ candidate list + decisions log +
> open-questions list** — the raw material the SRS (1.5) and gap analysis (1.4)
> structure. Owns Pre-Build **step 1.3**.

**Macro-stage / step:** Pre-Build · 1.3 (after 1.2 intake brief, before 1.4 gap
analysis). **Output feeds:** gap analysis (1.4) and SRS extraction (1.5).

## Engine

- **Fast path:** `ck-rri` (Reverse Requirements Interview — 5 personas, 3 question
  modes, REQ-ID generation).
- **Role:** BA. **Bare-agent fallback:** the global `researcher` agent runs the
  question bank below and emits the same three artifacts. Per D1 the skill is an
  accelerator, not a requirement.

## When To Run

- Pre-Build spec intake (first buildout from a client-provided spec / lead).
- Change-request analysis (3.5) when the request is ambiguous or under-specified.
- Brownfield onboarding when the code says one thing and the request implies
  another.

Skip when:

- The request is a clear, narrow patch with obvious acceptance.
- The decision is already documented and the work is just executing it.
- A previous interview output is still fresh and inputs unchanged.

## Personas

Five personas cover intent → build → run. Run each at least once.

| Persona | Role | Primary concerns |
|---|---|---|
| End User | Person who interacts with the final surface | Usability, frequency, failure recovery, accessibility |
| BA | Bridge between stakeholder intent and spec | Scope clarity, decision traceability, stakeholder conflict |
| QA | Owner of proof | Acceptance criteria, edge cases, regression surface, test data |
| Developer | Owner of build | Feasibility, integration surface, tech-debt risk, dependency shape |
| Operator | Owner of run | Deploy shape, monitoring, rollback, support load, on-call burden |

Project-specific titles (Product Owner, SRE, Support Engineer) map to the nearest
persona — do not invent new personas inside this playbook.

## Question Modes

Pick mode per question, not per persona. Most sessions interleave all three.

| Mode | Purpose | Signal it captures | Use when |
|---|---|---|---|
| Challenge | Stress-test stated assumptions | What the prompt got wrong or glossed over | The spec sounds tidy — pressure-test it |
| Guided | Walk through known decision points | Coverage of standard checkpoints | Intake type is familiar; fill the form |
| Explore | Uncover unknown unknowns | Topics the prompt never named | Brownfield or vague prompts |

## Question Bank (Persona × Mode)

3-5 starter questions per cell. Adapt wording; keep the shape.

### End User × Challenge
- What happens when the network drops mid-action?
- Who else might hit this surface that the brief did not name?
- What does the user do if the action fails silently?
### End User × Guided
- What is the most common path through this surface?
- What is the most common error the user hits today?
- How often does the user perform this — daily, monthly, once?
### End User × Explore
- What workaround do users invent when the system blocks them?
- What does the user check before starting this flow?
- What other tool is open in the next tab while doing this?
### BA × Challenge
- Which stakeholder benefits most? Which loses something?
- What in the brief is genuinely new vs. restating today's behavior?
- Where do the stakeholders disagree about scope?
### BA × Guided
- What in-scope items belong in this iteration vs. the next?
- Which decisions are already locked? Which are still open?
- What did the previous similar feature teach us?
### BA × Explore
- What success metric will this be judged by?
- What would cause the stakeholder to cancel this work?
- What unrelated initiative will collide with this in 90 days?
### QA × Challenge
- What proof would make us confident this works in production?
- What edge case will the demo skip?
- What regression surface does this touch?
### QA × Guided
- What test data exists today? What needs fabricating?
- Which test lane covers this — unit, integration, E2E, manual?
- Where does proof live after the step closes?
### QA × Explore
- What state combinations are we not currently exercising?
- What environments differ from production in ways that hide bugs?
- What past incident does this remind you of?
### Developer × Challenge
- What does this break that currently works?
- What dependency are we silently assuming is stable?
- What part is feasibly tested locally vs. only in staging?
### Developer × Guided
- What modules / services does this touch?
- What is the migration / rollout sequence?
- What flag, config, or env var gates the change?
### Developer × Explore
- What internal API surface is missing that would make this trivial?
- What refactor is overdue and would help here?
- What unknowns scare you most?
### Operator × Challenge
- What is the rollback path? Is it ever tested?
- What alert fires when this breaks in production?
- What does the on-call runbook say about this surface today?
### Operator × Guided
- What deploys with this — code, schema, infra, config?
- What capacity, quota, or rate-limit assumption does this rely on?
- Who gets paged when this fails?
### Operator × Explore
- What recurring support ticket would this finally close?
- What manual workaround does Ops run today that we could remove?
- What logs or metrics are missing that we would want during incident?

### Conditional probes (D2 — mark N/A by decision if not applicable)

Always ask, in at least one persona pass:

- **Compliance / data-residency / DPA:** does any regulation govern this data?
  Where must it physically live? Is a DPA required?
- **Brownfield / migration:** is this replacing a legacy system? Is data
  migration in scope? What is the cutover risk?

A "no" here is a recorded **N/A-by-decision**, not a silent omission — it shapes
the conditional enterprise gates in Build (2.1b migration, compliance/WCAG).

## Output Shape

Produce three artifacts. Save the summary to
`docs/intake/YYYY-MM-DD-discovery-summary.md`.

1. **REQ candidate list** — markdown table. These become REQ-IDs at SRS
   extraction (1.5); they are *candidates* here, not yet `MODULE.AREA.NN`.

   | Candidate | Description (one line) | Source persona | Confidence |
   |---|---|---|---|
   | RC-001 | <one-line description> | End User | high |
   | RC-002 | <one-line description> | QA | medium |

   The composite **REQ-ID** `MODULE.AREA.NN` (e.g. `IF.AUTH.01`) is minted at 1.5
   when the candidate lands in an SRS module (see `docs/TRACE_SPEC.md`).

2. **Decisions log** — markdown list. Each entry: decision name + 1-line summary
   + link to a draft `docs/decisions/<slug>.md` (stable slug, even if the file
   does not exist yet).

   ```markdown
   - **Role hierarchy model.** Flat roles per company (not nested).
     Draft: `docs/decisions/flat-roles-per-company.md`.
   ```

3. **Open questions list** — questions the session could not resolve. These
   become BLOCKER/IMPORTANT/NICE entries in `CLARIFICATIONS.md` at validate (1.6).

## Stop Condition

End the session when ANY holds:

- 2 consecutive challenge-mode questions produce no new information.
- All 5 personas have ≥1 REQ candidate and ≥1 decisions-log entry.
- The time-box hits: 60-90 min for spec intake; 20-30 min for a change request.

Continuing past stop produces diminishing returns and risks scope inflation.

## Hand-Off

- **REQ candidate list** → gap analysis (1.4) To-Be § 1 + SRS extraction (1.5),
  where candidates become `MODULE.AREA.NN` REQ-IDs.
- **Decisions log** → seeds for `docs/decisions/<slug>.md` files.
- **Open questions list** → `CLARIFICATIONS.md` (1.6) classified
  BLOCKER/IMPORTANT/NICE; cross-project items → harness backlog.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/TRACE_SPEC.md` § Token Types — REQ-ID format the candidates become.
- `docs/WORKFLOW.md` § 1.3 — the step this playbook owns.
- `gap-analysis.md` — consumes the REQ candidate list (1.4).
- `ba-core-doc-bundle.md` — downstream spine the discovery output anchors.
- `scenario-taxonomy-playbook.md` — consumes high-risk REQ-IDs (1.8).
- `docs/ROLE_MAP.md` — BA role + `ck-rri` engine binding.
