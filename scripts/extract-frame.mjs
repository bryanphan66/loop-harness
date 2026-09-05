#!/usr/bin/env node
/**
 * extract-frame.mjs - lay DUNG mot man hinh ra khoi board prototype.
 *
 * Lich su: MD-07. macro-2.md ghi "Giao dien <- prototype da freeze" nhung khong
 * noi doc kieu gi. Board cua autocontent la 2,171,246 ky tu (121 frame, 27 anh
 * base64 chiem 34%). Agent doc cau do roi mo ca file la vo ngan sach context
 * (subagent ~200K token). Vo context thi agent bia - dung cai ca lo chay nay
 * dang co gang tranh.
 *
 * Mot frame chi 7.5K-17K ky tu. Chenh hon 100 lan.
 *
 * Cach dung:
 *   node extract-frame.mjs <board.html> --list
 *   node extract-frame.mjs <board.html> s08a
 *   node extract-frame.mjs <board.html> 18            # moi frame cua man 18
 *   node extract-frame.mjs <board.html> s01 --no-images
 *   node extract-frame.mjs <board.html> s08a --trace  # chi trace-strip
 *
 * --list       liet ke zone / frame-id / ten / kich thuoc, khong in noi dung
 * --no-images  thay data:...base64 bang [anh nhung: N ky tu] (mac dinh BAT khi
 *              in noi dung, vi base64 khong giup gi cho viec doc thiet ke)
 * --with-images giu nguyen base64
 * --trace      chi in trace-strip (route, floorplan, REQ-ID, UC, CR)
 * --json       in dang JSON
 */

import { readFileSync, existsSync } from "node:fs";

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const [boardPath, selector] = argv.filter((a) => !a.startsWith("--"));

if (!boardPath || !existsSync(boardPath)) {
  console.error("dung: node extract-frame.mjs <board.html> [<sNN|NN>] [--list|--trace|--json|--with-images]");
  process.exit(2);
}

const html = readFileSync(boardPath, "utf8");

/** Zone: moi frame thuoc zone gan nhat truoc no. */
const zones = [...html.matchAll(/data-zone-title="([^"]+)"/g)].map((m) => ({ pos: m.index, title: m[1] }));
const zoneOf = (pos) => {
  let z = null;
  for (const x of zones) if (x.pos <= pos) z = x;
  return z?.title ?? "(ngoai zone)";
};

/** Frame: <article ... data-frame-id="..." data-frame-name="..." data-w data-h> ... </article> */
const frames = [];
for (const m of html.matchAll(/<article class="frame"\s+data-frame-id="([^"]+)"\s*\n?\s*data-frame-name="([^"]+)"\s*\n?\s*data-w="(\d+)"\s+data-h="(\d+)"/g)) {
  const start = m.index;
  const end = html.indexOf("</article>", start);
  frames.push({
    id: m[1],
    name: m[2].replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
    w: +m[3],
    h: +m[4],
    zone: zoneOf(start),
    start,
    end: end === -1 ? html.length : end + "</article>".length,
  });
}

const traceOf = (frame) => {
  const seg = html.slice(frame.start, frame.end);
  const m = seg.match(/class="trace-strip" title="([^"]+)"/);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"') : null;
};

if (flags.has("--list") || !selector) {
  const rows = frames.map((f) => ({ id: f.id, name: f.name, w: f.w, h: f.h, zone: f.zone, chars: f.end - f.start }));
  if (flags.has("--json")) {
    console.log(JSON.stringify({ board: boardPath, total: frames.length, frames: rows }, null, 2));
  } else {
    console.log(`board: ${boardPath}`);
    console.log(`${frames.length} frame trong ${new Set(frames.map((f) => f.zone)).size} zone\n`);
    let cur = null;
    for (const f of rows) {
      if (f.zone !== cur) {
        cur = f.zone;
        console.log(`-- ${cur}`);
      }
      console.log(`   ${f.id.padEnd(6)} ${String(f.w).padStart(5)}x${String(f.h).padEnd(6)} ${String(f.chars).padStart(7)} ky tu  ${f.name}`);
    }
  }
  process.exit(0);
}

/** Chon: "s08a" dung id; "18" hoac "s18" -> moi frame cua man do. */
const wanted = /^s?\d+[a-z]?$/i.test(selector)
  ? frames.filter((f) => (/^s?\d+$/i.test(selector) ? new RegExp(`^s0*${selector.replace(/^s/i, "")}[a-z]?$`, "i").test(f.id) : f.id.toLowerCase() === selector.toLowerCase()))
  : frames.filter((f) => f.name.toLowerCase().includes(selector.toLowerCase()));

if (wanted.length === 0) {
  console.error(`khong tim thay frame khop "${selector}". Chay --list de xem danh sach.`);
  process.exit(1);
}

const keepImages = flags.has("--with-images");
const clean = (s) =>
  keepImages ? s : s.replace(/data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+/g, (m) => `[anh nhung: ${m.length} ky tu, bo qua]`);

const out = wanted.map((f) => ({
  id: f.id,
  name: f.name,
  zone: f.zone,
  size: `${f.w}x${f.h}`,
  trace: traceOf(f),
  html: flags.has("--trace") ? undefined : clean(html.slice(f.start, f.end)),
}));

if (flags.has("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const f of out) {
    console.log(`=== ${f.id} - ${f.name}`);
    console.log(`zone : ${f.zone}`);
    console.log(`size : ${f.size}`);
    if (f.trace) console.log(`trace: ${f.trace}`);
    if (f.html) {
      console.log("---");
      console.log(f.html);
    }
    console.log();
  }
}
