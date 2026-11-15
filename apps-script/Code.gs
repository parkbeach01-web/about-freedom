/**
 * 어바웃 프리덤 코칭 신청서 → 구글 시트 기록
 * 이 코드는 구글 시트의 [확장 프로그램 > Apps Script]에 붙여넣어 사용합니다.
 */

const SHEET_NAME = "신청";
const HEADERS = ["접수 시각", "이름", "연락처", "이메일", "나이대", "연차", "고민", "희망 방식", "통화 가능 시간대", "알게 된 경로", "개인정보 동의", "진행 상태", "메모"];
const NOTIFY = true; // 새 신청이 들어오면 시트 주인에게 메일 알림

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = e.parameter || {};
    if (p.website) return ok_(); // 스팸 방지

    const sheet = getSheet_();
    const row = [
      new Date(),
      clean_(p.name), clean_(p.phone), clean_(p.email),
      clean_(p.age), clean_(p.career), clean_(p.concern),
      clean_(p.mode), clean_(p.callTime), clean_(p.source),
      clean_(p.consent), "신규", ""
    ];
    sheet.appendRow(row);

    if (NOTIFY) {
      const to = Session.getEffectiveUser().getEmail();
      const body = HEADERS.slice(1, 11).map((h, i) => h + ": " + row[i + 1]).join("\n");
      MailApp.sendEmail(to, "[어바웃 프리덤] 새 코칭 신청: " + row[1], body + "\n\n시트: " + SpreadsheetApp.getActive().getUrl());
    }
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 수식 주입 방지: =, +, -, @ 로 시작하면 앞에 작은따옴표
function clean_(v) {
  v = String(v || "").slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function ok_() {
  return ContentService.createTextOutput("ok");
}

// 처음 한 번 실행: 시트 머리글을 만들고 권한(시트, 메일)을 허용받습니다.
function setup() {
  getSheet_();
  MailApp.getRemainingDailyQuota();
}
