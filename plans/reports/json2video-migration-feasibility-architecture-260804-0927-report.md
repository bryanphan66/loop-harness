# auto-affiliate → JSON2Video: kiểm chứng năng lực + kiến trúc chuyển đổi

> Bỏ hẳn i2i (image-to-image) + i2v (image-to-video) fal, render reel bằng **JSON2Video API** từ ảnh/video THẬT của Shopee. Mục tiêu chi phí < $60/tháng.
> Nguồn số liệu: doc live JSON2Video (đọc 2026-08-04) + quét codebase auto-affiliate (branch `loop-harness-build`).

---

## D. KIỂM CHỨNG NĂNG LỰC JSON2VIDEO (đọc doc thật, có/không + cách làm)

| # | Câu hỏi | Verdict | Cách làm / field | Nguồn |
|---|---|---|---|---|
| 1 | Start scene chính xác phần trăm giây (beat sync) | ✅ CÓ | `start` + `duration` nhận số thập phân (giây), vd `start: 0.4`. Cắt dính phách = set `duration` mỗi scene = khoảng phách (scene chạy tuần tự) | api-reference/json-syntax |
| 2 | Easing tùy biến / overshoot / spring | ⚠️ MỘT PHẦN | Có easing dựng sẵn gồm **`easeOutBack` (overshoot), `easeOutElastic` (spring/nảy)**, `easeOutCubic`, `easeOutCirc`... gắn trong keyframe/`animate`. **KHÔNG có cubic-bezier tùy biến**. Overshoot/spring dùng được qua Back/Elastic có sẵn | image element + component tutorial |
| 3 | Chia khung 2-3 dải dọc, mỗi dải 1 ảnh | ✅ CÓ | Nhiều element `image` với `x`/`y`/`width`/`height` tùy ý (position `custom`), `resize: cover` | element ref |
| 4 | Vẽ SVG/hình khối động trong JSON (sao lấp, chấm màu) | ✅ CÓ (gián tiếp) | **KHÔNG có element SVG/shape primitive native**. Thay bằng: (a) element `html` = full HTML5+CSS3+**Tailwind** (vẽ sao/chấm bằng CSS, animate được), (b) `component` `shape/rectangle`. Ca phức tạp → dựng PNG bằng sharp rồi chèn | html-elements + component |
| 5 | Zoom punch / Ken Burns tùy chỉnh đường cong | ✅ CÓ | `zoom` (-10..10), `pan` (hướng), hoặc `keyframes:[{time,zoom,x,y,easing}]` nội suy giữa mốc + easing riêng | image element |
| 6 | Audio riêng + cắt đúng đoạn track | ✅ CÓ | `audio`: `src`,`start`,`duration`,**`seek`** (nhảy vào giữa track, +từ đầu / -từ cuối),`volume`,`fade-out`. Nhiều audio chồng nhau (nhạc vol 0.3 + voice vol 1) | audio element |
| 7 | Xuất 9:16 1080x1920, codec, normalize FB | ✅ CÓ | `width:1080,height:1920` (hoặc `resolution:"instagram-story"`), `fps` (mặc định 25), `quality`. Codec **H.264/mp4** mặc định. Xuất chuẩn FB → **có thể bỏ bước normalize** (vẫn nên ffprobe verify) | movie ref + optimizing-rendering |
| 8 | Template versioning + clone qua API | ⚠️ MỘT PHẦN | Clone/create/update template REST: `POST /v2/templates` (create=bỏ `id`, update=`?id=`, **clone=`?action=duplicate&id=`**). **KHÔNG có versioning tích hợp** (tự version bằng naming/DB) | templates-create |
| 9 | Giới hạn render đồng thời + thời gian + webhook | ⚠️ MỘT PHẦN | **Webhook ✅** (`exports:[{type:"webhook",endpoint}]`, gọi khi render xong). Render ~**30-90s cho video 1 phút** → clip 16s ước **~8-25s**. **Concurrent limit KHÔNG ghi trong doc** (chỉ rate limit: đừng poll < 5s) → cần đo thực tế hoặc hỏi support | webhooks + how-to |
| 10 | Giá thực: gói $49.95 = bao nhiêu, 240 reel có đủ | ✅ CÓ, DƯ | **$49.95 = 12,000 credit/tháng = tối đa 200 phút** Full HD (1 credit/giây; 4K = 4x). Watermark-free đã gồm. 240 reel×16s = 3,840 giây = **3,840 credit = 64 phút → chỉ ~32% quota**, còn dư ~8,160 credit | pricing |

