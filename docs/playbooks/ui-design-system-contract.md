# UI Design System Contract

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Single living style guide per project. Code is source of truth; markdown is the
> readable contract that keeps tokens, primitives, and composition patterns from
> drifting. Owns Pre-Build **step 1.10** (brand + design tokens, light/dark).
>
> **Tier scope (read first):** this playbook owns **Tier-2 (design tokens)** and
> **Tier-3 (component inventory)**. **Tier-1 (floorplans + screen behavior) lives
> in `docs/design-system/design-rules.md` and is CONSUMED here, not authored
> here.** The contract below pins the Tier-1 version it conforms to; it never
> restates or overrides §4 floorplans / §7 actions / §8 modals / §10 states.
> Precedence: Tier-1 + Tier-2 are authoritative and components conform to them.
> See `design-system-3-tier.md` for the full 3-tier enforcement chain.

**Macro-stage / step:** Pre-Build · 1.10 (first step of BLOCK C, before 1.11
diagrams + 1.12 prototype). **Output:** `docs/design-guidelines.md` + token files
+ `src/components/README.md` (Tier-3 component inventory). **Gate:** Component
Coverage Matrix populated; Tier-1 pinned; `src/components/README.md` exists.

## Engine

- **Fast path:** `ck-brand-guidelines` → `ck-design-system` (expands 3-5 brand
  colors into 50+ semantic HSL tokens; emits `globals.css`,
  `tailwind.config.ts`, `design-tokens.ts`, `components.json` +
  `design-system.md` + sanity preview HTML; light + dark; idempotent). For
  extracting a system from a live site: `ck-extract-design-system`.
- **Role:** Designer. **Bare-agent fallback:** the `ui-ux-designer` agent writes
  the token files + the 12-section contract by hand. Per D1 the skills are
  accelerators, not dependencies.

## When This Fits

Use when ANY holds: project has >1 page or >5 reusable components and consistency
matters; more than one agent/human will touch the UI over time; the surface
includes marketing + app + admin UIs that must share a look.

Skip when: one-off internal tool, throwaway prototype, single-page demo; the
project intentionally has no shared visual identity (CLI, raw API); the stack is
non-visual (worker, library, infra-only).

## What "design system" means here

Three things kept in sync — not a component library product, not Storybook:

1. **Tokens** — color, spacing, radius, shadow, motion, typography. Defined in
   code (CSS vars / theme file / framework token primitive).
2. **Primitives** — the reusable components everything composes from (button,
   input, card, badge, container, section + state layer: modal, toast, spinner).
3. **Composition patterns** — named recipes for recurring surfaces (hero, section
   heading, card grid, closing CTA, page head) as copy-pasteable snippets.

## The Code-is-SoT Rule

**Canonical token values live in code.** Markdown summaries are reference only —
the single most important rule here. Markdown drifts silently; CSS does not. If
the doc disagrees with the CSS, the CSS wins.

```text
src/styles/tokens.<ext>        # ← canonical token values
src/styles/primitives.<ext>    # ← .btn, .card, .badge, .input, .container
src/components/                # ← composed components
src/components/README.md       # ← Tier-3 component inventory (named 1.10 output)
docs/design-guidelines.md      # ← the readable contract, points back to code
```

The doc must open with: "**Canonical values live in `<path>`. This file is
reference only — code wins on conflict.**"

> Flip to markdown-as-SoT only for agent-handoff workflows where the design
> system lives upstream of any single codebase (e.g. Stitch / design-first agents
> shipping to multiple targets). This playbook assumes a codebase where CSS /
> theme files already exist.

## Style Intake — Where the values come from

This playbook defines **structure**. Concrete style values (brand color,
typography, vibe, density) are project decisions humans make before any contract
file is populated. Skip this and the agent invents values (drift) or
re-interviews every session.

### 5 valid sources

| Source | When | Engine | Output |
|---|---|---|---|
| **Live reference URL** | "make it look like X" (real site) | `ck-extract-design-system` | tokens + screenshots + CSS vars from live DOM |
| **Mockup / screenshot** | design-tool export / wireframe / screenshot | `ai-multimodal` (vision) + `frontend-design` | tokens from image, replicated in code |
| **AI design generation** | brief only, no reference | `stitch` | fresh DESIGN.md + Tailwind config from prompt |
| **Interview from library** | "modern SaaS feel" / "professional fintech" | `ui-ux-pro-max` | pick from curated palettes + font pairings + styles |
| **Existing brand assets** | logo + brand book already exist | `ai-multimodal` (extract palette) + `design` (apply) | tokens derived from brand identity |

### Required: persist the decision

Write `docs/decisions/<slug>-design-direction.md` (stable slug, never a number):

```markdown
# Design Direction
- Source: <URL | mockup path | brief text | brand-book.pdf>
- Method: <which of the 5 above>
- Approved by: <human name> · Date: 2026-MM-DD

## Resulting tokens
- Brand primary / secondary, font, radius scale, shadow tint (brand-tinted)

## Why this direction
1-3 sentences.
```

