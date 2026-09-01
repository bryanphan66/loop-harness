# Phân tích: Agent Loops — Source Audit & Definition Map

**Nguồn:** agent-loop-source-audit-report.html (1027 dòng)  
**Loại:** Audit đa agent + synthesis  
**Scope:** 45 nguồn tài liệu (vendor docs, framework, paper, grassroots) được verify độc lập  
**Câu hỏi chính:** Field đồng ý định nghĩa "agent loop" không?

---

## Kết luận chính

### Câu trả lời ngắn
> "Across 45 verified sources, there is **NO SINGLE AGREED DEFINITION** of an agent loop."

**2 big vendors + top blogger** hội tụ vào 1 định nghĩa gọn gàng ("LLM using tools in loop"), nhưng bên ngoài đó, định nghĩa **fracture thành 11 distinct camps** bất đồng về:
- Ai sở hữu loop
- Gì là 1 iteration
- Verification có phải named step không
- "Loop" có phải primitive đúng không

---

## 11 "Definition Camps" (cách tiếp cận khác nhau)

### 1. Minimalist 'tools in a loop' (5 src)
**Claim:** LLM calls tools in a loop until goal/task complete. Loop trivial; craft = tools + prompt + stop.

**Đặc thù:** Chính là formal convergence Willison + Anthropic present. NHƯNG swyx quotes nó chỉ để ATTACK ("too minimalist to be useful") - nó là strawman anh cite, không định nghĩa của anh.

### 2. Inner reason-act-observe cycle / ReAct canon (8 src)
**Claim:** Mỗi iteration = reason/think → act (tool/function call) → observe (result) → repeat until done. Reasoning interleaved vs done once up front.

**Đặc thù:** Chỉ formal/academic. ReAct: 'thought' = action in language space, NO observation. Grassroots inner-cycle: Firecrawl reorder to act-observe-reason (loop-engineering framing), SHORT unverified.

### 3. Self-verification loop / same agent checks its own work (2 src)
**Claim:** Loop defining step = agent checks output before continuing: gather-context → act → verify → repeat.

**Đặc thù:** 2 sources, 2 ý khác: Anthropic SDK (general principle), Voyager (narrow code-correctness gate in 4-round refinement).

### 4. Separate-evaluator verification loop (2 src)
**Claim:** Separate evaluator scores generator output; loop re-run với feedback until PASS/threshold. Worker không tự grade.

**Đặc thù:** Evaluator-optimizer; planner-generator-evaluator. Hesamation grassroots speculative: "verification specialist subagent tries to BREAK work" (inference from prompt-read, gated, possibly inactive).

### 5. Runtime/orchestration loop owned by a Runner (4 src)
**Claim:** Loop = runtime primitive owned by Runner/orchestrator, không agent. 1 run = 1 app-level turn: call model → inspect output → branch (run tools / handoff / return final), loop till stop/max_turns.

**Đặc thù:** Handoffs = first-class branch (OpenAI); hard turn ceiling. Entirely formal - zero grassroots frame loop as Runner object.

### 6. Agent-as-decision-loop / plan-act-learn (1 src)
**Claim:** Agent = decision loop toward goal: plan, act, learn (autonomous or human optional). Rest = plumbing.

**Đặc thù:** CHỈ 1 source. Learning = first-class loop step alongside plan+act. "Not just tool use."

### 7. Autonomous goal loop / self-prompting, scheduled, self-terminating (5 src)
**Claim:** Loop runs unattended toward goal: self-prompt or schedule wake, complete cycle, assess vs success criteria, write results, repeat no human re-prompt.

**Đặc thù:** Differentiator = autonomy (vs chatbot). AutoGPT = formal anchor. Grassroots: Huntley "everything ralph loop", HumanLayer literal `while :; do cat PROMPT.md | npx amp; done`. Owain Lewis scheduled manager/worker-over-GitHub-Issues (reported, unverified).

### 8. Loop engineering / design-the-loop-not-the-prompt (5 src)
**Claim:** Stop prompting agent turn-by-turn. Design loop SYSTEM that prompts agent. Human = loop architect; agent externalizes state, runs across sessions.

**Đặc thù:** Frontier grassroots. Steinberger viral 'design loops that prompt agents'; Firecrawl/Osmani quote + build. Firecrawl company-blog tier, không pure grassroots. Anthropic harness: state in git + progress files across windows.