**Chỗ JSON2Video KHÔNG đáp ứng đủ → phương án thay:**
- **Cubic-bezier tùy biến / spring chính xác:** chỉ có easing dựng sẵn. Back/Elastic đủ cho "nảy quá đà". Nếu cần curve riêng → chia nhỏ keyframe tay để mô phỏng.
- **SVG/shape native:** không có → **dùng `html` element (CSS/Tailwind)** cho sao lấp dần + chấm màu; ca cầu kỳ (gradient phức tạp, mask) → **dựng overlay PNG bằng sharp** rồi chèn `image`.
- **Concurrent render limit:** không công bố → tự giới hạn queue (đề xuất 3-5 song song) + webhook + poll ≥ 5s; đo thực nghiệm.
- **Template versioning:** tự quản version qua DB (`templateKey` + `version` + `styleVariant`), dùng `?action=duplicate` để nhân bản.

---

## F2. TIMELINE JSON MẪU HOÀN CHỈNH — reel 16.0s, 150 BPM, 7 ảnh, cắt dính phách

**Toán nhịp:** 150 BPM → 1 phách = 60/150 = **0.4s**. 16.0s = 40 phách.
**Rhythm profile (khoảng cách cắt tính bằng phách)** — 12 scene, tổng 40 phách:
`[4,4,4, 2,2,2,2, 4,4, 2, 4, 6]` → duration (giây): `[1.6,1.6,1.6, 0.8,0.8,0.8,0.8, 1.6,1.6, 0.8, 1.6, 2.4]` (đoạn 0.8s = "drop" cắt nhanh, 2.4s = hold kết).
Ảnh gán vòng tròn `img[i % 7]`. Cắt cứng (hard cut) để phách khít; overlay logo + sao + chấm màu ở movie-level (span toàn phim). Không chữ/giá/tên.

```json
{
  "resolution": "custom",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "quality": "high",
  "comment": "reel-16s-150bpm-styleVariant=colorRotate-track=neon-pop-01",
  "exports": [
    { "type": "webhook", "endpoint": "https://aff-api.autocontent.click/api/webhooks/json2video" }
  ],
  "elements": [
    {
      "comment": "nhạc trend — seek vào phách đầu, fade cuối",
      "type": "audio",
      "src": "https://r2.autocontent.click/music/neon-pop-01.mp3",
      "start": 0,
      "seek": 0.12,
      "duration": 16.0,
      "volume": 1,
      "fade-out": 1.0
    },
    {
      "comment": "logo kênh — góc trên trái, span toàn phim",
      "type": "image",
      "src": "https://r2.autocontent.click/brand/logo.png",
      "x": 48, "y": 60, "width": 220, "position": "custom",
      "start": 0, "duration": 16.0
    },
    {
      "comment": "đánh giá sao dạng tượng hình (không số) — HTML/CSS",
      "type": "html",
      "html": "<div style=\"display:flex;gap:6px;font-size:52px;color:#FFC93C\">★★★★<span style=\"opacity:.28\">★</span></div>",
      "x": 48, "y": 1720, "width": 360, "position": "custom",
      "start": 0.6, "duration": 15.0
    },
    {
      "comment": "dải chấm màu biến thể — hex rút bằng sharp từ ảnh",
      "type": "html",
      "html": "<div style=\"display:flex;gap:14px\"><span style=\"width:34px;height:34px;border-radius:50%;background:#C24E6B\"></span><span style=\"width:34px;height:34px;border-radius:50%;background:#2E3A59\"></span><span style=\"width:34px;height:34px;border-radius:50%;background:#E8D5C4\"></span></div>",
      "x": 640, "y": 1740, "width": 400, "position": "custom",
      "start": 0.8, "duration": 14.5
    }
  ],
  "scenes": [
    { "comment": "S1 intro-hero 4 phách / 1.6s — Ken Burns zoom-in dịu",
      "duration": 1.6,
      "elements": [ { "type": "image", "src": "https://r2.autocontent.click/prod/p01/img0.jpg",
        "resize": "cover", "x": 0, "y": 0, "width": 1080, "height": 1920, "position": "custom",
        "keyframes": [ {"time":0,"zoom":1.0}, {"time":1.6,"zoom":1.08,"easing":"easeOutCubic"} ] } ] },

    { "comment": "S2 1.6s zoom-out", "duration": 1.6,
      "elements": [ { "type": "image", "src": "https://r2.autocontent.click/prod/p01/img1.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.08},{"time":1.6,"zoom":1.0,"easing":"easeOutCubic"}] } ] },

    { "comment": "S3 1.6s pan phải", "duration": 1.6,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img2.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom","pan":"right","zoom":1.05 } ] },

    { "comment": "S4 DROP 0.8s punch-zoom overshoot", "duration": 0.8,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img3.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.0},{"time":0.8,"zoom":1.12,"easing":"easeOutBack"}] } ] },

    { "comment": "S5 DROP 0.8s", "duration": 0.8,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img4.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.12},{"time":0.8,"zoom":1.0,"easing":"easeOutBack"}] } ] },

    { "comment": "S6 DROP 0.8s", "duration": 0.8,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img5.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.0},{"time":0.8,"zoom":1.10,"easing":"easeOutBack"}] } ] },

    { "comment": "S7 DROP 0.8s", "duration": 0.8,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img6.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.10},{"time":0.8,"zoom":1.0,"easing":"easeOutBack"}] } ] },

    { "comment": "S8 1.6s zoom-in (vòng lại img0)", "duration": 1.6,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img0.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.0},{"time":1.6,"zoom":1.08,"easing":"easeOutCubic"}] } ] },

    { "comment": "S9 1.6s pan trái", "duration": 1.6,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img1.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom","pan":"left","zoom":1.05 } ] },

    { "comment": "S10 0.8s", "duration": 0.8,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img2.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.0},{"time":0.8,"zoom":1.06,"easing":"easeOutCubic"}] } ] },

    { "comment": "S11 1.6s", "duration": 1.6,
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img3.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.06},{"time":1.6,"zoom":1.0,"easing":"easeOutCubic"}] } ] },

    { "comment": "S12 hold-kết 2.4s zoom-in chậm + fade cuối", "duration": 2.4,
      "transition": { "type": "xfade", "style": "fade", "duration": 0.4 },
      "elements": [ { "type":"image","src":"https://r2.autocontent.click/prod/p01/img4.jpg",
        "resize":"cover","x":0,"y":0,"width":1080,"height":1920,"position":"custom",
        "keyframes":[{"time":0,"zoom":1.0},{"time":2.4,"zoom":1.10,"easing":"easeOutCubic"}] } ] }
  ]
}
```

