/**
 * Cầu đồng bộ UAT Sheet <-> GitHub Issues (Google Apps Script).
 *
 * Nguyên tắc chống đụng độ: "2 chiều" = 2 luồng 1 chiều chia theo cột.
 *   - Cột khách sở hữu (Kết quả, Ghi chú)  -> đẩy lên GitHub.
 *   - Cột hệ thống (Dev status, Trạng thái, Issue #, Link) <- ghi từ GitHub; khách không sửa.
 * GitHub <-> Plane đã tự đồng bộ, nên tạo issue kèm nhãn "plane" là dữ liệu tự chảy qua Plane.
 *
 * Cách dùng: xem hướng dẫn gắn ở cuối file / trong plan.md.
 */

// ================== CẤU HÌNH ==================
const CFG = {
  REPO: 'RenoAI-Labs/elearning-platform', // repo tạo issue
  SHEET_NAME: 'UAT',                       // tên tab chứa danh sách UAT (đổi cho khớp)
  HEADER_ROW: 1,                           // dòng chứa tiêu đề cột
  SYNC_LABEL: 'plane',                     // nhãn để issue tự chảy qua Plane
  DEV_FIXED_LABEL: 'dev-fixed',            // nhãn dev báo đã fix (giữ issue mở để khách test lại)
  // Map TÊN CỘT (theo header, không theo vị trí -> đổi thứ tự cột không vỡ)
  COL: {
    feature: 'Tên tính năng',   // -> title issue
    module:  'Module',          // -> nhãn "Module: X"
    result:  'Kết quả',         // khách chấm: Đạt / Chưa đạt
    note:    'Ghi chú',         // khách feedback -> comment issue
    devStatus: 'Dev status',    // hệ thống ghi: Đang làm / Đã fix
    issueState:'Trạng thái',    // hệ thống ghi: open / closed
    issueNo: 'Issue #',         // KHOÁ: số issue (nên ẩn cột này)
    link:    'Link',            // hệ thống ghi: url issue
  },
};
// PAT lưu trong Script Properties (KHÔNG viết token vào code). Set 1 lần bằng menu.
function getToken_() {
  const t = PropertiesService.getScriptProperties().getProperty('GH_PAT');
  if (!t) throw new Error('Chưa cấu hình PAT. Menu UAT Sync -> Cấu hình PAT.');
  return t;
}

// ================== MENU ==================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('UAT Sync')
    .addItem('Sync ngay', 'syncNow')
    .addItem('Cấu hình PAT', 'configPat')
    .addToUi();
}
function configPat() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Dán GitHub PAT (fine-grained, quyền Issues read/write):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText().trim()) {
    PropertiesService.getScriptProperties().setProperty('GH_PAT', r.getResponseText().trim());
    ui.alert('Đã lưu PAT.');
  }
}

// ================== ĐIỂM VÀO ==================
// Gọi tay (menu) hoặc gắn time-driven trigger mỗi 5 phút.
function syncNow() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // đang chạy -> bỏ qua, tránh chạy đè
  try {
    pushSheetToGithub_();   // luồng Sheet -> GitHub
    pullGithubToSheet_();   // luồng GitHub -> Sheet
  } finally {
    lock.releaseLock();
  }
}

// ================== HELPER SHEET ==================
function getSheetCtx_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET_NAME);
  if (!sh) throw new Error('Không thấy tab "' + CFG.SHEET_NAME + '".');
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  const headers = sh.getRange(CFG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const idx = {};
  for (const key in CFG.COL) {
    const pos = headers.indexOf(CFG.COL[key]);
    if (pos === -1) throw new Error('Thiếu cột "' + CFG.COL[key] + '" trong Sheet.');
    idx[key] = pos + 1; // 1-based
  }
  return { sh, lastRow, idx };
}
function cell_(sh, row, col) { return sh.getRange(row, col); }

// ================== GITHUB API ==================
function gh_(method, path, payload) {
  const res = UrlFetchApp.fetch('https://api.github.com' + path, {
    method, contentType: 'application/json',
    headers: { Authorization: 'token ' + getToken_(), Accept: 'application/vnd.github+json' },
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('GitHub ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText() || '{}');
}

// ================== LUỒNG SHEET -> GITHUB ==================
function pushSheetToGithub_() {
  const { sh, lastRow, idx } = getSheetCtx_();
  const props = PropertiesService.getScriptProperties();
  for (let row = CFG.HEADER_ROW + 1; row <= lastRow; row++) {
    const feature = cell_(sh, row, idx.feature).getValue();
    if (!feature) continue; // dòng trống -> bỏ
    const moduleName = cell_(sh, row, idx.module).getValue();
    const result = String(cell_(sh, row, idx.result).getValue()).trim();
    const note = String(cell_(sh, row, idx.note).getValue()).trim();
    let issueNo = cell_(sh, row, idx.issueNo).getValue();

    const labels = [CFG.SYNC_LABEL];
    if (moduleName) labels.push('Module: ' + moduleName);

    // 1) Chưa có issue -> tạo mới
    if (!issueNo) {
      const created = gh_('POST', '/repos/' + CFG.REPO + '/issues', {
        title: String(feature), body: 'Tạo từ UAT Sheet.', labels,
      });
      issueNo = created.number;
      cell_(sh, row, idx.issueNo).setValue(issueNo);
      cell_(sh, row, idx.link).setValue(created.html_url);
    }

    // 2) Ghi chú mới (khác lần trước) -> post comment
    const noteKey = 'note_' + issueNo;
    if (note && props.getProperty(noteKey) !== note) {
      gh_('POST', '/repos/' + CFG.REPO + '/issues/' + issueNo + '/comments', { body: '[UAT khách] ' + note });
      props.setProperty(noteKey, note);
    }

    // 3) Kết quả = Đạt -> đóng issue
    const resultKey = 'result_' + issueNo;
    if (result && props.getProperty(resultKey) !== result) {
      if (/đạt/i.test(result) && !/chưa/i.test(result)) {
        gh_('PATCH', '/repos/' + CFG.REPO + '/issues/' + issueNo, { state: 'closed' });
      }
      props.setProperty(resultKey, result);
    }
  }
}

// ================== LUỒNG GITHUB -> SHEET ==================
function pullGithubToSheet_() {
  const { sh, lastRow, idx } = getSheetCtx_();
  // Gom map issueNo -> {devStatus, state} từ GitHub (nhãn plane, cả open/closed)
  const byNo = {};
  let page = 1;
  while (true) {
    const list = gh_('GET', '/repos/' + CFG.REPO + '/issues?labels=' + CFG.SYNC_LABEL +
      '&state=all&per_page=100&page=' + page);
    if (!list.length) break;
    list.forEach(function (it) {
      if (it.pull_request) return; // bỏ PR
      const names = (it.labels || []).map(function (l) { return l.name; });
      byNo[it.number] = {
        devStatus: names.indexOf(CFG.DEV_FIXED_LABEL) > -1 ? 'Đã fix' : 'Đang làm',
        state: it.state,
      };
    });
    page++;
  }
  // Ghi ngược vào đúng dòng theo Issue #
  for (let row = CFG.HEADER_ROW + 1; row <= lastRow; row++) {
    const issueNo = cell_(sh, row, idx.issueNo).getValue();
    if (!issueNo || !byNo[issueNo]) continue;
    cell_(sh, row, idx.devStatus).setValue(byNo[issueNo].devStatus);
    cell_(sh, row, idx.issueState).setValue(byNo[issueNo].state);
  }
}
