# UX / Product-Logic Red-Team — Admin & Student Portal (Pre-UAT)

## 1. Headline readiness

The portal is **broadly functional but not UAT-clean**, and the module the owner flagged is the weakest link. Core learning, commerce, roles and reporting screens render real data and mostly hold together, but a consistent class of defect runs through the whole app: **controls that are labelled/framed as doing one thing while the code does another** — "required" fields that never validate, "bulk" actions that ignore the selection, `%` KPIs shown 100× too small, and catalog copy that promises knobs the engine never reads.

On the owner's top concern — **Email & Tự động hóa** — the suspicion is correct: the auto-send / drip / default-trigger logic is **half-baked and internally incoherent, not sound.** The trigger catalog advertises per-flow thresholds ("Hoàn thành khóa học ≥N%", "N ngày không học", cart window "đã cấu hình") that **no UI can set and the engine never reads** — `course.completed` is hardwired to 100%, inactivity is a single global 14-day scan, cart is a hardcoded 60 min. Editing a flow's trigger in the canvas **silently desyncs** from what actually fires (only `graph_json` is saved, never `trigger_type`). Recurring triggers have **no once-per-contact cap**, so `user.inactive` re-nudges an idle student roughly daily and `course.completed` re-fires on re-watch → duplicate "congrats" emails. The flagship drip KPI (open/click rate) is displayed **100× wrong**. A `course_progress_pct` condition is **unbuildable** (no course picker) and throws at execution. And customer-facing copy still leaks internal `CR-018 / CR-019 / Phase 1` codes. The bones are there; the trigger/drip logic layer is not trustworthy for a demo without the fixes below.

---

## 2. Email & Tự động hóa (owner's top concern) — ranked

### 🔴 High

**E-H1 · Trigger thresholds are decorative — advertised but unsettable and unread**
`automation-triggers.catalog.ts:44-58` labels triggers "Hoàn thành khóa học (≥N%)", "N ngày không học", cart "khoảng thời gian đã cấu hình". But `create-flow-dialog.tsx:51` hardwires `trigger_config:{}`, `flow-node-editor-panel.tsx:102-120` renders **only** an eventType picker (no %/days/window field), and the matcher `trigger-flows.ts:22-25` keys on `trigger_type` and **never reads `trigger_config`**. Actual behaviour is fixed globals: `learning.service.ts:206-213` emits `course.completed` only at `progressPct>=100`; `inactivity-scan.ts:5,23` uses global `DEFAULT_INACTIVITY_DAYS=14`; `emit-abandoned-cart-triggers.ts:12` uses `CART_ABANDONED_AFTER_MINUTES=60`. An operator building "gửi mail khi đạt ≥80%" silently gets 100%-only. Downstream condition nodes can't rescue it (a `course_progress_pct>=80` predicate is always-true once the trigger already fired at 100%). **Why wrong:** labels state configurability the product does not have — the literal `N` / `≥N%` placeholder tokens ship to admins. **Fix:** either wire trigger-config inputs (percent / days / minutes) that the emit sites + matcher honour, or rewrite the cards to state the fixed values ("Hoàn thành 100%", "14 ngày không học", "60 phút chưa thanh toán") and move real thresholds to condition nodes.

**E-H2 · Changing a flow's trigger in the builder silently desyncs from what fires**
`flow-node-editor-panel.tsx:104-119` lets the author change the trigger node's `eventType` (e.g. `account.registered → order.paid`) and the canvas shows the new event, but `use-automation-builder.ts:173` save persists **only `{ graph_json }`**; `automation.service.ts:87-88` spread-guards `trigger_type` so the engine-authoritative column is untouched. The worker matches on the `trigger_type` **column** (`trigger-flows.ts:23`), so the automation keeps firing on the OLD event while the card (`flow-node-card.tsx:71`) shows NEW and the list (`flow-list-table.tsx:88`) shows OLD. **Why wrong:** data-integrity mismatch — the automation does the opposite of what the admin sees, hit by the natural act of editing a trigger. **Fix:** include `trigger_type` (+`trigger_config`) in the update payload, or force trigger changes through a dedicated control that writes the column.