Future sessions read this decision instead of re-interviewing. The contract file's
§1 MUST open with a link to it — the bridge between "why" (decision) and "what"
(contract). If direction changes, write a **superseding** decision; never silently
delete.

## Token Taxonomy (the seven groups)

```text
Brand        primary / primary-hover / secondary / gradient
Surfaces     bg-primary / bg-secondary / bg-tertiary  (+ dark variants)
Text         text-primary / text-secondary / text-muted
Radius       sm / md / lg / xl / 2xl / pill
Shadow       cta / cta-hover / glass / card-hover / modal  ← all brand-tinted
Motion       transition-normal / -smooth / -slow
Font         font-sans (+ font-mono if code surfaces)
```

Brand-tinted shadows over grey: grey reads as "default framework"; a brand-tinted
shadow on every elevated surface is the cheapest move that makes a page feel
intentional.

## Component Coverage Matrix

A production app needs ~90 distinct component types across 11 functional groups
(Actions · Text/Number Inputs · Selection Inputs · Data Display · Feedback ·
Navigation · Overlays · Layout · Media · Forms · Charts). Define them up front —
even as `TODO` stubs — so visual drift does not compound as scope grows.

**Rule:** every component must have an entry in the §Component Inventory before
the design system claims "production-ready". Placeholder `TODO` rows are allowed;
silently-missing rows are not — the gap must be visible. **Two button styles is
the recommended starting cap** (a third is the most common drift trigger).

## Contract File Skeleton (`docs/design-guidelines.md`)

One file per project, under ~500 lines. Open with the **where-to-update routing
table** (the biggest source of drift is people not knowing where to put a change),
then ship all 12 sections even if a section is an "n/a, no dark mode" one-liner:

0. **Tier-1 Pin** — one line recording the `docs/design-system/design-rules.md`
   version this contract conforms to (Tier-1 floorplans/behavior are consumed,
   not authored here). When design-rules.md changes version, re-pin and re-verify
   the component inventory against it.
1. Foundation Files (+ link to the design-direction decision).
2. Token Cheat-Sheet (code is canonical).
3. Component Coverage Matrix (copy verbatim; tick rows as components ship).
4. Color & Contrast Rules (semantic mapping, contrast minimums, shadow-tint rule).
5. Typography Rules (clamp scale; always include subhead — most common skip).
6. Composition Patterns (copy-pasteable hero / section-head / card grid / CTA).
7. Motion Rules (token → duration → curve → use; reduced-motion policy).
8. Component Inventory (file / role / notes; mark load-bearing "do not rename").
9. Adding a New Page (5-6 step recipe).
10. Dark Mode (toggle mechanism; n/a one-liner if light-only).
11. Don'ts (concrete anti-patterns observed in this codebase).
12. Verification (links to visual-diff + structural lint + coverage lint).

## Verification Gate

The contract is met when: the routing table is present at top; the §0 Tier-1 Pin
records the `docs/design-system/design-rules.md` version; all 12 sections exist
(n/a one-liners allowed); `src/components/README.md` (Tier-3 inventory) exists;
every shipped component has a §8 row and a §3 tick; the design-direction decision
is linked from §1; tokens in §2 match the code SoT. This gate is the precondition
the Component Coverage Matrix check in §1.10 reads.

## Hand-Off

- **To 1.11 (diagrams):** the Component Coverage Matrix is the input
  `visual-and-behavioral-modeling.md` sub-step A checks before prototyping.
- **To 1.12 (prototype):** the tokens are the input the **external design tool**
  (Claude Design / Open Design / Google Stitch / Pencil.dev) consumes; the
  prototype must render in the design tokens, not be generated in Claude Code.
- **To 2.6 (build):** `src/components/README.md` (Tier-3 inventory) is the
  reuse-first list the Fullstack Dev consults before coding a screen
  (`build-execution.md`).
- **To 3.1 (handover):** the contract file ships in the handover package.

## Anti-Patterns

- Skipping intake → ad-hoc tokens that drift across sessions.
- Treating intake as a per-session interview → write the decision once, link it.
- Intake without persistence → six months later nobody knows why teal was chosen.
- Multiple design-direction decisions without a superseding chain.
- Grey shadows where brand-tinted is the rule.
- Silently-missing Coverage Matrix rows.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/process/WORKFLOW.md` § 1.10 — the step this playbook owns.
- `docs/design-system/design-rules.md` — Tier-1 floorplans + behavior this
  contract CONSUMES (pinned in §0) and never re-authors.
- `design-system-3-tier.md` — the cross-stage 3-tier enforcement chain; this
  playbook owns the Tier-2/Tier-3 half.
- `visual-and-behavioral-modeling.md` — sub-step A consumer (1.11).
- `solo-dev-client-delivery.md` § 1.10 — caller.
- `docs/decisions/<slug>-design-direction.md` — the persisted style decision.
- `docs/process/ROLE_MAP.md` — Designer role + `ck-design-system` engine binding.
