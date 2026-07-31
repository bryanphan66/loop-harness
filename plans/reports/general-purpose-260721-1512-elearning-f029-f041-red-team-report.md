# Red-team AC verify — elearning F-029..F-041 (branch videcode-build)

Method: each AC assumed NOT met, hunted code to prove it. Repo `/home/trung/Desktop/Workspace/elearning-platform`. Read-only.

## F-029 In-app notif + banner
| AC | Verdict | Evidence |
|--|--|--|
| 1 two independent emitters (in-app + email), one failing ≠ block other | PASS | `notifications.service.ts:88` in-app `createMany` then email `queue.enqueue` (async) — independent paths |
| 2 NotificationLog readAt null→set, unread badge drops | PASS | `notifications.service.ts:34-66` listMine counts `read_at:null`; markRead sets `read_at` |
| 3 banner title/body/cta/severity(info/important/critical), important shows right | PASS | dto `BANNER_SEVERITIES` `notifications.dto.ts:8`; `global-banners.tsx:10-13` severity→variant |
| 4 banner only in active window | PASS | `notifications.service.ts` activeBanners filters starts_at≤now, ends_at≥now |
| 5 dismiss persists across reload | PASS | dismissBanner upserts `banner_dismissals`; activeBanners `none` filter |

## F-030 Bulk email (+pause/resume)
| AC | Verdict | Evidence |
|--|--|--|
| 1 WYSIWYG compose, embedded img on R2 by URL, CTA | **PARTIAL** | body is raw-HTML `<Textarea>` `broadcast-compose-page.tsx:78` — NO WYSIWYG editor, no integrated R2 image upload in bulk compose (preview renders HTML) |
| 2 placeholders from allowlist + HTML-escape values | PASS | `merge-vars.ts:50` fixed MERGE_VARS allowlist; `:83` escapeHtml each value; unknown tokens untouched |
| 3 preview w/ sample vars + test-send-to-self | PASS | EmailPreviewCanvas `broadcast-compose-page.tsx:96`; testEmail path `bulk-email.service.ts:38` |
| 4 send to group, pause/resume no re-send-sent, resend failed only | PASS | pause queued→paused, resume paused only `bulk-batch-control.service.ts`; resend RESENDABLE `delivery-log.service.ts:5` |
| 5 EA blocklist excluded from all bulk | PASS | resolveRecipients `email:{notIn suppressed}` `bulk-email.service.ts:resolveRecipients` |

## F-031 Email log + resend
| AC | Verdict | Evidence |
|--|--|--|
| 1 single emitter default SES, queued in background | PASS | `mail.service.ts` sole facade→queue; `create-mail-sender.ts` SES driver (falls back SMTP if no creds) |
| 2 log row per send w/ status/attempt/providerMsgId/lastError, filter by status | PASS | `email-dispatch-log-writer.ts` writes provider_msg_id/attempt_count; delivery-log list filters status |
| 3 auto-retry while attempts<3, increasing backoff | **PARTIAL** | retry+exp-backoff real, but cap = queue default **5** (`queue-factory.ts:16 attempts:5`), not <3. Email enqueue sets no `attempts` override |
| 4 after 3rd fail → permanently_failed, resend-only | **PARTIAL** | mechanism correct (`email-dispatch.job.ts:45` isFinalAttempt→permanently_failed) but fires on attempt **5**, not 3 |
| 5 no email without a log row (no fire-and-forget) | **PARTIAL** | bulk always logs; **transactional** sends via `mail.service.ts:23` enqueue with NO dispatchLogId → no email_dispatch_logs row |