**E-H3 · Repeatable triggers have no once-per-contact cap → `user.inactive` re-nudges daily**
`inactivity-scan.ts:37-45` re-emits `user.inactive` for every still-idle contact each daily run (dated dedup key resets next day). A one-email "we miss you" flow drives the enrolment to `completed` in the same run (`automation-engine.ts:19,75-78`), and the partial unique index only blocks `active`/`waiting` enrolments (`migration …152000/migration.sql:20-22`), so `trigger-flows.ts:31-45` re-enrols the same idle student the next day, and the next — roughly daily until they return. No UI cooldown/cap exists (`flow-node-editor-panel.tsx:102-120`). **Why wrong:** spammy default with sender-reputation risk — exactly the "half-baked" behaviour flagged. **Fix:** durable "already triggered within cooldown" guard for recurring triggers + an "enrol once per contact" toggle; don't re-fire `user.inactive` until the contact has been active since the last nudge.

**E-H4 · Bulk broadcast to "Tất cả"/"Học viên" sends blind — no count, no confirm**
`use-broadcast-compose.ts:51-67` resolves `recipientCount` only for `segment:` targets → stays `null` for the two largest audiences; `broadcast-compose-page.tsx:86-97` hides the count block when null; `send()` (`:99-110`) calls `sendBulkEmail` directly with no confirm behind the primary "Gửi" button (`:126-130`). One misclick mails the entire user base with zero count feedback. **Internal inconsistency:** the same module gates trivial single-row deletes behind `ConfirmDialog` (`tag/template/flow-list-page.tsx:170-174`). **Fix:** always resolve+show a count (add all/students count endpoint), gate the send behind a confirm echoing audience label + count, disable send until count loads.

**E-H5 · `course_progress_pct` condition is unbuildable — worker throws at execution**
`flow-node-editor-panel.tsx:16,29,207-219` renders the `course_progress_pct` predicate as op+value only — **no courseId input anywhere**, so `config.courseId` is always undefined. Save-time schema is a loose shape check (`automation.dto.ts:22-24`), so it passes. At run time `condition-predicates.ts:55` throws `'course_progress_pct condition requires config.courseId'` inside an uncaught `evaluateCondition` (`automation-engine.ts:59`), failing the job for every enrolled contact → the whole flow breaks with no build-time warning. **Fix:** render a course `SearchableSelect` (persist `config.courseId`) when predicate is `course_progress_pct`, or remove the predicate until wired.

**E-H6 · Drip open/click rate shown 100× wrong**
`automation.service.ts:217-218` returns `openRate`/`clickRate` as a 0..1 fraction; `drip-sequences/[id]/page.tsx:88-89` renders `value={d.stats?.openRate} unit="%"` with no `*100`, and StatCard animates the raw value. A 25% open rate displays **"0.25 %"**. **Why wrong:** every drip's headline engagement KPI is understated 100× on the exact screen the owner is scrutinising. **Fix:** `Math.round(openRate*100)` in the service response (or `*100` in the page), keep the `%` unit.

### 🟠 Medium

**E-M1 · `course.completed` re-fires on re-watch → duplicate congrats email**
`learning.service.ts:206-213` emits inside `if (progressPct>=100)` on *every* `recordProgress`, not the 99→100 transition (unlike `lesson.completed` at `:187` which is guarded by `justCompleted`). The BullMQ idempotency key is evicted after 1h (`queue-factory.ts:18` `removeOnComplete age=3600`), and a completed enrolment no longer blocks re-enrol, so re-opening a finished lesson >1h later re-sends the completion email. The certificate has its own idempotency backstop; the automation email does not. **Fix:** reuse the `justCompleted` guard to gate the emit on the 99→100 transition.

