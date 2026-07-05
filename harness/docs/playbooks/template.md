# Playbook Title

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> One-sentence problem statement an agent can grep for. State which step it owns
> when it maps to one: e.g. "Owns Pre-Build step 1.X."

**Macro-stage / step:** <Pre-Build / Build & Go-live / Post-Build · step N.M, or
"always-on across all three">. **Gate it serves:** <gate name, or "none">.

> **Shape variants** — this is the canonical shape for a **process / workflow**
> playbook (the dominant shape in this harness). Other shapes:
>
> - **Structural framework** (e.g. `ui-design-system-contract.md`) — "When this
>   fits" + "What this means", then a contract skeleton + token taxonomy +
>   verification gate. No Symptoms section.
> - **Surface recipe** — "When this fits" + "When NOT", then numbered patterns +
>   anti-patterns.
> - **Tooling fix** — Symptoms → When This Hits → Root Cause → Fix (copy-pasteable).
>
> Pick the shape matching your purpose. Don't force a fix recipe into a framework.

## Engine

Per D1 (Independence Principle, `docs/HARNESS.md`): name the `ck-*` skill that is
the **fast path** for this playbook, and the **bare-agent fallback** that produces
the same artifact shape. The skill is an accelerator, NEVER a hard requirement.

- **Fast path:** `<ck-skill>` — one line on what it does.
- **Role:** `<SDLC role from docs/ROLE_MAP.md>`. **Bare-agent fallback:** `<global
  agent>` runs the core logic below.

## When To Run

Concrete triggers. Then a "Skip when:" list.

## <Body — pick the shape>

For a process playbook: numbered steps or sections, each with inputs/outputs.
For a framework: contract skeleton + token taxonomy + verification gate.
For a tooling fix: Symptoms → Root Cause → Fix with copy-pasteable commands.

Use the canonical tokens (D3, `docs/TRACE_SPEC.md`): REQ-ID `MODULE.AREA.NN`,
`SC-NNN`, `TC-NNN`, `GAP-NNN`, `CR-NN`. **Never** `US-NNN.REQ-MMM`.

## Per-Tier Application (if applicable)

| Lane | Application |
|---|---|
| Tiny | … |
| Normal | … |
| High-risk | … |

## Hand-Off

What the next step consumes, named so it can grep for it. Cite the gate this feeds.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/WORKFLOW.md` § N.M — the step this playbook owns.
- `docs/TRACE_SPEC.md` — tokens cited here.
- `docs/ROLE_MAP.md` — role + engine binding.
- Adjacent playbooks / decisions.