**Ghi chú kỹ thuật quan trọng:**
- Cắt dính phách = **tổng `duration` các scene trước = mốc phách**. Hard cut (không `transition`) giữ phách khít; `xfade` "ăn" thời gian nên chỉ dùng ở scene kết.
- `pan` + `zoom` tĩnh cho scene "trôi"; `keyframes` cho Ken Burns có đường cong; `easeOutBack` cho cú punch drop (nảy nhẹ).
- Với template **video-hero**: thay `image` bằng `video` element (Shopee clip thật), vẫn set `duration` scene theo phách, `seek` vào đoạn đẹp của clip.

---

## E. KIẾN TRÚC ĐỀ XUẤT (grounded theo code thật)

### Seam hiện tại (đã xác minh)
`MEDIA_GEN_PROVIDER` (token) → `CachedMediaGenService` (cost governance: cache + **trần $50/tháng** tại `cached-media-gen.service.ts:161`) → `FalMediaGenProvider` (`media-gen/fal-media-gen.provider.ts`). Interface `MediaGenProvider` (`media-gen-provider.interface.ts:68`) CHỈ có `generateImages` + `generateVideo`.

### Vấn đề kiến trúc cốt lõi
JSON2Video **không phải provider gen per-clip** (không map vào `generateVideo`). Nó **gộp gen + montage + nhạc thành 1 lần render**, thay cả `FalMediaGenProvider` LẪN `video-compose.service` LẪN phần overlay nhạc. Nên seam mới ở **tầng render-reel**, không nhét vào `generateVideo`.

### Đề xuất: seam mới `ReelRenderProvider` (đặt cạnh, không đập luồng cũ — ADR 0006)
```ts
// media-gen/reel-render-provider.interface.ts
export const REEL_RENDER_PROVIDER = 'REEL_RENDER_PROVIDER';

export interface ReelRenderInput {
  contract: ProductReelContract;   // zod-validated (E3)
  styleVariant: StyleVariant;      // chọn ở template-selector (E5)
  track: MusicTrack;               // bpm + beatOffsetSec (E7)
  rhythm: number[];                // hồ sơ nhịp, phách (E6)
}
export interface ReelRenderResult {
  videoUrl: string;                // mp4 9:16 đã render
  provider: 'json2video' | 'legacy-i2v';
  renderMs: number;
  creditsUsed?: number;
}
export interface ReelRenderProvider {
  render(input: ReelRenderInput, onProgress?, cancel?): Promise<ReelRenderResult>;
}
```
- `Json2VideoReelProvider implements ReelRenderProvider` — dựng movie JSON (E6) → `POST /v2/movies` → webhook `/api/webhooks/json2video` + poll (≥5s) → tải mp4 về MinIO/R2 → ffprobe verify (E8).
- `LegacyI2vReelProvider implements ReelRenderProvider` — bọc luồng fal hiện tại (`generateImages`+`generateVideo`+`video-compose`) làm **fallback**.
- `ReelRenderRouter` (behind `REEL_RENDER_PROVIDER`): chọn theo feature flag/tenant; **kill switch**: json2video lỗi/timeout → tự rơi về `legacy-i2v`.
- Cost governance: tái dùng ý tưởng `CachedMediaGenService` nhưng **đổi mô hình** — JSON2Video là subscription phẳng, không phải $/call. Đổi trần "$50/tenant" → **kế toán credit theo giây render/tenant** trên pool 12,000 credit/tháng (ghi bảng `mediaGenUsage` sẵn có).

