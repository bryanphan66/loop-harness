<!--
TEMPLATE: Code Standards (project doc stub)
Used by: WORKFLOW step 2.2 (stack-selection) — populated right after the stack-selection decision lands.
Role: Tech Lead · Engine: ck-tech-design
Output path: docs/code-standards.md  (this stub leaves docs/mau-tai-lieu/ and lands at the docs root)
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Token grammar (D3): commit body cites ≥1 REQ-ID (MODULE.AREA.NN) or SC-NNN. Do NOT use US-NNN.REQ-MMM. Stack authority is a decision BY SLUG.
Shape-only scaffold. Keep it ONE page — long standards docs rot. Replace <placeholders>.
-->

# Code Standards

> Stub. Populated at stack-selection (2.2), right after the stack decision lands.
> Keep it short — long standards docs rot. One page is the target. Once filled,
> this file lives at `docs/code-standards.md`.

## Source-Of-Truth Stack

Authority is the stack-selection decision, referenced **by slug**.

| Item | Choice | Authority |
| --- | --- | --- |
| Runtime / language version | `<e.g. Node.js 22 LTS, Python 3.12, Go 1.23>` | `docs/decisions/<stack-selection-slug>.md` |
| Primary framework | `<e.g. NestJS, FastAPI, Next.js App Router>` | same |
| Package manager | `<e.g. pnpm 9, uv, go modules>` | same |
| Linter | `<e.g. eslint + @typescript-eslint, ruff, golangci-lint>` | — |
| Formatter | `<e.g. prettier, ruff format, gofmt>` | — |
| Type checker | `<e.g. tsc strict, mypy strict, native>` | — |

## File & Folder Naming

- File names: `<kebab-case / snake_case / PascalCase per language ecosystem>`.
- Folder names: `<convention>`.
- Test files: `<*.test.ts / test_*.py / *_test.go>`.
- Stories: FLAT `<module>-NN-<slug>.md` under `docs/stories/`.

## Imports

- Order: `<stdlib → third-party → workspace → local relative>`.
- Absolute path aliases: `<list or "none">`.

## Error Handling

- Boundary parse rule: unknown input → parser → typed DTO → use case.
- Error envelope (HTTP / API): `<shape — e.g. { error: { code, message, details } }>`.
- Logging on error: `<rule — e.g. log at boundary only, never inside domain>`.

## Logging

- Logger: `<library>`.
- Format: single-line JSON; one canonical line per request.
- Audit logs vs application logs: audit is the product record; app log is operational.

## Testing Convention

- Unit framework: `<e.g. vitest, pytest, go test>`.
- Integration: `<framework + fixture strategy>`.
- E2E: `<framework — Playwright / Cypress / Detox>`.
- Coverage target: `<percentage>`. Token-based coverage (every REQ-ID → ≥1 TC-NNN
  in the verification register) is the contract; raw % is informational.

## Commit Message Format

Conventional commits. Body cites ≥1 token (`REQ-ID` = `MODULE.AREA.NN`, or
`SC-NNN`, or `TC-NNN`). No plan-artifact references in the body (no phase
numbers, finding codes).

```text
<type>(<scope>): <subject>

<body — explain WHY; cite at least one REQ-ID / SC-NNN / TC-NNN>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`,
`build`, `ci`.

## Pre-Commit / Verify Gate

- Pre-commit + pre-push run the verify-gate (`scripts/harness-verify-gate.sh`).
- A blocked gate means real work remains — never use `--no-verify` to get past it
  (`AGENTS.md` § Verify Gate — No Bypass).

## Cross-Reference

- Stack authority: `docs/decisions/<stack-selection-slug>.md` (2.2).
- Token grammar: `docs/process/TRACE_SPEC.md`.
- Verify-gate: `scripts/harness-verify-gate.sh`.
