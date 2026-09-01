# Patch Extension Protocol

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Non-destructive way for an org or project to inject local extensions into the
> harness's playbooks and templates without forking the whole repo.

## When To Use

- An org needs to add a step, gate, or note to a shipped playbook (regional
  approver, security check, comms channel).
- The change is org-local and should NOT propagate upstream.

Do NOT use this for:

- Changes to operating-contract docs — `AGENTS.md`, `docs/about/HARNESS.md`,
  `docs/process/WORKFLOW.md`, `docs/process/TRACE_SPEC.md`, `docs/process/ROLE_MAP.md`. If you need to
  change them, fork the harness.
- New playbooks. Add new playbook files directly; markers are for amending
  existing ones.

## Marker Syntax

```text
<!-- HARNESS:EXT:START {slug} -->
[any markdown content — appended block]
<!-- HARNESS:EXT:END {slug} -->
```

Rules:

- `{slug}` is kebab-case and unique within the file (e.g. `acme-regional-approver`).
- Both markers must be present. An orphan START or END is invalid.
- Content between markers is the org's; the harness installer must NOT overwrite it.

## Where Markers May Appear

| File path | Patchable? |
|---|---|
| `docs/playbooks/*.md` (except `README.md` and `template.md`) | yes |
| `docs/mau-tai-lieu/**/*.md` | yes |
| `docs/about/HARNESS.md`, `docs/process/WORKFLOW.md`, `docs/process/TRACE_SPEC.md`, `docs/process/ROLE_MAP.md`, `AGENTS.md` | no — fork instead |
| `docs/decisions/*.md` | no — write a new superseding decision |
| `docs/playbooks/README.md` | no — register playbooks by editing the index directly |

## Worked Example

To add an "Acme regional approver" step to the UI design system contract playbook,
append at the end of `docs/playbooks/ui-design-system-contract.md`:

```markdown
<!-- HARNESS:EXT:START acme-regional-approver -->

### Acme Regional Approver Step

Before the verification gate signs off, the EMEA design lead must approve the
contract file via Slack workflow `#design-emea-approval`.

<!-- HARNESS:EXT:END acme-regional-approver -->
```

`scripts/install-harness.sh` preserves `HARNESS:EXT` blocks on re-install /
upgrade. Until that pass is wired, treat the markers as a hand-merge contract: the
maintainer running the installer checks for `HARNESS:EXT` blocks before approving
an override.

## Anti-Patterns

- **Nested markers.** Do not place an `EXT:START` inside another `EXT:START`.
- **Generic slugs** like `extension-1`. Use a descriptive kebab-case slug that
  says who owns it and what it does.
- **Patching operating-model docs.** Fork instead — operating-model dialects break
  cross-team trust and violate the Independence Principle.
- **Markers in the README index.** Edit the index inline, then add the new file.

## Removal

1. Find both markers:
   `grep -A 100 "HARNESS:EXT:START acme-regional-approver" <file>`.
2. Delete everything from START to END inclusive.
3. Commit with a message stating which extension was removed and why.

## Audit

List every active extension:

```bash
grep -rn "HARNESS:EXT:START" docs/playbooks docs/mau-tai-lieu
```

The canonical inventory. A block without a matching END marker is broken — open
the file and fix the pair.

## Related

- `docs/about/HARNESS.md` § Independence Principle — why operating docs are
  fork-not-patch.
- `bilingual-delivery-template-pattern.md` — locale forks (a different fork axis).
- `README.md` § Index — where new playbooks register (no markers).