### Module mapping (file thật)
| Thành phần | Vị trí đề xuất | Ghi chú |
|---|---|---|
| ReelRenderProvider + Router + Json2Video/Legacy | `modules/media-gen/reel-render/` | cạnh `fal-media-gen.provider.ts` |
| R2 storage client | `modules/content/services/r2-storage.service.ts` | mới; MinIO hiện `minio-storage.service.ts` |
| zod contract (E3) | `packages/shared/src/schemas/product-reel-contract.schema.ts` | chưa có; nay là TS interface |
| sharp color extract (E4) | `modules/content/services/variant-color.service.ts` | median pixel, không AI |
| Music library (E7) | Prisma model `MusicTrack{bpm,beatOffsetSec,url}` + seed tay | mới |
| Timeline generator (E6) | `modules/media-gen/reel-render/timeline-builder.ts` | pure fn, unit test |
| Template selector (E5) | `timeline-builder` if/else theo hình dạng data | thuần logic |
| Post-render verify (E8) | `reel-render/render-verify.ts` (ffprobe + snapshot brightness) | tái dùng `video-normalizer.extractFrame` |
| Giữ nguyên | `ai-text.service` (caption), `facebook.service` (publish) | |
| XÓA | `applyVeoMaskBlur` (`video-edit.service.ts:173`, gọi ở `video-compose.service.ts:193` + `story-compose-render.service.ts:64`) | chỉ khi luồng i2v nghỉ hưu |

### E5 Template selector (thuần if/else theo hình dạng data)
```
≥6 ảnh & ≥3 màu variant → template "color-rotate" (xoay chấm màu, cắt nhanh)
có video người bán       → template "video-hero" (clip thật làm scene chính)
2-3 ảnh                  → template "closeup" (Ken Burns cận cảnh, cắt chậm)
1 ảnh                    → template "single" (1 ảnh + zoom + overlay động)
```

---

## F4. BẢNG CHI PHÍ (240 reel/tháng = 8 reel/ngày)

| Khoản | TRƯỚC (fal i2v) | SAU (JSON2Video) |
|---|---|---|
| Gen hình/clip | i2v Kling ~$0.56/clip × 4 slot = **$2.24/reel** | **$0** (bỏ i2i/i2v) |
| Render/montage | FFmpeg (server, ~$0) | JSON2Video: **$49.95/tháng phẳng** (dùng 64/200 phút) |
| Caption GPT-4o-mini (OmniRoute) | ~$0.001/reel | ~$0.001/reel (giữ) |
| Storage media | MinIO (server) | R2 free tier (10GB, **egress $0**) ~$0-5 |
| **Mỗi reel** | **~$2.36/reel** | **~$0.21/reel** (subscription chia 240) + biên ~$0 |
| **TỔNG /tháng** | **~$566** | **~$50-55** |
| **Tiết kiệm** | | **~$510/tháng (~90%), đạt < $60 ✅** |

> Headroom: 12,000 credit/tháng đủ tới **~450 reel/tháng** (15/ngày) mà vẫn trong gói $49.95. Vượt thì nâng Startup $99.95/500 phút.

---

## F5. LỘ TRÌNH THEO GIAI ĐOẠN (mỗi phase dừng được, luồng i2v cũ vẫn chạy)