**E-M2 · `email.opened` fires on opening ANY email and can loop on the flow's own sends**
`email-tracking.service.ts:40-61` emits `email.opened` on first open of any tracked email (transactional, unrelated campaigns, and the flow's own send — which carries an open pixel, `send-email-action.ts:70-82`); the matcher ignores `context.campaignId` (`trigger-flows.ts:22-25`) and the editor offers no campaign scope. A natural "open our email → follow-up" flow re-arms whenever the recipient opens the follow-up it sent (after the prior enrolment completes). **Fix:** let the trigger carry a campaign/flow scope (match on `context.campaignId`); exclude opens of automation-generated emails from re-triggering.

**E-M3 · `lesson.completed` & `enrollment.created` are emitted but absent from the catalog → dead events**
`learning.service.ts:189` emits `lesson.completed`; `sepay-confirm.job.ts:148` emits `enrollment.created`; neither is in the 8-event catalog (`automation-triggers.catalog.ts:23-88`), and the builder can only pick catalog triggers, so both match **zero flows forever**. Worse, `enrollment.created` fires only from the SePay worker path — the shared `runOrderPaidSideEffects` (`orders.service.ts:358-372`, used by manual-confirm/free-course) emits only `order.paid`, seeding a latent three-path divergence. **Fix:** add both to the catalog (and wire `enrollment.created` into the shared side-effects so all paid paths emit it), or remove the orphan emits. *(A per-lesson trigger is entirely uncovered: `video.watched` only fires on ≥90% auto-watch of video lessons, so a manually-completed PDF/text lesson has no reachable trigger.)*

**E-M4 · Default onboarding drip's Day-0 "welcome" duplicates the account-creation welcome**
Admin-create path sends `buildWelcomeEmail` **and** emits `account.registered` (`users.service.ts:175-182`); the seeded active drip's first node (`seed-email-automation-flows.ts` `n_day0`, no preceding wait) is a second welcome ("Chào mừng bạn! (Ngày 0)"). Admin-created accounts get **two near-identical welcomes in one request**. *(Scope: admin-created only — self-register OTP and Google OAuth send no system welcome, so those users get one.)* **Fix:** make Day-0 a distinct "getting started" message, or gate system-welcome vs drip so only one fires; reconsider whether admin-created accounts should enter the self-registration drip at all.

**E-M5 · Reordering drip steps produces 0-delay back-to-back sends + a dead trailing wait**
Model invariant is "only the last step has `waitDays=null`". `removeStep`/`addStep` renormalise; `reorderSteps` (`use-drip-detail.ts:87-93`) does **not**. Dragging the last step to the middle → it fires the same day as its new neighbour (two "Ngày 0" badges) while the new last step keeps a stale `waitDays` → a phantom trailing wait the editor can't show (wait field hidden for last step, `drip-step-editor-panel.tsx:148`). Persists on a plain drag-then-Save. **Fix:** re-run the same normalisation as `removeStep`/`addStep` after reorder, or derive the gap purely from slot position so `waitDays` can never desync.

**E-M6 · Wait-days field marked required but silently accepts empty/0 → immediate consecutive send**
`drip-step-editor-panel.tsx:148-165`: `required` renders only an asterisk (`form-field.tsx:43`), Apply is an onClick button (no form submit), `Number(waitDays)||0` coerces '' and '0' to 0 → engine `delay = 0*DAY_MS = 0` (`automation-engine.ts:81-94`), so the next email fires the same instant. **Fix:** enforce ≥1 for non-last steps (block Apply + inline error), default an emptied field back to 1.

**E-M7 · Email step subject marked required but never validated → blank-subject emails ship**
`required` is cosmetic at every layer: FE (`form-field.tsx:41`), Apply unconditional (`drip-step-editor-panel.tsx:158-166`, `flow-node-editor-panel.tsx:158,232`), API graph_json shape-only (`automation.dto.ts:22-29`, `automation.service.ts:82-93`), worker sends inline `{subject:'',html:body}` when subject blank but body present (the both-empty skip at `send-email-action.ts:112-122` doesn't catch it). An activated drip sends real blank-subject email. **Fix:** disable Apply / show error when no template and subject empty; reject activation server-side if any `send_email` node lacks subject+template.

**E-M8 · Two-step save ("Áp dụng" then "Lưu") with no unsaved-changes guard loses edits**
Modal "Áp dụng" (`drip-step-editor-panel.tsx:168`) only mutates in-memory model (`drip-sequences/[id]/page.tsx:108-112`); persistence lives solely in header "Lưu" (`use-drip-detail.ts:129-142`). Add/remove/reorder all stage local state. No dirty indicator, no `beforeunload`/route guard (grep-confirmed absent). After Apply the modal closes and the timeline updates — reinforcing a false "saved" impression — then navigating away silently loses everything. **Fix:** persist on Apply, or mark it as staging + show an unsaved badge + route/beforeunload confirm.

**E-M9 · Cannot activate/pause a drip from the page where you build it; trigger is immutable post-create**
New drips are `draft` (`create-flow-dialog.tsx:53`); the builder header (`drip-sequences/[id]/page.tsx:53-69`) shows a display-only Badge + Add-step + Save and `save()` sends only `{graph_json}` (never status), so activation only exists on the list-row Switch (`flow-list-table.tsx:120-127`) — a different screen. The **trigger** is never surfaced or editable in the drip editor either, so a wrong trigger means delete+recreate (backend already supports the edit via `updateFlowSchema.partial()` — pure UI gap). **Fix:** add Activate/Pause + a trigger picker to the drip detail header so build → go-live completes in one place. *(Same activation/trigger gap exists in the automation canvas: `use-automation-builder.ts:171` also saves only `{graph_json}`.)*

**E-M10 · Template-locked steps display a stale seeded subject that diverges from what sends**
`flow-node-editor-panel.tsx:143-144` seeds `config.subject` once at pick time; the locked field (`:151-153`) and timeline label (`drip-timeline.tsx:87`) render that frozen copy, never refreshed. The actual send (`send-email-action.ts:108-119`) and the Preview dialog (`email-preview-dialog.tsx:44-47`) read the **live** template. Edit the template later → the builder shows the OLD subject while recipients + the in-editor Preview show the NEW one. **Fix:** drive the timeline label + locked subject from the live template (same source as send + preview).

**E-M11 · Broadcast compose preview shows raw `{{first_name}}` tokens, unlike every other preview and the send**
`broadcast-compose-page.tsx:62-66` renders raw `f.html`; the send substitutes per-recipient (`bulk-email.service.ts:122`) and test-send uses a sample. The template builder and drip/flow previews substitute via `EmailPreviewCanvas` (`template-preview-canvas.tsx:18-24`) + a device toggle. Admin proofs a preview that mismatches the outgoing mail. **Fix:** render broadcast preview through `EmailPreviewCanvas`.

**E-M12 · Drip drill-down "Xem tất cả N" lands on the unfiltered global delivery log**
`mail-drilldown-panel.tsx:122-127` links to `/marketing/email-log` with no campaign/flow/node query; `delivery-log-page.tsx:34+` has no `useSearchParams`/campaign filter, so it dumps every send system-wide (with a mismatched larger total) and loses the step context clicked from. **Fix:** pass `?campaign=<flowId>&node=<nodeId>` and pre-filter, or drop the link.

**E-M13 · Drip drill-down open/click/error rates computed over a partial 50-row sample, shown as the step's rates**
`mail-drilldown-panel.tsx:14-32` divides by `rows.length` (page size 50, `use-drip-detail.ts:23,80`) while the header shows `Đã gửi {total}`; for any step >50 recipients the percentages describe only the first page yet read as the true rate. `suppressed` rows count in the denominator but never a numerator, deflating rates. **Fix:** compute from server-side aggregates over the full population (or label "trên N mẫu"), and decide explicitly whether suppressed/pending belong in the denominator.

**E-M14 · Removing a suppression re-enables mail to a bounced/complained address with no confirm**
`suppression-list-page.tsx:134-139` fires `f.remove` on one click; `use-suppression-list.ts:66-73` calls `removeSuppression` directly (success toast only, no confirm, no reason-aware warning). Re-mailing a hard-bounce/complaint address is a sender-reputation/anti-spam risk. The page already tags bounce/complaint as `destructive` badges, so it distinguishes risk but doesn't act on it. **Fix:** confirmation dialog surfacing the suppression reason, stronger wording for bounce/complaint.

**E-M15 · Email performance report shows raw flow UUIDs in the "Chiến dịch" column**
`send-email-action.ts:70-79` logs automation/drip emails with `campaign_id = flowId` (a bare UUID, unprefixed) and `template_id: null`; `email-performance.service.ts:82-89` only rewrites `broadcast:`/`test:` prefixed keys to a subject, so bare UUIDs render verbatim in the table (`email-report-page.tsx:103`) and CSV. The platform's dominant outbound volume shows unreadable UUIDs, defeating the per-campaign table. **Fix:** prefix `flow:<id>` and join `automation_flows` for the name, mirroring the broadcast fallback.

**E-M16 · Internal planning codes leak into customer-facing copy**
`vi.json` subtitle `…walkthrough (CR-018)` and `phase1Notice` `…KHÔNG thuộc Phase 1 (CR-019)` render on `/marketing/automations/triggers` (`triggers/page.tsx:66,100-104`); further `Phase 1`/`CR-019` strings at `vi.json:741,1075-1076,1210-1211`. Reads as leaked dev scaffolding on the owner's priority module. **Fix:** rewrite as plain admin copy, strip all CR/Phase/Sale-Pipeline references.

### 🟡 Low

**E-L1 · Unsubscribed/suppressed contact never exited mid-sequence** — `automation-engine.ts:58-107` advances a globally-suppressed contact through every remaining wait/action, logging `suppressed` at each node with no exit-on-unsubscribe/goal-met (analytics/housekeeping gap; no spam since send is double-gated). Also a `email.opened`-triggered flow that sends email self-perpetuates (open→enrol→send→open…), human-open-gated so slow, not infinite. **Fix:** cancel the enrolment on global suppression; warn in the builder when a flow both triggers on `email.opened` and contains a `send_email`.

**E-L2 · Trigger reference grid hardcodes green "Sẵn sàng" for every card** — `triggers/page.tsx:94-97` renders a success badge unconditionally, ignoring `item.implemented`, while the create-flow picker greys unimplemented as "(sắp có)". All 8 are currently `true` so no live contradiction; latent the moment an `implemented:false` card ships. **Fix:** drive the badge off `item.implemented`.

**E-L3 · Legacy `{{name}}`/`{{email}}` tokens stay literal in the template-builder preview but substitute on send** — `template-preview-canvas.tsx:11-24` samples only the 4 template vars; `merge-vars.ts:50` also substitutes `name`/`email` at send. Author may "fix" a working token. Only reachable via legacy/hand-typed tokens. **Fix:** extend the preview sample map (or drop legacy-token support).

---

## 3. Per-menu findings (deduped, ranked)

### Admin menus

**Đơn hàng — 🟠 Medium** · Bulk "Xuất CSV" ignores selected rows and exports the whole page. The bulk bar shows "{n} đã chọn" but `page.tsx:118-124` passes `data.orders` (up to 25) not `bulkSelect.selected`; select 3, get 25. Certificates' bulk export correctly filters `selectedCerts` (`certificates/page.tsx:97,108`) — internal inconsistency. **Fix:** export only the checked ids, or move the action out of the selection bar.

**Blog — 🟠 Medium** · No admin UI to create/rename/delete blog categories; `createBlogCategory` (`blog-client.ts:150-159`) is dead code, used nowhere. Posts require a category and `create-blog-dialog.tsx:96` disables "Tạo" when `categories.length===0`, so categories exist only via seed and can never be added; on an unseeded env blog is a hard dead-end. Backend `POST /blog-categories` works but is unwired. **Fix:** add a "Tạo danh mục" affordance wired to the existing endpoint (or inline "add new" in the picker).

**Báo cáo → Funnel — 🟠 Medium** · Funnel is conceptually inverted and can show >100%. `funnel.service.ts:40-43` pins "Mua hàng" at 100% as the top, then computes "Ghi danh" as `enrollments/purchases` — enrollments routinely exceed purchases (free/multi-course), so "Ghi danh" commonly reads e.g. "134%"; the bar is clamped (`funnel-report-page.tsx:91`) but the label renders raw (`:97`). Purchase-before-enroll ordering is backwards from an acquisition funnel. **Fix:** order stages as monotonic subsets and compute against the true top, or cap/annotate and rename the widget.

**Thông báo chung — 🟠 Medium** · Broadcast can be published already-expired and the list never shows expiry/expired status. `create-broadcast-dialog.tsx:122-123` accepts a past date (no `min`, no server check — `notifications.dto.ts:35`); `broadcast-table.tsx:61-65` derives the badge from `is_active` only, no `ends_at` column, so an expired banner still reads "Đang hiển thị" while users see nothing (the banner query filters `ends_at`, but bell + email fan-out fire unconditionally at create). Only activate/deactivate, no edit/delete. **Fix:** validate future expiry, add an `ends_at` column + derived "Expired" status, add edit/delete.

**Phân quyền — 🟡 Low** · Role columns are renamed by clicking the header text with no affordance, and roles can't be deleted. `roles/page.tsx:238-251` renders the role name as a bare `<button>` styled as plain text (cursor:pointer only, no pencil/underline/tooltip → undiscoverable, invisible on touch). No `deleteRole` client fn or `@Delete` route exists, so a mistaken role is permanent. **Fix:** visible edit affordance on headers + a guarded delete for roles with no assigned users.

**Cài đặt chung — 🟡 Low** · "Tên công ty" marked required but `save()` (`settings/general/page.tsx:115-132`) validates only email, so an empty legal name (feeds the public footer) persists silently; and `comingSoon`/`homepagePublished` flags (`:199-209`) take the public site down with no confirm (they do require an explicit Save). **Fix:** validate company name non-empty; gate the site-killing flags behind a ConfirmDialog.

**Dashboard — 🟡 Low** · Revenue-trend widget draws a flat baseline chart while its header says "no data". `coo-dashboard-page.tsx:100-109` shows the `chartEmpty` label when `!hasTrend` but still renders `<AreaChart>` below unconditionally, unlike the three sibling widgets that swap to an empty label. **Fix:** gate the AreaChart on `f.hasTrend`.

### Student menus

**Tổng quan học tập — 🟠 Medium** · Completed-course card CTA "Xem chứng chỉ" dumps the student on the certificates list even when no cert exists, and drops the re-watch path. `course-card.tsx:17,23` sets `cardHref='/student/certificates'` unconditionally at 100% — but issuance is async (`learning.service.ts:206-211` only enqueues the PDF job) and conditional (no template → thrown), so a just-finished student can land on an empty certs page. Permanently, the done card no longer carries `learnHref`, so the student loses the obvious way to re-watch. **Fix:** route the completed card to the player (review) by default; surface the certificate as a secondary action only when one is actually issued.

**Tổng quan học tập (resume banner) — 🟡 Low** · `dashboard/page.tsx:78` `resume = enrollments.find(progressPct<100) ?? enrollments[0]` — when all courses are complete the fallback picks a finished course and renders a "Tiếp tục học / Vào học" banner at 100%, an illogical resume prompt; `resumeLessonId` may be null → links to the bare course landing. **Fix:** render the resume banner only when an in-progress enrolment exists; otherwise show a review/discover prompt.

**Học bài (Learn player) — 🟡 Low** · `learn/[courseSlug]/[lessonId]/page.tsx:331-333` calls `router.replace` **in the render body** (React anti-pattern → "Cannot update a component while rendering"), and `:369-372` renders only a `<Skeleton>` when `!activeLesson` with no not-found/empty branch — a zero-lesson course reached via a stale deep-link hangs on a permanent spinner. (Normal stale-lesson nav is handled by the redirect; the empty-course dead-end is rare.) **Fix:** move the redirect into `useEffect`; add an explicit not-found/empty state.

**Hồ sơ + Notifications — 🟡 Low** · The same 3 marketing-email opt-outs (`studyReminder/newCourse/promotion`) appear in both `/student/profile` (`profile-personal-form.tsx:104-116`) and `/student/notifications` (`notifications/page.tsx:110-124`) with identical title/note strings, saved via two different endpoints. Both write the same `notification_preferences` rows (last-write-wins, so no data drift), but two open tabs can show contradictory state until reload, and it reads as two separate controls. Compounded by adjacent route names: `/notifications` = inbox vs `/student/notifications` = preferences. **Fix:** keep the opt-outs in one place (or link profile → notifications); rename the prefs route to `/student/notification-preferences`.

**Hồ sơ / Đơn hàng / Chứng chỉ — 🟡 Low (hygiene)** · Orphaned i18n keys from the tabs→routes refactor (`student.profile.tabs/certs/orders.*`) and unused "coming soon" download strings (`invoiceComingSoon`, `downloadComingSoon`) remain in `vi.json`/`en.json` though the pages now do real downloads — grep-confirmed referenced nowhere. Not user-visible; drift risk. **Fix:** delete the orphaned blocks.

### Cross-cutting

**Toasts — 🟡 Low** · `toaster.tsx:14-19` documents "errors pass `{duration:8000}`", but ~19 of 115 `toast.error` calls omit it (`use-tag-list.ts:97`, `settings/notifications/page.tsx:68`, `student/notifications/page.tsx:77`, `use-template-list-bulk.ts:67,84`) and inherit the 4s success default, so those error messages flash away twice as fast. **Fix:** pass `{duration:8000}` on every `toast.error`, or centralize via a `showError()` wrapper / Sonner per-type default.

---

## 4. Prioritized FIX BACKLOG

### 🚨 Fix before UAT

- [ ] **[Email]** Make trigger thresholds real OR rewrite catalog copy to the fixed values — stop shipping `N`/`≥N%` placeholders (E-H1)
- [ ] **[Email]** Persist `trigger_type`(+`trigger_config`) when the builder's trigger node changes — kill the silent desync (E-H2)
- [ ] **[Email]** Add a once-per-contact cap / cooldown for recurring triggers; stop `user.inactive` daily re-nudges (E-H3)
- [ ] **[Email]** Add a recipient-count + confirm dialog to bulk broadcast for "Tất cả"/"Học viên" (E-H4)
- [ ] **[Email]** Wire a course picker to the `course_progress_pct` condition (or remove the predicate) — it throws today (E-H5)
- [ ] **[Email]** Fix drip open/click rate ×100 display (E-H6)
- [ ] **[Email]** Enforce subject (and non-zero wait-days) validation before Apply/activate — no blank-subject or 0-delay sends (E-M6, E-M7)
- [ ] **[Email]** Gate `course.completed` emit on the 99→100 transition — stop duplicate congrats (E-M1)
- [ ] **[Email]** Renormalise `waitDays` on drip reorder — stop silent schedule corruption (E-M5)
- [ ] **[Email]** Strip `CR-018/CR-019/Phase 1/Sale Pipeline` from customer-facing copy (E-M16)
- [ ] **[Đơn hàng]** Bulk "Xuất CSV" must export the selected rows, not the whole page (Orders-Medium)
- [ ] **[Báo cáo]** Fix funnel >100% labels / inverted ordering (Funnel-Medium)
- [ ] **[Email/Marketing]** Add a confirm (reason-aware) before un-suppressing a bounced/complained address (E-M14)

### 🧹 Polish later

- [ ] **[Email]** Scope `email.opened` to a campaign / exclude automation self-sends (E-M2)
- [ ] **[Email]** Add `lesson.completed`/`enrollment.created` to catalog + fix the paid-path divergence, or remove orphan emits (E-M3)
- [ ] **[Email]** Distinct Day-0 drip message vs account welcome for admin-created accounts (E-M4)
- [ ] **[Email]** Add a dirty-state guard / clarify "Áp dụng" vs "Lưu" (E-M8)
- [ ] **[Email]** Add Activate/Pause + editable trigger to the drip & automation builder headers (E-M9)
- [ ] **[Email]** Drive locked step subject + timeline label from the live template (E-M10)
- [ ] **[Email]** Render broadcast preview through EmailPreviewCanvas with merge-vars + device toggle (E-M11)
- [ ] **[Email]** Filter the drip drill-down "Xem tất cả" link by flow/node (E-M12)
- [ ] **[Email]** Compute drill-down rates over the full population, define the suppressed denominator (E-M13)
- [ ] **[Báo cáo]** Resolve flow UUIDs to flow names in the email report (E-M15)
- [ ] **[Email]** Exit enrolments on global suppression; warn on `email.opened`+`send_email` loops (E-L1)
- [ ] **[Email]** Drive the trigger-grid "Sẵn sàng" badge off `implemented`; cover `{{name}}/{{email}}` in preview (E-L2, E-L3)
- [ ] **[Blog]** Add blog-category management UI (Blog-Medium)
- [ ] **[Thông báo chung]** Validate future expiry, add `ends_at`/Expired status + edit/delete (Notif-Medium)
- [ ] **[Tổng quan học tập]** Completed card → player by default; cert as secondary only when issued (Student-Medium)
- [ ] **[Phân quyền]** Visible role-rename affordance + guarded role delete (Roles-Low)
- [ ] **[Cài đặt chung]** Validate company name; confirm the site-killing flags (Settings-Low)
- [ ] **[Dashboard]** Gate the revenue AreaChart on `hasTrend` (Dashboard-Low)
- [ ] **[Student]** Resume banner only when in-progress; player redirect → `useEffect` + not-found state (Student-Low)
- [ ] **[Student]** Consolidate duplicated marketing-pref switches; rename `/student/notifications` (Student-Low)
- [ ] **[Cross-cutting]** Centralize error-toast duration at 8s; delete orphaned i18n keys (Toast-Low, i18n-Low)

---

## 5. Residual / unresolved questions

1. **Are the "fixed" trigger thresholds intended or a stopgap?** If the product genuinely only supports 100%-completion / 14-day-inactivity / 60-min-cart, the cheap fix is copy (state the real values). If configurable thresholds are a committed feature for UAT, that is a larger engine+UI build (E-H1) — needs an owner call.
2. **Should admin-created accounts enter the self-registration onboarding drip at all?** The duplicate-welcome fix depends on this business decision (E-M4).
3. **Is the funnel meant to be a conversion funnel or an enrollment→completion breakdown?** The fix (reorder vs rename+cap) differs (Funnel).
4. **Are blog categories intended to be admin-managed or a fixed seeded taxonomy?** Determines build-UI vs document-as-fixed (Blog).
5. **Certificate issuance timing** — is there an acceptable async window where "Xem chứng chỉ" legitimately shows empty, or must the CTA be gated on an issued row? (Student-Medium).