# Phân tích: Agent Loops, Made Simple (Beginner Guide)

**Nguồn:** agent-loops-beginner-guide.html (477 dòng)  
**Loại:** Guide cho người mới + scaffold thực hành  
**Đối tượng:** Newbie, người không biết agent loop là gì

---

## Nội dung chính

### Định nghĩa cốt lõi
> "An agent loop is just an AI that **reasons** what to do, **acts**, and **observes** the result, over and over, until the goal is met."

**3 nhịp cơ bản:** reason → act → observe (Lặp lại cho tới khi done)

### Vấn đề không hiểu (Why you're confused)
Bài viết nhận ra: "Mọi người vẽ nó 4 cách khác nhau, nhưng chúng đều là cái giống nhau nhìn từ các góc khác."

**4 cách vẽ phổ biến:**
1. **"Think → Act → See"** (ReAct paper) - cùng 3 bước, tên cũ
2. **"Model uses tools, on repeat"** (Anthropic) - đơn giản nhất
3. **"Runs on its own"** (AutoGPT) - loop không giám sát, chạy tới khi xong hoặc bị dừng
4. **"One boss, many helpers"** (multi-agent) - leader handoff tasks cho sub-agents

**Bộ khung dưới** (skeleton) của tất cả: Reason → Act → Observe → Repeat

---

## Khía cạnh quan trọng nhất: Verify step

Guide nhấn mạnh (section 5: "A loop is only as good as its 'done' check"):
- Loop sẽ tự tin tạo ra code đúng thông thường nhưng SAI nếu không định nghĩa rõ "done" là cái gì
- **2 câu hỏi PHẢI trả lời trước khi build:**
  1. "Done" có nghĩa gì? (Phải kiểm tra được bằng máy, không phải "làm cho tốt")
  2. Kiểm tra bằng cách nào?

### 4 loại kiểm tra (check types)

| Kiểm tra | Định nghĩa | Ví dụ | Độ khó |
|----------|-----------|--------|--------|
| **Functional** | Máy trả lời yes/no không ý kiến | Tests pass, app runs, build compiles | Easiest |
| **Visual** | Cần nhìn thấy để đánh giá | UI, thumbnail, layout | Most agents can do |
| **Judgment** | Cần taste nhưng có checklist | Score vs rubric | Cần agent thứ 2 |
| **You decide** | Không thể đảo ngược / không có rubric | Pause + ask human | Risky steps |

**Insight:** Functional check là easiest; Judgment cần separate agent để không bị rubber-stamp.

---

## 3 mô hình loop (Pick a shape)

### 1. Solo loop
- **Khi:** Bắt đầu từ đây, cover hầu hết công việc
- **Form:** 1 agent chạy loop → reason → act → observe → repeat
- **Ưu:** Easiest build & debug

### 2. Maker → Checker
- **Khi:** Khi chất lượng quan trọng
- **Form:** Maker làm việc, Checker (agent thứ 2) chấm điểm → fix loop
- **Ưu:** Fresh AI grader không tự-stamp công việc của nó

### 3. Manager → Helpers
- **Khi:** Công việc lớn, có thể split
- **Form:** Lead agent chia goal, handoff cho sub-agents song song
- **Ưu:** Parallelization

**Ghi chú:** "Runs on its own" không phải mô hình riêng - nó là BẤT KỲ 3 mô hình nào để lâu không ai giám sát (nhưng cần guardrails mạnh)

---

## 8 nguyên tắc để loop hoạt động thực tế

1. **Checkable goal** - Define "done" rõ ràng (tests pass / under 50 words)
2. **Hard stop** - Max tries / budget / time limit (luôn cần, để loop không chạy mãi)
3. **Good tools** - Actions phải reliable + clear docs
4. **Memory** - Lưu lịch sử nhưng summarize để context không swell
5. **Separate checker** - Generate → judge → fix → repeat (maker không tự chấm)
6. **Plan first?** - Việc lớn multi-step: viết plan trước. Việc nhỏ: skip
7. **Logging** - Lưu mỗi thought/action/result để debug lúc 3 giờ sáng
8. **Cost sense** - Loop burn tokens nhanh. Bắt đầu nhỏ + bounded

**2 cái NÊN + 4 cái KHÔNG:**

NÊN:
- Bắt đầu 1 task nhỏ, repeatable
- "Done" = máy kiểm được
- Luôn set max tries
- Dùng agent thứ 2 để grade

KHÔNG:
- 24/7 swarms của 10 agents prompting 10 agents
- Loop không có stop limit
- Tin "looks done" mà không check thực tế
- Loop 1 task one-off bạn có thể just prompt

---

## Build flow (your first loop tonight)

**Template tối giản:**
```
# Mục tiêu
Here's the task: [FIX THE ONE FAILING TEST IN THIS PROJECT]

# "Done" có nghĩa là
You're done when: [THAT TEST PASSES WHEN YOU RUN THE TEST SUITE]

# Cách kiểm tra
Verify by: [RUNNING THE TESTS AND READING THE OUTPUT]

# Guardrail
Keep going until it passes, [OR STOP AFTER 5 TRIES] and tell me.
```