## F-032 Broadcast + opt-out
| AC | Verdict | Evidence |
|--|--|--|
| 1 broadcast to all via banner, recipient count shown BEFORE send, revoke removes for all | **PARTIAL** | fan-out + revoke (is_active flip) work; but banner-broadcast dialog `create-broadcast-dialog.tsx` shows count only AFTER publish (toast res.inAppCount), no pre-send active-account count |
| 2 broadcast also into each in-app channel | PASS | `notifications.service.ts:88` createMany in_app for all recipients |
| 3 mute email category → in-app still, email skipped | PASS | `notifications.service.ts:` email skips muted, in-app unconditional |
| 4 unmute → restore email next event | PASS | updatePrefs sets email_muted false, deleted_at null |
| 5 transactional (order/invoice/cert/OTP/security) always sent regardless prefs | PASS | prefs only gate broadcast marketing; transactional via mail.service never checks prefs |

## F-033 COO dashboard
| AC | Verdict | Evidence |
|--|--|--|
| 1 KPI: revenue today/month/total, new students today/month, orders today | **FAIL** | `overview.service.ts:getKpis` returns revenueMonth, newStudents(month), completionRate, certificates — no today, no total, no orders-today; extra completion/cert tiles not in AC |
| 2 60s freshness, matches source | PASS(freshness) | all live queries, no cache; but tiles ≠ AC metric set (see AC1) |
| 3 delta % vs YESTERDAY + same-weekday LAST WEEK, colored | **FAIL** | `deltaPct` compares THIS vs LAST calendar MONTH (`getKpis` vnMonthRangeUtc 0/-1), not yesterday/last-week |
| 4 30-day line default, switch 7/90 | PASS | dto window default 30, enum [7,30,90] `reports.dto.ts:7-15`; area-chart |
| 5 window switch re-query no full reload | PASS | `use-coo-dashboard.ts` client refetch on windowDays |
| 6 revenue only confirmed-paid, excl pending + refund | PASS | `orders.aggregate status:'paid'`; refund is status→'refunded' `orders.service.ts:266` (not a flag on paid), so excluded |

## F-034 Progress report
| AC | Verdict | Evidence |
|--|--|--|
| 1 per-STUDENT rows: completion%, lessons, last-active, active/inactive | **FAIL** | `progress.service.ts` groups by **course** (ProgressRow = course/students/avgCompletion/learning/done); no per-student row, no last-active, no active/inactive |
| 2 filter by course + date range | PASS | buildWhere courseId + enrolled_at from/to |
| 3 completion% matches My Courses per student | **FAIL/PARTIAL** | only per-course avg progress_pct; no per-student figure to match |
| 4 active if lesson activity last 14 days | **FAIL** | no 14-day active logic anywhere |
| 5 Excel .xlsx export reflecting filters | **PARTIAL** | export is **CSV** not xlsx (`reports.controller.ts:50` text/csv, `.csv`); does reflect filter |
| 6 export = screen cols + email + phone, matches | **FAIL** | CSV cols course-level [Khóa học,Học viên,Hoàn thành TB,Đang học,Đã xong] — no email/phone, no student rows |

## F-035 Funnel report
| AC | Verdict | Evidence |
|--|--|--|
| 1 FOUR steps Đăng ký/Đã mua/Đang học/Hoàn thành + dropoff | **FAIL** | `funnel.service.ts computeFunnelStages` returns **3** stages (registered/learning/completed); Purchased deliberately moved to KPI row (documented rationale: >100% bar). AC wants Đã mua as a funnel step |
| 2 each step abs + % of total, draw 4 even if 0 | **FAIL** | only 3 stages rendered `funnel-report-page.tsx:79` |
| 3 filter date range + course | PASS | buildEnrollmentWhere/buildOrderWhere |
| 4 conversion adjacent = next/prev*100 rounded 1 decimal | **PARTIAL** | `ratioPct` uses `Math.round(x*100)` → integer, not 1 decimal; and only 2 conversions (3 stages) |
| 5 denominator 0 → "-" not % | **PARTIAL/FAIL** | `ratioPct` returns **0** on denom 0, not "-"; FE renders pct not dash |