### 9. Cross-trial self-improvement / memory loop (1 src)
**Claim:** Loop spans episodes: act → feedback → verbally-reflect → store to episodic-memory → retry better. Learning via language, không weight updates.

**Đặc thù:** CHỈ 1 source. Loop closes over MULTIPLE trials, persistent episodic buffer = learning substrate.

### 10. 'Loop' is not the right primitive (3 src)
**Claim:** Agent better as component set, không loop; loop = just 1 piece (control flow) or emergent.

**Đặc thù:** swyx consistent: loop = "control-flow piece" của 6-element IMPACT. Autonomous-agents survey: 4-module architecture (profiling/memory/planning/action), never name "agent loop."

### 11. 'Loop' means human oversight / HITL (3 src, terminological trap)
**Claim:** 'Loop' = human-in-the-loop approval (checkpoints, escalation, feedback), không agent cognition loop.

**Đặc thù:** Pure naming collision. Define zero agent loop. These 3 pages use loop for HUMAN approval gates. Word "loop" double-counted as agreement? NO.

---

## 6 Trục bất đồng (Fault Lines)

### Axis 1: Who owns/drives the loop
- **Agent/model drives itself** (4 src) - model is the loop
- **Runner/orchestrator owns** (4 src) - separate runtime object
- **HUMAN designs/owns** (5 src) - loop engineering; agent runs inside

### Axis 2: Is 'verify/evaluate' a named step, and who verifies
- **SAME agent (self-verification)** (2 src)
- **SEPARATE evaluator agent** (3 src)
- **NO explicit verify** (3 src) - reason-act-observe, ends on no tool calls

### Axis 3: What terminates the loop
- **Model decides done / final answer no tool calls** (3 src)
- **Evaluator / self-verification verdict** (3 src)
- **Hard iteration ceiling** (2 src) - max_turns
- **User-defined goal / success criteria self-check** (3 src)
- **NO model-side terminator** (3 src) - runs till operator/schedule/CTRL+C

### Axis 4: Scope of 1 loop iteration
- **1 model call / tool call** (3 src) - fine-grained inner step
- **1 whole session / scheduled wake** (3 src)
- **1 trial/episode, memory to next** (2 src)

### Axis 5: Is 'tools' constitutive
- **Yes** (3 src) - tool use is point
- **No** (3 src) - loop = decision/reflection/learning/orchestration, tools optional

### Axis 6: Is 'loop' even right primitive
- **Yes** (5 src) - agent fundamentally a loop
- **Real but too minimalist** (3 src) - loop just one piece
- **No** (2 src) - static components, loop emergent/unnamed
- **'Loop' = human oversight** (3 src) - HITL, not agent

---

## Invariant Core (what EVERY source agrees)

Khi bỏ disagreement, irreducible core = present nearly every source:

1. **LLM / model as decision-maker** - Every agent-loop source puts language model center driving each iteration. No omit.
   - Grassroots reinforces: Firecrawl "calling model as function", Ralph pipe prompt to agent each pass

2. **Iteration / repetition** - By definition. Every camp = model invoked repeatedly, không once.
   - Grassroots literal: HumanLayer/Huntley bare `while :; do ... done`, Firecrawl "while-loop calling model as function than chatting"

3. **State or feedback carried forward** - Outcome of iteration re-enters context so next step informed.
   - Form varies: observation, tool results, ground truth, episodic-memory reflection, git/progress files, persisted code state
   - Caveat: ReAct 'thought' explicitly yields NO observation → invariant = SOMETHING carries forward, not every action produces environment feedback

4. **Goal or objective the loop works toward** - Nearly every source name goal: task complete, defined objective, success criterion, evaluator PASS. Even maximalist grassroots loops keep one (Huntley "give goal then loop goal").
   - NOTE: "and a stopping condition" = NOT clean invariant (demoted to divergence) → grassroots maximalist loops (Ralph, loop engineering) have NO model-side terminator, run till operator/schedule/CTRL+C
   - So: goal invariant; model-emitted stop NOT invariant

---

## What sticks out (phát hiện nổi bật)

### 1. Frontier grassroots skipped definition, went to loop engineering
Loudest grassroots idea: Steinberger "design loops that prompt agents" (quoted Firecrawl/Osmani). BUT: FRONTIER, không whole grassroots (still contains inner-cycle explainers: Firecrawl, SHORT).

