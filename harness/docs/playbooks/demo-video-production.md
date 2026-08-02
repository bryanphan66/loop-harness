# Demo Video Production

**When To Run:** producing a video of the built product for a client demo, UAT hand-off, or marketing. **Skip when:** no demo-video deliverable was requested.

**Lifecycle:** verified · **First use:** elearning UAT Phase-1 (2026-07) · **Verified by:** rendered Remotion product-tour (4×MP4 1080p, VN AI voiceover)

> How to produce a **video** of the built product for a client demo, UAT hand-off,
> or marketing. Three distinct styles exist — **pick the right one first** (the
> common mistake is shipping a step-by-step tutorial when the client wanted a
> polished demo). Applies at the delivery boundary (Macro-2 ACCEPTANCE / Macro-3
> hand-off) whenever a recorded walkthrough is a deliverable. Grep signals: `demo`,
> `video`, `walkthrough`, `product tour`, `voiceover`, `remotion`, `recording`.

**Macro-stage / step:** Build & Go-live 2.10–2.12 (UAT/ACCEPTANCE artifacts) +
Post-Build 3.x (marketing). **Gate it serves:** the DoD "user manual / demo
evidence" leg when the deliverable is a video, not just the written manual.

## Engine

- **Fast path:** `ck-remotion` (programmatic video) + `ai-multimodal` (TTS
  voiceover); `ck-web-testing`/Playwright for screen-record footage.
- **Role:** whoever owns delivery media. **Bare-agent fallback:** Remotion CLI +
  an offline TTS binary + ffmpeg directly — same artifact shape.

## Pick the style FIRST (the load-bearing decision)

| Style | What it is | Use when | NOT for |
|---|---|---|---|
| **1. User-guide recording** | Playwright `recordings` project: one flow per spec, a `narrate()` subtitle on **every micro-step**, visible cursor, slow pacing → `.webm` per flow | Documentation ("how to do X, step 1/N…"), onboarding help center | A client demo — reads as a dry tutorial |
| **2. Product-tour video** ⭐ | **Remotion** composition: the real app inside a **device frame (macOS window)** with motion, a continuous **voiceover** (1–2 value sentences per part), title cards, storyline **big→small** → rendered MP4 | **Client/UAT demo, show-off, marketing** — the polished "what this product does" film | Teaching exact clicks |
| **3. Live demo script** | Not a rendered video — a **cheat-sheet** a person reads while demoing live: big→small feature order, one route + one punch-line per part, personas + accounts + happy-path steps + timings (15'/30'/full) | A human presenting the running app to the client | An asset you send — it's a script, not a file |

A customer "demo video" almost always means **style 2**. Style 1 (step-by-step,
per-step subtitles) is the wrong feel for a demo even though the recording pipeline
looks similar — the difference is the **script**, not the tool. Confirm the style
with the owner before building; re-doing a full render is expensive.

## Recipe — Style 2, the verified product-tour (Remotion + device-frame + AI VO)

The elearning build proved this end-to-end. Reproduce it as:

1. **Isolated Remotion project**, OUTSIDE the app's pnpm workspace (e.g.
   `demo/remotion-product-tour/`) so it never enters `validate:quick` or the app
   build. Remotion 4.x, React 19, 1920×1080 @ 30fps. Commit the source; the
   rendered MP4/audio are binaries → gitignore them, output to a stable folder
   outside the repo, cite absolute paths in the report.
2. **Real product imagery, no re-draw.** Reuse the SAME real screenshots the
   user-guide/device-frame already captured (`.webp`, ~1440×900, NO burnt-in
   subtitles) — a `<MacFrame>` component (macOS chrome: 3 dots + a fake URL +
   rounded corners + shadow) wraps each shot with **Ken Burns** motion + cross-
   fades. Do NOT reuse style-1 `.webm` (their narrate subtitles are baked in).
   Add short CLEAN screen-record clips only for a genuine motion "wow" moment
   (video player, checkout) — static-shot-plus-motion covers most scenes.
3. **Voiceover from the demo script (big→small).** Write one continuous VN
   narration per part — value nouns, not click-by-click. Generate audio with an
   **offline neural TTS** (verified: **piper `vi_VN-vais1000-medium`**,
   length-scale ~1.02, sentence-silence ~0.35s) — no cloud key, deterministic,
   re-renderable. One audio file per part.
4. **Drive the timeline from MEASURED VO length.** `ffprobe` each audio → write
   scene/shot durations from the real VO length + breathing padding (persist to a
   `audio-durations.json`), so picture and narration stay in sync automatically.
5. **Storyline:** `Intro (brand) → parts big→small (persona by persona) → Outro
   (CTA)`, cross-faded. A chapter title card opens each part; a corner tag + a
   per-shot caption pill reinforce the value line.
6. **Render per-part MP4 + one stitched master** (H.264 + AAC); verify each with
   `ffprobe` (video + audio streams present, durations match VO). Deliver both —
   parts for modular presenting, master for a single send.

## Enhancement hooks (for the next iteration)

- Subtle background music bed (duck under VO).
- Short clean screen-record clips for hero moments instead of static shots.
- Human voiceover dubbing (swap the TTS audio track; timeline already VO-driven).
- Brand theming of the frame/title cards from site-config (`[[config-driven-identity]]`).
- An **English** variant (force locale + re-TTS) — the pitch/show-off cut.
- A 3-min short cut alongside the full master (climax scenes only).

## Anti-Patterns

- Shipping a **style-1 step-by-step tutorial** as the client demo. Pick the style first.
- **Re-drawing** the app (schematic mockups) instead of real screenshots in the frame — same defect the user-guide has ([[config-driven-identity]] / real-media discipline).
- Baking subtitles into source footage, then trying to reuse it in the Remotion cut.
- Committing the rendered MP4/audio binaries into the repo.
- A cloud-TTS that needs a key the render box may not have — prefer an offline voice for a deterministic, re-runnable render.
