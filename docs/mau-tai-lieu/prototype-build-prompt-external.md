<!--
TEMPLATE: prototype-build-prompt-external.md — Step 1.12 prompt convention for EXTERNAL design tools
Used by: Designer at step 1.12 when the engine is an external tool (Claude Design / Open Design /
  Google Stitch / Pencil.dev). (For the in-repo "Claude Code + taste skill" path use
  prototype-build-prompt.md instead.) Copied into the bootstrapped project.
Authority: docs/process/WORKFLOW.md 1.12 · docs/process/STAGE_GOALS.md §1.12 (Prompt convention) · ADR prototype-external-design-tool-not-generated.
Bilingual: short prompts are pasted into the tool by the operator — write them in the operator's language.

WHY THIS EXISTS
  The operator ALWAYS attaches the whole source repo to the external design tool. The repo already
  carries the full build spec (prototype-brief.md, screen-inventory.md, tokens, diagrams). So the
  chat prompt must NOT repeat that detail — it is a ONE-LINE POINTER telling the tool to read the
  versioned build-prompt file from the attached repo. Detail lives in the repo and evolves with it;
  the chat never drifts from the docs, and the operator never has to re-derive a long prompt.

CONVENTION
  1) Build instructions are VERSIONED, SELF-CONTAINED files in the repo:
       docs/visuals/prototype/build-prompt-v1-*.md     (round 1)
       docs/visuals/prototype/build-prompt-v2-*.md      (round 2)
       docs/visuals/prototype/build-prompt-v3-*.md       (round 3 …)
       docs/visuals/prototype/build-prompt-v<N>-process-annex.md   (process-review zone mirror)
     Each file holds ONE fenced code block = the actual instructions for the tool.
  2) The chat prompt is the SHORT POINTER below. The operator copy-pastes it, swapping <file>.
  3) "tiếp tục board hiện tại, KHÔNG tạo project mới" keeps each round building on the same board.

Shape-only scaffold. Replace <placeholders>; keep paths stable.
-->

# Prototype Build Prompt — External Tool (short pointer convention)

> Attach the **whole repo** to the design tool, then paste a one-liner. Do **not** paste the detail.

## Ready short prompts (copy-paste)

**Build / update the prototype to the latest round:**
```
Đọc file <docs/visuals/prototype/build-prompt-v<N>-<slug>.md> trong repo đính kèm và thực hiện ĐÚNG khối lệnh trong đó. Tiếp tục từ board "<PRODUCT_NAME>" hiện tại — KHÔNG tạo project mới.
```

**Build round v1 (first build, fresh board is OK):**
```
Đọc file docs/visuals/prototype/build-prompt-v1-<slug>.md trong repo đính kèm và dựng prototype đúng theo khối lệnh trong đó.
```

**Add the process-review zone (mirror of the process diagrams):**
```
Đọc file docs/visuals/prototype/build-prompt-v<N>-process-annex.md trong repo đính kèm và thực hiện đúng khối lệnh. Tiếp tục board hiện tại, chỉ thêm zone "Quy trình (Review)", KHÔNG đụng zone khác.
```

**Two-step (build round + process zone) in one go:**
```
Trong repo đính kèm, đọc và làm tuần tự 2 file — tiếp tục board hiện tại, KHÔNG tạo project mới:
1) docs/visuals/prototype/build-prompt-v<N>-<slug>.md
2) docs/visuals/prototype/build-prompt-v<N>-process-annex.md
Mỗi file tự rà design-system-compliance + báo changelog khi xong.
```

## Reusable pattern

> Đọc `<path-to-file>` trong repo đính kèm và thực hiện đúng khối lệnh, tiếp tục board hiện tại, không tạo project mới.

## Cross-References

- Prompt convention rule: `docs/process/STAGE_GOALS.md` § Step 1.12 · `docs/process/WORKFLOW.md` row 1.12.
- Versioned build-prompt files + per-project ready prompts: `docs/visuals/prototype/README.md` § Build Prompts.
- In-repo taste-skill path (different engine): `docs/mau-tai-lieu/prototype-build-prompt.md`.