### 2. Minimalist one-liner is PUNCHING BAG not frontier
**BE PRECISE:** swyx QUOTES "agent = llm + tools + loop + goal" from "KISSO opinions going around" to CALL IT "too minimalist." It's strawman he cites, NOT his own bald definition. Formal convergence (Willison, Anthropic) still presents as hard-won consensus.

### 3. Ralph = grassroots reductio ad absurdum
Agent loop = literal infinite shell one-liner: `while :; do cat PROMPT.md | npx --yes @sourcegraph/amp ; done`. Huntley "everything ralph loop." Strip concept to Bash loop + static prompt, openly warn produces "bizarre emergent behavior" if left too long. No formal source would publish that as definition.

### 4. Termination gets distinctly-grassroots answer
Ralph + loop-engineering = no model-side stop. Run unattended till operator/schedule/CTRL+C stops. Why "stopping condition" demoted from invariant to divergence → goal invariant, model-emitted stop NOT.

### 5. 'Who verifies' has speculative adversarial grassroots twist
Hesamation reads Claude Code system prompt = introduces 'verification specialist subagent meant to BREAK work.' Explicitly calls inference (Codex-assisted), gated behind external flags, possibly inactive. "Not intentional nerfing." Treat as speculation, NOT confirmed variant.

### 6. Three sources demote from evidence to anecdote
- **Boris Cherny** ('I don't prompt Claude anymore, I have loops running') = NO primary source, quote inside other blogs
- **Owain Lewis** claims (manager/worker loops over GitHub Issues, 'guardrails = real work,' humans approve every PR) = video NOT re-fetched
- **YouTube Short** definition = only third-party search summary, NOT video

### 7. Biggest gap: literal beginner grassroots ABSENT
Audit searched Reddit/HN hard (r/AI_Agents, r/LocalLLaMA, "agent is just while loop") = ZERO verifiable community posts. Every grassroots source = named practitioner. "Grassroots vs formal" = really "practitioner-influencers vs vendors/academics," NOT "beginners vs experts."

### 8. Runner-owned-loop framing EXCLUSIVELY formal
OpenAI, Google ADK, Bedrock wrap loop in orchestrator object + handoffs + max_turns; NOT ONE grassroots source thinks loop as Runner. Grassroots thinks schedules, shell loops, worktrees.

### 9. Two formal sources reject 'loop' as right primitive
- **swyx:** 6-element IMPACT (loop = just control flow)
- **Autonomous-agents survey:** 4-module architecture, no named loop
Strengthens dissent. NOTE: Lilian Weng planning+memory+tool-use triad + BabyAGI task-queue loop queried but NOT survived verification.

### 10. Even within grassroots: sane middle vs cost skeptic
Rhys Sullivan rejects both "tokenmaxxing inference looping" + "promptchud prompting", lands on loops reproduce real product problems. Osmani "cognitive surrender", Firecrawl cost/comprehension-debt warnings = closest to "when NOT loop" case. But thin (2-3 half-lines) = gap for practitioner briefing.

---

## 45 Verified Sources (Breakdown)

| Loại | Count | Ví dụ |
|------|-------|--------|
| Vendor docs | 15 | Anthropic, OpenAI, Google, AWS, Microsoft |
| Framework docs | 10 | LangChain, CrewAI, Pydantic, smolagents, LlamaIndex |
| Academic paper | 5 | ReAct, Reflexion, Voyager, Autonomous Agents Survey |
| Newsletter | 3 | Simon Willison, swyx/Latent.Space, Addy Osmani |
| Blog | 6 | Firecrawl, HumanLayer, Geoffrey Huntley, Osmani |
| YouTube | 2 | Owain Lewis (complete), YouTube Short (partial) |
| X / Twitter | 4 | Peter Steinberger, swyx, Rhys Sullivan, Hesamation |

**Verification status:**
- Confirmed: 43
- Partial: 2 (YouTube Short = search summary; Owain Lewis video not re-fetched)
- Grassroots count: 9 (YouTube, Reddit/HN, X sources)

---

## The Beginner Framework (built from invariant core only)

### One-liner (từ agreement)
> "An agent loop is an LLM that calls tools, checks the result, and repeats toward a stated goal until it is done or you stop it."

### 6 elements you wire up

1. **The model** - LLM center, decide every pass. Claude Code = Claude reading + choosing action. NOT script steps; model pick.
2. **Tools** - File edit, bash, test-run, search, API. Craft = tools, NOT loop machinery.
3. **Feedback = State** - Tool result → next context. Form: tool result, test fail, notes file, progress file on disk. Long-running → externalize to git.
4. **Goal** - Objective loop targets. "All tests pass" = goal. "Improve code" = NOT.
5. **Verify step** - Agent check work vs goal before repeat: run tests, re-read requirement, confirm change. Anthropic: "most underrated step."
6. **Stop condition** - Goal met (cleanest) + hard ceiling (max passes) + you watching. KHÔNG assume model stops itself.

### Build sequence (7 steps)
1. Pick task = clear right answer (tests pass, format match, no errors)
2. Write goal 1 plain sentence (so Claude know when done)
3. Decide tools + boundaries (scope, no merge/deploy 1st run)
4. Place for state (progress file + git commits)
5. Wire 4-step cycle: gather → act (1 change) → verify → repeat
6. Hard stop before run (all pass OR 10 attempts, whichever first)
7. Run, watch, tighten prompt (fix instructions, not output)

### Common mistakes
- No verify step
- Vague goal (loop wander)
- No stop condition (runaway)
- Too much per pass (thrash vs converge)
- Dangerous tools early (irreversible)
- No saved state (forget + repeat)
- Confuse 2 "loop" meanings (human-in-loop ≠ cognition loop)
- Cognitive surrender (stop reading output)

---

## So sánh & tổng hợp 3 nguồn

### vs GUIDE (Beginner Guide)

**Khớp:**
- **Reason-act-observe + verify:** Both nhấn mạnh verify step = underrated
- **3 mô hình:** Guide vs audit aligned (solo, maker-checker, team)
- **4 loại check:** Guide enumerate Functional/Visual/Judgment/You-decide; audit không categorize, but 'verify' = axis
- **Stop condition:** Both warn "don't trust model stop itself" → hard ceiling
- **State/memory:** Both → externalize state (guide: progress file + git; audit invariant core: "feedback carries forward")
- **Goal + objective:** Both → goal = invariant, KHÔNG "done" auto-stop

**Khác:**
- **Guide:** Tactical (build tonight, 8 principles, do/dont). Accessible. Không mention loop-engineering trend.
- **Audit:** Definitional (11 camps, 6 axes, invariant core). NO pick-1-shape guidance. Grassroots loop-engineering (Steinberger shift) prominent.
- **Guide focused:** Maker-checker = 2-agent qual gate. Audit focused: more on loop ownership (agent vs runner vs human-designed).
- **Guide on verification:** Self + separate both OK (2 camps). Audit expose disagreement: separate evaluator = cleaner (Anthropic, Voyager pattern).

### vs VIDEO TRANSCRIPT (Phước, "99% Mọi Người Hiểu Sai")

**Khớp:**
- **3 phần loop:** Transcript (trigger + action + stop) = guide (reason + act + observe + done-check). trigger = setup, action = core cycle.
- **Reason-act-observe:** Video's "reason, act, observe" = ReAct camp (audit camp 2)
- **2 trụ cột:** Video (Objective + Verification) = invariant core (goal + verify step)
- **Verification = agent self-assess + improve:** Video "tự đánh giá + cải tiến" = guide's verify + loop.
- **Cost/time:** Video (vài chục phút tới giờ, không multi-day loop) = guide's "start small, watch 1st run"
- **3 mô hình:** Video (solo, maker-checker, team + orchestrator) = guide (solo, maker-checker, manager-helpers)

**Khác:**
- **Video focused:** "Meta-agent tự suy luận cần loop nào" = philosophical framing audit expose but guide skip
- **Video example:** Thumbnail 10-ý, chấm, cải, 27 phút = Functional check (guide). 3D plane tự xoay browser = Visual. Tái tạo ảnh code = Functional+Visual.
- **Video warn:** "Đừng tự gõ prompt, thiết kế loop" = Steinberger's loop-engineering (audit camp 8) mà guide NOT emphasize.
- **Video on cân bằng:** "objective + tools + memory + cost" = guide's 8 principles cover, NOT explicitly "balance."

---

## Mâu thuẫn / Alignment xuyên 3 nguồn

### Mâu thuẫn chính

**Verify step = self vs separate**
- **Guide:** Both OK (self, separate). Separate = grader không rubber-stamp maker.
- **Audit camp 3 vs 4:** Split định nghĩa (same agent vs separate). Audit = ambiguous không pick.
- **Video transcript:** Implicit maker-checker (separate verify) từ ví dụ.
- **Resolution:** Guide + video align on **separate > self** (cleaner). Audit just document disagreement.

**Stop condition = model-side vs operator**
- **Guide:** Goal met (model) + hard ceiling (you). Both.
- **Audit invariant:** Goal = invariant. Model-emitted stop = NOT invariant (demoted).
- **Grassroots (Ralph):** NO model-side stop (runs till CTRL+C).
- **Formal (OpenAI, Google):** Hard max_turns baked in.
- **Video:** Implicit "loop till done OR user stop" (không specify who).
- **Resolution:** Real divergence grassroots vs formal. Guide practical middle (both goal + hard max).

**Loop ownership = agent vs human-designed**
- **Guide:** Loop skeleton from guide (4-step cycle) = human-designed structure, agent fill.
- **Audit camp 1-5:** Agent/model drives. Camp 8 (loop engineering): **HUMAN** designs, agent runs inside.
- **Grassroots (Steinberger):** "Design loops that prompt agents" = explicit HUMAN ownership (Audit camp 8).
- **Video:** Implicit human-designed (meta-agent choose loop, or host set objective + verification).
- **Resolution:** Guide align video (human architecture), audit expose Formal (agent autonomy) vs Grassroots (human design) split.

### Alignment xuyên 3 nguồn

**Reason-act-observe = core**
- Guide + Audit + Video = all 3 agree (ReAct shape, inner cycle)
- Video call "3 phần": trigger setup, action = reason-act-observe repeating, stop condition
- Audit invariant core: LLM + iteration + feedback + goal

**Verify step = critical**
- Guide: "most underrated step" (Anthropic quote), separate checker better
- Audit: 3 camps (self, separate, NO explicit) = divergence. But invariant "feedback carries forward" = implicit verify
- Video: Objective + Verification = 2 trụ cột
- **All 3 agree: verify-something = essential**

**Goal = terminus **
- Guide: "done" = machine-checkable (Functional/Visual/Judgment/You-decide)
- Audit: "Goal or objective" = invariant, NOT model-side terminator
- Video: Objective = trụ cột, "tự đánh giá + cải tiến tới khi đạt" (goal-gated)
- **All 3 agree: explicit goal = loop anchor**

**State externalized (long-running)**
- Guide: Progress file + git commits (survive context window)
- Audit invariant: "Feedback carried to next iteration" (form varies, git one way)
- Video: Implicit (mỗi vòng lặp cải tiến = carry state)
- **All 3 agree: multi-turn = externalize state**

**3 mô hình loop**
- All 3 name: solo, maker-checker, team + lead
- No formal disagreement

**Cost / Pragmatism**
- Guide: Start small, watch 1st run, max tries (cap tokens)
- Video: "hầu hết việc = vài chục phút tới giờ, không multi-day" (cost sense)
- Audit: Firecrawl/Osmani warn "cost + comprehension debt"; Rhys "not tokenmaxxing"
- **All 3: loops burn tokens → bounded pragmatism**

---

## Implications cho loop-harness Mode B

### 1. Verify step = load-bearing
- Guide + Audit invariant + Video = all emphasize
- Harness: verify-at-source fail-closed = CORE (Mode B issue-pipeline, 10-state, check each state)
- **Action:** Harness verify stage = non-negotiable (it is, in DoD + gate)

### 2. Separate checker > self-verification
- Guide preference + Video implicit + Audit camp split
- Harness: elearning dogfood = agent-QC (agent) + BA human (human). Hybrid.
- **Action:** Harness separate-agent-QC good; add human gate = stronger (mode B already has)

### 3. State externalization = harness strength
- All 3 sources
- Harness: progress files + git commits after each pass (Anthropic harness-for-long-running model)
- **Action:** Keep this. Verified by 3 independent sources.

### 4. Goal = checkable, not vague
- All 3
- Harness: AC (Acceptance Criteria) = machine-checkable. DoD define clear "xong = cái gì"
- **Action:** Harness DoD + AC practice = aligned (it is)

### 5. Hard stop = real, not trust model
- Guide explicit + Video implicit + Audit grassroots (Ralph) default
- Harness: Max retries in loop, QC gate can reject
- **Action:** Explicit max-attempts in harness loop = good; verify.

### 6. Cost awareness
- All 3: pragmatism, not hype
- Harness: Worker dispatch with token budget. Prompt scoped.
- **Action:** Continue cost-conscious task dispatch.

### 7. Loop ownership = human (harness) designed, agent executed
- Guide implicit + Video implicit + Audit camp 8 (loop engineering)
- Harness: Human architect (Trung) design 10-state issue loop, worker agent execute (Mode B)
- **Action:** Harness already is "design the loop" not "hand-prompt agent" (aligned with frontier grassroots stance)

### 8. Khác biệt: Harness multi-session loop vs single-agent loop
- All 3 sources assume 1 agent per loop (or split agent pair like maker-checker)
- Harness Mode B = orchestrator (Trung/control session) dispatch workers (bg sessions) across multiple repos + state (GitHub Issues + progress files)
- **Action:** Harness loop = LARGER scope than "one agent loop" (it's multi-session, multi-repo orchestration)
- **Implication:** Harness "loop engineering" more advanced than guide/video example (they teach solo/pair; harness = team-over-control-plane)

---

## Unresolved questions (gaps between sources + harness fit)

1. **Multi-context-window loop state = who tracks?** Guide assumes 1 agent + progress file. Harness = control session track N workers. Audit doesn't specify orchestrator role.

2. **Loop termination: operator-driven vs goal-gated?** Grassroots (Ralph) = operator-kill. Formal = goal-check + max_turns. Harness Mode B = both (goal AC + QC gate can stop).

3. **Verification adversarial vs supportive?** Hesamation speculate "verification specialist tries to BREAK work." Guide/Video = verify correctness (supportive). Harness = QC is judgmental but not adversarial (accept or reject, feedback).

4. **Cost budget enforcement = where?** Guide "watch first run + max tries." Harness dispatch = --permission-mode control. But no source explicit on "token budget per loop iteration."

5. **When to re-design the loop itself?** All 3 sources teach loop patterns, not "when to change loop structure mid-run." Harness evolves loop from elearning dogfood; unclear if re-design during run vs after.

---

## Trích dẫn từ audit report

1. "Across the verified sources (34 confirmed/partial formal + grassroots), definitions run on minimal-to-maximal axis." (Short answer intro)

2. "Formal vendor/academic sources still define inner cycle. Loudest grassroots voices shifted to who DESIGNS the loop." (Grassroots vs Textbook callout)

3. "The grassroots cares about throughput, scheduling, worktrees, permissions, token cost." (Grassroots operational focus)

4. "Grassroots foregrounds GUARDRAILS and human approval as real work." (Osmani, Lewis framing)

5. "Ralph is an orchestrator pattern where you allocate array + give goal + loop goal." (Huntley def of Ralph)

6. "while :; do cat PROMPT.md | npx --yes @sourcegraph/amp ; done" (HumanLayer literal shell loop = grassroots reductio)

7. "Every grassroots source = named practitioner. 'Grassroots vs formal' = really 'practitioner-influencers vs vendors/academics.'" (Coverage gap: no beginner community voice)

8. "The loop will happily produce confident, polished, wrong work" (quote audit borrowed from guide)

---

## Phương pháp audit (transparency)

**2-stage multi-agent Opus pipeline:**
1. **Discover** - 11 parallel research agents, each lane: vendor docs, frameworks, papers, practitioners, community, YouTube, X
2. **Extract (maker)** - 1 agent open source, copy exact sentence
3. **Verify (checker)** - separate adversarial agent re-fetch URL, confirm/partial/unverifiable (NOT hidden)
4. **Synthesize** - draft adversarially critiqued, reconciled

**Coverage:**
- 9 lanes returned data (YouTube lane errored 1st pass, recovered backfill; Reddit/HN lane errored backfill)
- First pass capped 36 by source-type priority; backfill re-added YouTube + X
- 2 of 45 rated "partial" (not fully confirmed)
- Zero unverified-but-presented-as-fact

**Key detail:** Maker never grades own work (audit itself practice loop-engineering / maker-checker pattern)