## F-036 Email report
| AC | Verdict | Evidence |
|--|--|--|
| 1 per-campaign sent/delivered/open%/click%/unsub/bounce | PASS | `email-performance.service.ts` CampaignRow all six fields |
| 2 each automation rule & drip = own campaign, from EmailEvent | PARTIAL | groups by `email_logs.campaign_id` (flow:<id> resolved `use-email-report.ts:36`); reads email_logs opened/clicked cols, not a separate EmailEvent table |
| 3 select campaign → daily open/click trend chart over lifecycle | **FAIL** | no per-campaign trend endpoint/service; email-report-page is KPI row + campaign table only (no chart) |
| 4 switch campaign → chart redraw no reload | **FAIL** | no chart exists (AC3) |
| 5 top-10 templates by open rate table | **FAIL** | not in service or page — no template ranking |

## F-037 Blog CMS
| AC | Verdict | Evidence |
|--|--|--|
| 1 CRUD title/body/slug/metaTitle/metaDesc/OG/category/tag/author/status | PASS | schema `blog_posts` has author_id/seo_og_image/meta_*; dto has content/metaTitle/metaDescription/status/tagNames; OG=cover-image route; author=creator |
| 2 slug auto+editable, dup among published → 409 | PASS | toBlogSlug default, editable; slug `@unique` (global, stricter) → ConflictException `blog.service.ts:191` |
| 3 toolbar H1-H3/bold/italic/quote/link/img/ordered+unordered | PASS (fix real) | `blog-rich-text-editor.tsx:90-102` all buttons; sanitizer allows h1-3/ol/ul/li/blockquote |
| 4 scheduled → auto Published ≤5 min | PASS (fix real) | cron `*/5 * * * *` `main.ts:254` promoteScheduledPosts |
| 5 OG img JPEG/PNG ≤5MB R2, og:image meta | PASS | cover-image ≤5MB `blog.service.ts:63`; served, used as SSR og:image |
| 6 /blog & /blog/:slug full HTML + canonical, /sitemap.xml lists published | PASS | SSR force-dynamic + `alternates.canonical`; `sitemap.ts` lists published posts |

## F-038 Branding
| AC | Verdict | Evidence |
|--|--|--|
| 1 primary+secondary color picker, preview ≤1s | PASS | color-field + BrandPreviewCard draftVars live CSS vars from unsaved draft |
| 2 hex output, apply site-wide | PASS | brand.primary/secondary color type; Apply persists→CSS vars |
| 3 logo PNG/SVG ≤2MB + favicon ICO/PNG ≤256KB R2 | **PARTIAL** | both logo & favicon capped at **5MB** (`site-config.service.ts:25 LOGO_MAX_BYTES`), not 2MB/256KB |
| 4 default course thumbnail on R2 shown on cards w/o own | **FAIL** | no global default-course-thumbnail config key or UI found |
| 5 Dark/Light default mode saved, applies | **FAIL** | no theme/dark/light/color_scheme key or UI found |

## F-039 Homepage builder
| AC | Verdict | Evidence |
|--|--|--|
| 1 drag-drop add/remove/reorder, order persists | PASS | dnd-kit DndContext/SortableContext + arrayMove `homepage-section-builder.tsx`; draft→publish persists sort_order |
| 2 preview desktop 1280 + mobile 375, reflects unsaved draft | PASS | device toggle + MobilePreviewFrame; draft-first canvas |
| 3 save draft ≠ public, Publish swaps | PASS | isolated `__draft:home` snapshot, publish applies atomically `homepage-sections.service.ts` |
| 4 template library ≥ Progress/Achievements/FAQ/Testimonials/CourseHighlights/CTA, 1-click | PARTIAL | 20-type SECTION_LIBRARY incl faq/testimonials/featured_courses/cta; "Quá trình/Thành tựu" not literally named (journey/stat_band stand-in) |
| 5 inline edit text+img, upload R2 shows in preview | PASS | POST /site-config/section-image (website:W) `site-config.service.ts:218`; inline EditText/EditImage |
| 6 add/remove repeating items, always keep ≥1 | **FAIL** | `listOps.removeAt` plain filter, `RemoveItemBtn` no min guard — can delete last item to zero |

