#!/usr/bin/env node
/**
 * Cổng: mọi REQ-ID trong phạm vi có mặt trong artifact của bước, hoặc được MIỄN
 * tường minh kèm lý do.
 *
 * Vì sao có: goal-text 2.1 đòi *"every in-scope REQ-ID maps to >=1 entity or carries
 * an explicit no-data-footprint note"*, goal-text 2.2 đòi API contract phủ *"every
 * in-scope REQ-ID that has an API surface"*. Cả hai là tiêu chí ở QUY MÔ MÁY - 401
 * REQ-ID, 601 mục - nhưng giao cho một gate NGƯỜI phán trong 15 lượt, và không có
 * script nào. Trên một dự án thật, agent chỉ còn hai lối: nhận vống, hoặc hạ mức
 * kiểm xuống mức module rồi ghi lại là đã hạ. Nó chọn cách trung thực, nhưng cổng
 * thì vẫn chưa bao giờ được kiểm ở mức nó tự đòi.
 *
 * Miễn phải KHAI, không được im lặng bỏ qua - cùng cơ chế `dangling-refs-allow.md`:
 * mỗi dòng một REQ-ID kèm lý do. Miễn hết cần thiết thì gate báo thừa.
 *
 *   node scripts/check-reqid-artifact-coverage.mjs --artifact entity
 *   node scripts/check-reqid-artifact-coverage.mjs --artifact api --granularity id
 *
 * MẶC ĐỊNH ĐO Ở MỨC `area` (`MODULE.AREA.*`), không phải từng mã. Đo thử ở mức
 * từng mã trên một dự án thật: ERD phủ 6%, API contract phủ 4% - không phải vì
 * hai tài liệu đó sai 94%, mà vì chúng KHÔNG ghi REQ-ID cạnh từng mục. Một tiêu
 * chí không thể đạt thì không phải tiêu chí, nó là một dòng chữ ai cũng bỏ qua.
 *
 * Mức `area` bắt được đúng thứ cần: nhóm yêu cầu nào chưa ai gắn vào kiến trúc.
 * ~130 tiền tố thay vì 401 mã - viết được, và vẫn truy vết được.
 *
 * HAI CHẾ ĐỘ, vì con số thật buộc phải vậy. Đo lần đầu trên một dự án thật:
 * ERD phủ 22% ở mức area, API contract 17% - hai tài liệu đó chưa từng ghi truy
 * vết REQ-ID. Bắt chúng đủ 100% ngay ở 2.1/2.2 là bắt viết 130 dòng trích dẫn
 * trong một bước 15 lượt: cổng sẽ đỏ mãi rồi bị bỏ qua, đúng bệnh "gate đỏ mãi
 * là gate mù".
 *
 *   --advisory        báo cáo con số, KHÔNG chặn. Dùng ở 2.1 và 2.2.
 *   --phase P<n>      chỉ soi REQ-ID của phase đó, CHẶN. Dùng ở 2.6.
 *
 * Trả nợ dần theo phase: mở phase nào thì viết truy vết cho phase đó. Tới lúc
 * phase cuối đóng, phủ đủ 100% mà không ai phải ngồi viết 130 dòng một lượt.
 *
 * Cấu hình: gate-config.json -> reqIdArtifacts.{entity,api}.{file,exemptFile}
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, inScopeReqIds, reqIdsByPhase } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT);
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] ?? null; };
const KIND = flag('--artifact');

const DEFAULTS = {
  entity: { file: 'docs/system-architecture.md', exemptFile: 'docs/gates/reqid-entity-exempt.md', label: 'thực thể (ERD)' },
  api: { file: 'docs/api-contract.md', exemptFile: 'docs/gates/reqid-api-exempt.md', label: 'endpoint (API contract)' },
};
if (!KIND || !DEFAULTS[KIND]) {
  console.error('dùng: node scripts/check-reqid-artifact-coverage.mjs --artifact entity|api');
  process.exit(1);
}
const conf = { ...DEFAULTS[KIND], ...((cfg.reqIdArtifacts ?? {})[KIND] ?? {}) };
const ART = resolve(ROOT, conf.file);
const EXEMPT = resolve(ROOT, conf.exemptFile);
const RE = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;

if (!existsSync(ART)) {
  console.log(`✓ [reqid-${KIND}] chưa có ${conf.file} — bỏ qua (bước sinh ra nó chưa chạy)`);
  process.exit(0);
}

const ADVISORY = args.includes('--advisory');
const PHASE = flag('--phase');
let inScope = inScopeReqIds(ROOT, cfg.rtm ?? {});
if (PHASE) {
  const manifest = resolve(ROOT, (cfg.issueBoard ?? {}).buildManifest ?? 'docs/build-manifest.md');
  const { byPhase } = reqIdsByPhase(ROOT, manifest);
  const ofPhase = byPhase.get(PHASE) ?? new Set();
  if (ofPhase.size === 0) {
    console.error(`\n✗ [reqid-${KIND}] ${PHASE} không có REQ-ID nào — đọc hỏng, không phải phase rỗng.\n`);
    process.exit(1);
  }
  inScope = new Set([...inScope].filter((id) => ofPhase.has(id)));
}
if (inScope.size === 0) {
  console.error(`\n✗ [reqid-${KIND}] không đọc được REQ-ID nào trong phạm vi — ĐỌC HỎNG, không phải phạm vi trống.`);
  console.error('  Xem resolveRegisterJson / inScopeReqIds trong gate-lib.mjs.\n');
  process.exit(1);
}

const mentioned = new Set(readFileSync(ART, 'utf8').match(RE) ?? []);
if (mentioned.size === 0) {
  console.error(`\n✗ [reqid-${KIND}] ${conf.file} tồn tại nhưng KHÔNG nhắc REQ-ID nào — so sánh 0 mục là xanh rỗng, không phải đạt.\n`);
  process.exit(1);
}

/** Miễn phải khai kèm lý do, cùng khuôn `dangling-refs-allow.md`. */
const exempt = new Map();
if (existsSync(EXEMPT)) {
  for (const line of readFileSync(EXEMPT, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    const m = cells[0]?.match(/`([^`]+)`/);
    if (m && cells[1]) exempt.set(m[1], cells[1]);
  }
}

const GRAN = flag('--granularity') ?? 'area';
const areaOf = (id) => id.split('.').slice(0, 2).join('.');
const mentionedAreas = new Set([...mentioned].map(areaOf));
// Artifact cũng có thể khai theo nhóm: `IF.JOBS.*`.
for (const m of readFileSync(ART, 'utf8').matchAll(/\b([A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*)\.\*/g)) mentionedAreas.add(m[1]);

const covers = (id) =>
  exempt.has(id) || mentioned.has(id) || (GRAN === 'area' && mentionedAreas.has(areaOf(id)));
const missing = [...inScope].filter((id) => !covers(id)).sort();
const staleExempt = [...exempt.keys()].filter((id) => mentioned.has(id));

if (staleExempt.length) {
  console.warn(`⚠ [reqid-${KIND}] ${staleExempt.length} miễn trừ THỪA (đã có mặt trong artifact): ${staleExempt.slice(0, 10).join(', ')} — xoá khỏi ${conf.exemptFile}`);
}

if (missing.length) {
  const pct = Math.round(((inScope.size - missing.length) / inScope.size) * 100);
  console.error(`\n✗ [reqid-${KIND}] ${missing.length}/${inScope.size} REQ-ID trong phạm vi KHÔNG có ${conf.label} và cũng không được miễn (mức \`${GRAN}\`, phủ ${pct}%):\n`);
  console.error(`  ${missing.slice(0, 25).join(', ')}${missing.length > 25 ? ` … +${missing.length - 25}` : ''}`);
  console.error(`\n  Hoặc bổ sung chúng vào ${relative(ROOT, ART)}, hoặc khai miễn kèm LÝ DO ở`);
  console.error(`  ${conf.exemptFile} (mỗi dòng: | \`REQ-ID\` | lý do |).`);
  console.error('  Không được im lặng bỏ qua - đó chính là cách một cổng trở thành vô nghĩa.\n');
  if (ADVISORY) {
    console.error(`⚠ [reqid-${KIND}] CHẾ ĐỘ BÁO CÁO - không chặn bước này. Nợ phải trả dần theo phase ở 2.6.\n`);
    process.exit(0);
  }
  process.exit(1);
}
console.log(
  `✓ [reqid-${KIND}] ${inScope.size} REQ-ID${PHASE ? ` của ${PHASE}` : ' trong phạm vi'} đều có ${conf.label} ` +
    `hoặc được miễn tường minh (mức \`${GRAN}\`, ${exempt.size} miễn)`,
);