| Phase | Nội dung | Dừng được? | Rủi ro luồng cũ |
|---|---|---|---|
| **0** | R2 client + **cache ảnh/video Shopee về R2 ngay khi lấy sản phẩm** (link Shopee sẽ hỏng) | ✅ additive | 0 (chỉ thêm) |
| **1** | zod contract `ProductReelContract` (giá/sao/lượt bán/variants[]+hex/media[]/bpm/rhythm/styleVariant) + **sharp median-color** rút hex variant | ✅ pure util | 0 |
| **2** | Prisma `MusicTrack` (bpm + beatOffsetSec, nhập tay 10-15 track) | ✅ additive | 0 |
| **3** | `timeline-builder` (BPM+rhythm→movie JSON) + template selector — **pure fn, unit test, chưa gọi API**￼ | ✅ | 0 |
| **4** | `Json2VideoReelProvider` (gọi API + webhook + poll) sau **feature flag OFF mặc định** | ✅ | 0 (flag off) |
| **5** | Post-render verify (ffprobe duration/stream + snapshot brightness bắt ảnh không load) | ✅ | 0 |
| **6** | Wire `ReelRenderRouter` vào pipeline + **kill switch fallback i2v**; bật flag cho 1 tenant thử | ✅ rollback = tắt flag | thấp (fallback sẵn) |
| **7** | Cutover toàn bộ + đổi cost governance sang credit + **xóa `applyVeoMaskBlur`**; giữ legacy-i2v làm fallback vĩnh viễn (hoặc retire) | ✅ | — |

---

## F6. RỦI RO — chỗ chất lượng có thể TỤT so với i2v

1. **Cảm giác "slideshow" (nghiêm trọng nhất):** i2v tạo chuyển động thật trong ảnh tĩnh; JSON2Video chỉ Ken Burns/zoom trên ảnh thật → kém động hơn. **Giảm thiểu:** cắt dính phách punchy + zoom overshoot + ưu tiên template video-hero khi có clip người bán.
2. **Watermark NGƯỢC:** bỏ `applyVeoMaskBlur` (xóa watermark Veo) nhưng ảnh/clip Shopee thật thường **có watermark/chữ người bán** → lộ trên reel. **Giảm thiểu:** crop mép + sharp phát hiện vùng chữ, hoặc chọn ảnh sạch; cần policy rõ.
3. **Chất lượng ảnh gốc không đều:** ảnh Shopee lệch sáng/nền tạp → montage kém bóng bẩy hơn hero AI-composite. JSON2Video **không có color-grade** → giảm thiểu hạn chế (chuẩn hóa nhẹ bằng sharp trước khi upload R2).
4. **Beat-sync lệch:** `xfade` ăn thời gian làm trôi phách. **Giảm thiểu:** hard cut, chỉ xfade scene kết; verify tổng duration bằng ffprobe.
5. **Concurrent/latency JSON2Video chưa rõ:** không công bố giới hạn song song. **Giảm thiểu:** queue giới hạn (3-5) + webhook async + kill-switch fallback.
6. **Video người bán format lạ** (không phải 9:16, có watermark): cần chuẩn hóa/crop. JSON2Video resize được nhưng không un-watermark.
7. **Facebook publish** hiện dùng `/{pageId}/videos` (feed video) chứ chưa phải `/video_reels` chuyên dụng (`facebook.service.ts` + helper) → nếu cần reach reel thật cần kiểm tra endpoint. (Không liên quan JSON2Video nhưng ảnh hưởng phân phối.)

**Ràng buộc "mỗi video khác nhau" (chống giảm reach):** DỄ đạt hơn i2v — xoay `styleVariant` (4 template) × rhythm profile (nhiều mảng phách) × track (10-15 bpm khác) × bảng màu rút từ ảnh. Có thể sinh chữ ký "khuôn" và ép khác nhau giữa các post.

---

## Điểm cần BẠN quyết (chưa chắc → không tự quyết)

1. **R2 hay giữ MinIO?** Bạn nêu R2 (egress $0). Nhưng stack vừa deploy đã có **MinIO tự chứa** trên box (egress từ VPS cũng $0 nội bộ). R2 cần: tài khoản R2 + API token + client `@aws-sdk/client-s3` mới (hiện chỉ có SDK `minio`, R2 không hỗ trợ đủ API MinIO như lifecycle). → Dùng R2 (đúng ý bạn, CDN toàn cầu) hay MinIO có sẵn (đỡ 1 tích hợp)?
2. **Đã có tài khoản JSON2Video + API key chưa?** (Phase 4 cần; giới hạn concurrent chỉ đo được khi có key.)
3. **Retire fal i2v hẳn hay giữ làm fallback vĩnh viễn?** (ảnh hưởng Phase 7 + có giữ `applyVeoMaskBlur` cho nhánh fallback không.)
4. **Policy watermark ảnh Shopee:** crop tự động / bỏ ảnh có watermark / chấp nhận?

*Nguồn doc JSON2Video (đọc 2026-08-04): pricing, api-reference/json-syntax (+ element/image, /audio, /component), reference/json-syntax/movie + /scene, templates-create, exports/webhooks, html-elements + component-elements tutorial, optimizing-rendering.*
