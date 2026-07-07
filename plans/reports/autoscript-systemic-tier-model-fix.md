# auto-script — systemic AI-gen tier-model fix

Date: 2026-07-07 (Asia/Saigon) · Worktree `.claude/worktrees/macro2-build` (branch `worktree-macro2-build`) · Commit `79483a7` · STAGE.md unchanged (Build 2.12).

## Problem
Prior leg patched only script-gen. Every OTHER AI-gen entrypoint still defaulted to a pro-only model (`claude-sonnet-4-6`). Real log: `brand_gen job failed — Mô hình claude-sonnet-4-6 yêu cầu gói pro trở lên. Gói basic có thể dùng deepseek-chat.` → basic-tier operator could NOT create a Brand Blueprint, and the brand tray swallowed the real cause into the generic `đã có lỗi xảy ra`.

## Root cause (single chokepoint)
`AiAdapterService.complete()` resolved `modelId = request.modelId ?? OPERATION_DEFAULT_MODEL[op]` then threw `AiModelTierError` whenever the model exceeded the tier — with NO distinction between an explicit user pick and an operation default. `brand_blueprint` defaults to `claude-sonnet-4-6` (pro) and has NO picker → always failed on basic.

## Every AI-gen entrypoint audited (grep `AiAdapterService.complete`)
| Entrypoint | Operation | Default model | Picker? | Status before | Fix |
|---|---|---|---|---|---|
| BrandWorker create (`brand-worker.service.ts:98`) | `brand_blueprint` | claude-sonnet-4-6 (pro) | none | **FAILED on basic** | auto-fallback → deepseek-chat |
| BrandWorker regenerate (`:152`) | `brand_blueprint` | claude-sonnet-4-6 (pro) | none | **FAILED on basic** | auto-fallback → deepseek-chat |
| IdeaWorker (`idea-worker.service.ts:89`) | `idea_gen` | gpt-4o-mini (basic) | none | OK (already basic) | now fallback-eligible (systemic) |
| IdeaWorker summary (`:78`) | `transcript_summary` | gpt-4o-mini (basic) | none | OK | now fallback-eligible |
| ScriptWorker (`script-worker.service.ts:241`) | `script_gen` | claude-sonnet-4-6 (pro) | **yes** (dialog sends tier-valid modelId) | OK (fixed prior leg) | unchanged — strict on explicit pick |
| Chat (`chat.service.ts:91`) | `chat` | gpt-4o-mini (basic) | **yes** (tier-filtered list, default undefined) | OK | unchanged — picker only shows tier-valid; errors surfaced via `toChatHttpException` |
| Chat summary (`chat.service.ts:166`) | `transcript_summary` | gpt-4o-mini (basic) | none | OK | now fallback-eligible |
| BrandAutofill (`brand-autofill.service.ts:148`) | `ikigai_autofill` | gpt-4o-mini (basic) | none | OK (was already fine) | now fallback-eligible |

## Fix — centralized, DRY, systemic (no whack-a-mole)
1. **`ai-operations.ts`** — new `AUTO_MODEL_FALLBACK_OPERATIONS` set: the fully-automated, no-picker ops (`brand_blueprint`, `idea_gen`, `transcript_summary`, `ikigai_autofill`). Picker ops (`script_gen`, `chat`) deliberately excluded.
2. **`ai-adapter.service.ts`** — one new private `resolveTierValidModel(requested, tier, operation, explicitModelId)`, called by `complete()`. The SINGLE place tier reconciliation happens:
   - tier already unlocks requested model → use it;
   - locked + **explicit user pick** (or tier unlocks no model at all) → throw `AiModelTierError` (never silently swap a chosen model — AI.MODEL.03 strict for pickers);
   - locked + **no-picker default** of a fallback-eligible op → downgrade to `getHighestAvailable(tier)` (basic → `deepseek-chat`) so the job RUNS.
3. **`brand-worker.service.ts`** — catch now surfaces `userFacingAiErrorMessage(error)` (the shared helper the script/idea workers already use) into `jobs.result.errorMessage`, keeping the existing `BadRequestException` path. Ends the generic-swallow. (Brand tray already renders `errorMessage`; idea/script already surfaced; chat already surfaces via HTTP.)

LOCKED prompts (SPEC 05.B.8/9 = P13/P14 brand + idea) untouched — only model/transport resolution changed. 17 prompt snapshot tests pass.

## Validation (all green)
- `pnpm validate:quick` (lint + typecheck, all 4 packages): clean.
- API unit: **176/176**, **17/17 snapshots**. New adapter unit tests: no-picker default falls back to tier-valid; explicit locked pick still throws; no-accessible-model still throws.
- E2E `ai-adapter`: **11/11**, incl. new `basic-tier brand_blueprint runs on deepseek-chat instead of failing`. `brand-blueprint` **12/12**, `idea-generation` + `chat` pass. (One cross-suite OAuth-mock flake `BRAND.IKIGAI.02` when running 3 suites together — pre-existing, unrelated to this change; brand suite is 12/12 in isolation.)
- Full pre-commit verify gate (lint+typecheck+test+build across all packages + design-system classify): passed.

## Live smoke — basic tier, real API tokens (Dokploy redeploy of `79483a7`)
Redeployed via Dokploy API (`compose.deploy`, id `EBvEqNSqJES3xRjhyQB_S`) through the SSH tunnel; api container recreated, booted clean (`API listening on :3201`), providers all `*_MODE=live` → `https://omniroute.reno.ai.vn/v1`. Drove a fresh **basic-tier** owner (sees only `deepseek-chat` + `gpt-4o-mini`, no claude) end-to-end against the live API. Evidence: `assets/autoscript-basic-tier-smoke-260707.json`.

- **Brand Blueprint** (the exact reported failure): job **completed**, `errorMessage: null`, `modelUsed: deepseek-chat`, `providerStatus: 200`, real 2818-char VI blueprint (niche/avatar/positioning). ✅ Was failing before.
- **Idea**: job **completed**, `errorMessage: null`, `modelUsed: gpt-4o-mini`, `providerStatus: 200`, real 3085-char content. ✅

## Hard-rule compliance
Worked in the existing worktree; secrets stayed in `~/.secrets` (never in git); verify-gate not bypassed; STAGE.md still 2.12; no other project's containers touched; no mid-task questions.

## Unresolved questions
None.