**7 bước build:**
1. Pick task có right answer (tests pass, format match, no errors)
2. Write goal trong 1 plain sentence (rõ ràng để Claude know khi done)
3. Decide tools + boundaries (scope, không merge/deploy lần đầu)
4. Place to keep state (progress file + git commits để survive past 1 context)
5. Wire 4-step cycle: gather-context → act → verify → repeat (1 change/pass)
6. Hard stop trước run (all tests pass OR 10 attempts, thứ nào ranh giới)
7. Run, watch, tighten prompt (fix instructions, không fix output)

---

## Common mistakes (beginner traps)

1. **No verify step** - Loop acts, never checks, produces garbage confidently
2. **Vague goal** - "Improve the code" → loop không biết lúc nào stop → wander
3. **No stop condition** - Model không always stop itself; set max-attempts + watch
4. **Too much per pass** - Anthropic found "1 feature at a time" critical; thrashing nếu fix all at once
5. **Dangerous tools early** - Merge / delete / deploy lần đầu = irreversible mess (scope perms)
6. **No saved state** - Without progress file + commits, loop past 1 context window forgets + repeats
7. **Confuse 2 meanings "loop"** - Human-in-the-loop (approval gates) ≠ agent cognition loop (HITL guide khác)
8. **Cognitive surrender** - Hand off full control + stop reading output (YOU stay reviewer early)

---

## Thành phần bắt buộc (elements you wire up)

### Model (the decision-maker)
- 1 LLM ở center, decide what to do mỗi pass
- Claude Code native: Claude self-reading + choosing action
- Không script steps; model pick chúng

### Tools (how it acts on world)
- File edit, bash, test-run, search, API call
- Claude Code có built-in (file, bash, web)
- Craft là tools, không loop machinery

### Feedback = State (carried forward)
- Tool result → context of next pass = smarter
- Dạng: tool result in context, failed test, notes file, progress file on disk
- Long-running → externalize to git + progress files (survive past 1 window)

### Goal (what "done" means)
- 1 objective rõ ràng loop target
- "Make all tests pass" = goal. "Improve code" = không phải
- Huntley's ralph pattern vẫn keep: "give it goal, loop goal"

### Verify step (one beginners skip)
- Agent check work vs goal trước lặp tiếp: run tests, re-read requirement, confirm file change
- Claude Code native: gather context → act → verify → repeat
- Anthropic: "verify work" = most underrated step (separates convergence from garbage)

### Stop condition (you control)
- Goal met (tests pass) = cleanest
- Hard ceiling: max passes
- KHÔNG assume model stops itself (Ralph = no model-side stop, runs till kill)

---

## Khi NÀ KHÔNG dùng loop

Từ guide + Anthropic guidance:
- **One-shot hoặc fixed, predictable path** - Single prompt / simple script cheaper + faster + reliable
- **"Done" không checkable** - Không test, không format match, không success criteria → loop drift
- **Irreversible hoặc không review được** - Firecrawl: cost + comprehension debt; Rhys Sullivan: "không tokenmaxx"; KHÔNG afford tokens hoặc KHÔNG review output → skip
- **Tóm tắt:** Loop repetitive, reviewable, high-value tasks với built-in checker. Else: just prompt once.

---

## Trích dẫn đáng lưu

1. "Everyone online means something a little different by 'agent loop.' This is the version that's simple, correct, and something you can build tonight." (Hero)

2. "An agent loop is just an AI that **reasons** what to do, **acts**, and **observes** the result, over and over, until the goal is met." (Hero)

3. "The loop will happily produce confident, polished, **wrong** work and call it finished, unless you tell it exactly what 'done' means and give it a way to check." (Section 5 big idea)

4. "The most underrated step." (Verify, principle 5)

5. "One change per pass is deliberate: Anthropic found 'work on only one feature at a time' was critical for long-running agents." (Step 5)

6. "The loop itself is trivial; your leverage is in clearer instructions, better-scoped tools, and a sharper verify check." (Step 7)

7. "Handing the loop full control and stopping reading the output." (Cognitive surrender warning)

---

## Cấu trúc & tổ chức

**Phần chính:**
1. Hero + định nghĩa
2. "Why confused" - 4 cách vẽ, 1 skeleton
3. Core loop diagram (reason → done? → act → observe → repeat)
4. Decision tree: lặp? → AI check done? → BUILD A LOOP
5. 3 mô hình
6. BIG IDEA: "done" check = mọi thứ
7. 4 loại verify + 2 câu hỏi
8. Build-tonight template
9. 7 bước
10. 8 nguyên tắc
11. Do/Dont checklist
12. Common mistakes

**Điểm mạnh:** Accessibility (cho newbie) + practical template + clear distinctions  
**Điểm yếu:** Không đi sâu vào trade-offs cost, token burn; loop engineering trend (design loop, không hand-prompt) chỉ hint, không develop

---

## Liên hệ với loop-harness Mode B

Harness "the loop" (Mode B) align với guide ở:
- **Objective + Verification trụ cột:** Harness có 10-state issue-pipeline + verify-at-source fail-closed = implement verify step từ guide
- **State externalized:** Harness keep progress files + git commits = external state từ guide
- **Fixed permissions:** Harness worker không merge/deploy = scoped tools từ guide
- **Separate checker:** elearning dogfood: agent-QC + BA human approval = maker-checker pattern từ guide
- **Hard stop:** DoD có AC crisp + max retries = stop condition từ guide
