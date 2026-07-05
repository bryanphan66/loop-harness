# Playbook Composition Pattern

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> How to wrap several playbooks into a single meta-playbook when the same sequence
> recurs — and how to recognize when atomic playbooks are clearer than
> composition. Meta — governs how the other playbooks chain.

## Engine

No skill — this is an authoring discipline. `solo-dev-client-delivery.md` is the
one existing meta-playbook in this harness; it honors this pattern.

## When To Compose

Compose into a meta-playbook when ALL three hold:

1. The same 3+ playbooks run in the same order in 2+ projects.
2. The output of one step is the input of the next.
3. Users have shown friction remembering the order (repeated questions, skipped
   steps, mistakes).

If any one is false, keep playbooks atomic. Premature composition hides decision
points and makes failure recovery harder.

## When To Keep Atomic

- Any combination of the steps might run independently.
- Sub-playbooks have separate failure modes the user must triage.
- The "compose" instinct comes from "this looks tidy", not measured friction.

## Hand-Off Contract

Every step in a meta-playbook must declare:

| Field | Purpose |
|---|---|
| Input | What artifact (file path, token, decision slug) the step needs to start. |
| Output | What artifact it produces, named so the next step can grep it. |
| Skip-when | Condition that lets the user skip (e.g. "output < 7 days old, inputs unchanged"). |

Without these three, the meta-playbook is just a checklist — and a checklist hides
which step depends on which.

## Idempotency + Freshness Metadata

For expensive composed steps, emit a sidecar metadata file:

```json
// docs/<artifact-folder>/.meta.json
{ "generated_at": "2026-06-03T12:30:00Z", "generated_by": "<playbook-name>",
  "inputs_hash": "<sha256 of input artifacts>", "version": 1 }
```

Skip-rerun rule: if `.meta.json` age < the playbook-declared TTL (typical 7 days)
AND `inputs_hash` unchanged, skip the rerun and reuse the output. Force a rerun
with `--regenerate` or by deleting `.meta.json`. (Borrowed from `ck-design-system`
freshness checking — prevents wasteful re-runs when nothing upstream changed.)

## Example A — Should Compose

Discovery interview (1.3) → BA core bundle (1.7) → scope baseline (1.9) run in the
same order on every Pre-Build. Each takes the previous output as input. The
**3-macro WORKFLOW.md IS the measured composition** — it is the meta-playbook for
these steps, with `solo-dev-client-delivery.md` as the commercial wrapper. Each
step there already declares Input / Output (the Output-path column) and Gate.

## Example B — Should NOT Compose

`seed-data-pattern.md` and `payment-integration.md` are both Build-stack recipes.
They may or may not co-occur and share no output flow. Keep them atomic. If a user
trips on both in one week, that is two playbook hits, not a composition signal.

## Anti-Patterns

- **Building an aggregator "because it would be tidy"** without measured friction.
  Wait for the third "what is next?" before wrapping.
- **Skipping the hand-off contract** — hides which steps depend on which.
- **Hard-coding sub-playbook order with no skip-when** — forces re-running
  expensive steps every invocation.
- **One giant aggregator wrapping every playbook** — splits the harness into "the
  aggregator and the rest", the opposite of portability (and breaks D1
  independence).

## Next Steps

Do not pre-build new meta-playbooks. `WORKFLOW.md` + `solo-dev-client-delivery.md`
cover the measured composition. New aggregators emerge from real friction — when a
third project asks the same composition question, build it using this pattern and
reference it back here.

## Variant Section

(Append a Variant block here when this pattern fails or partially works. Do not
delete the original rules.)

## Related

- `docs/WORKFLOW.md` — the measured 3-macro composition this pattern governs.
- `solo-dev-client-delivery.md` — the meta-playbook that honors this pattern.
- `bilingual-delivery-template-pattern.md` — the client-facing chains this orders.
- `docs/HARNESS.md` § Independence Principle — why no giant aggregator (D1).
