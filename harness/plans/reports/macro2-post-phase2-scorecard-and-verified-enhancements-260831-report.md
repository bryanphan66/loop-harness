# Macro-2 — scorecard run thật Phase-2 + danh sách enhancement ĐÃ VERIFY (deep-scout)

> 2026-08-31. Nguồn: chạy thật Phase-2 elearning (build 17 issue → agent-QC-thay-human 17/17 → fix 10 fail → 17/17 Ready for Test) + 5 deep-scout audit từng enhancement vs harness thật (chống auditor-bias). CWD harness.

## 1. Điểm tự chấm: ~6.5/10 (cho LÁT đã chạy, không phải cả 2.1-2.13)
Lát chạy = **2.6 build-loop + agent-QC→fix bolt-on**. KHÔNG chạm 2.1-2.5 (greenfield xong đợt trước), 2.7-2.13 (chưa chạy chính thức).
- Detection/gate + agent-QC: 8 — gate CẮN thật (fidelity/i18n/merge-verify bắt lỗi thật; agent-QC bắt 10/17 fail, không rubber-stamp).
- Đóng vòng QC→fix→re-verify: 8 — 17/17 sạch.
- Generation (build đúng lần đầu): 5 — **10/17 fail QC lần đầu** (thiếu AC + hardcode i18n do chép mock prototype).
- Go-live fail-closed (G2): 4 — gh-merge bypass pre-push, không gate server-side.
- Orchestration/ops: 5 — load-thrash 328 (over-dispatch), rebase-treadmill, stale-dist/node_modules, SIGPIPE push.

## 2. Macro-2 chạy theo GATE hay PLAYBOOK
CẢ HAI: **playbook xếp bước** (STAGE_GOALS.md 2.1→2.13, driver `/stage-next` + `/build-phase`, KHÔNG tự-chain) + **gate fail-closed canh cửa** (freeze PB-G2/G3, phase-acceptance 27-leg, lint:gates + verify-gate hook, DoR/DoD). Gate không lái tiến-trình; playbook+người lái, gate chặn bước xấu.

## 3. Enhancement ĐÃ VERIFY (5 scout, có anchor)

### ✅ FIX — CONFIRMED-GAP
1. **G2 server-side gate** [repo-config, cần Trung] — verify-gate = git-hook LOCAL only (bypass qua --no-verify/gh-merge/web-edit); `ci.yml:23-26` cố ý KHÔNG chạy trên `pull_request` → CI post-merge, không gate merge; lint:gates chỉ chạy hook local. Harness đã tự-ghi ops-task `phase-acceptance.md:45-47`. Đóng = branch-protection dev+main + required-check chạy `validate` on pull_request.
2. **AC-completeness gate cơ học** [1 script] — không có script kiểm mỗi AC có test pass; Leg 1 "Functional AC" = prose/[VERIFIER] (`phase-acceptance.md:39,87`), manifest-coverage chỉ REQ→phase. Đúng lỗ làm 10/17 lọt.
3. **Concurrency cap ≤3-4 bg worker** [doc] — không có cap số ở harness (chỉ scope-isolation `AGENTS.md:289-293`; `OPERATING-MODES.md:104` "no budget cap"). Thêm vào AGENTS.md bg-hygiene.
4. **Stale-dist rebuild+prisma sau pull/rebase** [doc] — có ở `AGENTS.md:297` (env-setup) NHƯNG thiếu ở `build-execution.md` playbook. Thêm bước.
5. **Propagate fidelity-gate** [copy] — template (Aug30) < elearning (Aug31): thiếu route-scope `collectScreenTsx` + `JSX_BOUNDARY` generic + self-test rework. GIỮ forbidPatterns (cả 2 vẫn có; phiên này chỉ gỡ seed `tbl` khỏi MAP-data, không gỡ cơ chế).
6. **Gate-registry** [doc] — `gates/README.md:15-24` chỉ liệt process-gate (PB/DoR/fidelity/acceptance/DoD), thiếu 9 mechanical lint:gates + step-guarded + tier. Thêm registry.
7. **merge-verify step có tên** [doc] — chạy fidelity+i18n trước gh-merge; ad-hoc phiên này, chưa doc.
8. **Fix bảng enforcement stale** [doc] — `phase-acceptance.md:35-39` chỉ phân loại leg 1-20, thiếu 21-27.

### 🔄 REFRAME (Mode-B, không phải Macro-2)
- agent-QC-trên-staging-URL = Mode-B staging-QC automation (Frontier-2 `OPERATING-MODES.md:66-70`, dùng `qc-checklist.mjs` + auto-run e2e ở Ready-for-Test→QC). Tweak 2.10 chạy QC trên staging (giờ input = local build `STAGE_GOALS.md:645`).

### ❌ DROP (đã có/chẩn sai — scout cứu khỏi build phantom)
- issue-standard hard-gate @2.3: 2.3 đẻ build-manifest KHÔNG phải GitHub issue; đã có `check-manifest-coverage.mjs` + DoR. new-issue.mjs là Mode-B, đã auto fail-closed sau --create.
- formalize agent-QC thành step Macro-2: ĐÃ CÓ ở 2.6 phase-acceptance (verifier subagent 27-check vs running app) + 2.10 DoD QA.
- 2.13 verify-at-source: ĐỦ (`go-live-deploy-verify.md:46-54,127-137`).
- i18n-gate propagation: ĐÃ xong (template scripts + package.json:15 identical).

## 4. Kế hoạch (bung hết sức)
- **B. Fix**: doc/config/registry/propagate (ctl tự làm) + AC-gate script (worker) ; G2-toggle chờ Trung (repo-settings đội).
- **C. Validate**: chạy 1 lát MỚI (7 sub-issue #1045-1051) qua enhanced pipeline 2.6→2.13(Lite) → chạm bước chưa chạy → chấm lại honest.
- **D. Chốt version** harness + report scorecard mới.

## Unresolved
- Q Trung: propagate #5 GIỮ forbidPatterns (đúng — phiên này chỉ gỡ seed tbl khỏi map, không gỡ cơ chế). Xác nhận.
- G2 branch-protection = repo-admin toggle (cần Trung/PAT); ctl làm được ci.yml + đưa lệnh `gh api` set protection, nhưng bật là hành động outward đội-nhóm.