## F-040 Custom system pages
| AC | Verdict | Evidence |
|--|--|--|
| 1 edit Login title/subtitle/bg (≤5MB R2), public after publish | **FAIL** | no login.* config keys / editor found |
| 2 Coming Soon config title/desc/target-date/bg image R2 | **PARTIAL** | comingsoon.title/subtitle/target_date present; **no bg-image** field (coming-soon-card has none) |
| 3 enable → ALL non-admin frontend routes redirect, countdown realtime | **PARTIAL** | flag checked ONLY on homepage `page.tsx:64` (no middleware); other routes (/courses,/blog,/lop-hoc,/trang) not gated. Countdown realtime OK |
| 4 disable → routing normal | PASS | flag off → homepage renders normally |
| 5 edit Upgrade page title/content/CTA label+URL, no code deploy | **FAIL** | no upgrade page/route/config anywhere |
| 6 Upgrade CTA → internal course-buy or external URL | **FAIL** | no upgrade page (AC5) |

## F-041 Public pages
| AC | Verdict | Evidence |
|--|--|--|
| 1 public homepage renders published sections in order | PASS | getPublishedSections by sort_order; `app/page.tsx` |
| 2 SSR full HTML + meta | PASS | force-dynamic server components + generateMetadata |
| 3 canonical per article | PASS | `blog/[slug]/page.tsx:35 alternates.canonical` |
| 4 /sitemap.xml lists published posts+courses, refresh ≤15min | PASS | `sitemap.ts` force-dynamic (immediate), courses+posts+pages |
| 5 blog list 12/page via /blog?page=2, own URL | **PARTIAL** | pagination + ?page URL work, but pageSize default = **9** not 12 (`public-blog.dto.ts:17 .default(9)`) |

---

## FAIL / PARTIAL to resolve

### FAIL (AC materially not implemented)
- **F-033 AC1** dashboard KPIs are month/completion/cert, not revenue today/month/total + students today/month + orders today.
- **F-033 AC3** delta is month-over-month, not vs yesterday + same-weekday last week.
- **F-034 AC1/AC3/AC4/AC6** progress report is per-COURSE, not per-student — no last-active, no active/inactive, no email/phone, no per-student completion.
- **F-035 AC1/AC2** funnel has 3 stages not 4 (Đã mua excluded — documented rationale, but violates AC).
- **F-036 AC3/AC4/AC5** no per-campaign daily trend chart; no top-10 templates ranking.
- **F-038 AC4** no default course thumbnail. **AC5** no dark/light default mode.
- **F-039 AC6** repeatable items can be deleted to zero (no keep-≥1 guard).
- **F-040 AC1** no Login-page editor. **AC5/AC6** no Upgrade-page editor.

### PARTIAL (works but deviates from AC on a specific point)
- **F-030 AC1** raw-HTML textarea, not WYSIWYG; no integrated R2 image upload in bulk compose.
- **F-031 AC3/AC4** retry cap = 5 (queue default), AC says 3. **AC5** transactional emails have no delivery-log row.
- **F-032 AC1** recipient count shown only after publish, not before.
- **F-034 AC5** export is CSV not .xlsx.
- **F-035 AC4** conversion rounded to integer not 1 decimal. **AC5** denom-0 returns 0 not "-".
- **F-038 AC3** logo/favicon size caps both 5MB (AC: 2MB / 256KB).
- **F-040 AC2** Coming Soon has no bg-image field. **AC3** coming-soon gates homepage only, not all non-admin routes (no middleware).
- **F-041 AC5** blog list paginates 9/page, AC says 12.

## Unresolved Qs
- F-033/F-034/F-035 deviations look like deliberate redesigns (COO tiles, per-course funnel/progress) vs the feature-register AC — is the AC stale or is the code under-scoped? Needs product decision.
- F-036 AC2 "from EmailEvent" — code reads denormalized email_logs columns, not a distinct EmailEvent table; confirm that satisfies the contract.
