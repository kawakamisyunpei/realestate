/**
 * Deen不動産 予約 → Googleカレンダー連携
 *
 * 使い方:
 *   1. https://script.google.com/ に info.deen22@gmail.com でログイン
 *   2. 「新しいプロジェクト」→ 本ファイルの内容を貼り付け
 *   3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *      - 実行ユーザー: 自分（info.deen22@gmail.com）
 *      - アクセスできるユーザー: 全員
 *   4. 初回は権限リクエスト（Calendar アクセス）を承認
 *   5. 発行された「ウェブアプリ URL」を
 *      reserve.html / online.html の GAS_ENDPOINT に貼り付け
 *
 * 予約フォームから届いたデータで、Googleカレンダーに
 * タイトル先頭が「（仮）」の予定を作成します。
 */

const CALENDAR_ID = 'info.deen22@gmail.com';     // 予定を入れるカレンダー
const TZ = 'Asia/Tokyo';

function doPost(e) {
  try {
    let params = {};
    if (e.postData && e.postData.type === 'application/json') {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter || {};
    }

    const type     = (params.type || '').toString();      // 'visit' or 'online'
    const name     = (params.name || '').toString();
    const furigana = (params.furigana || '').toString();
    const phone    = (params.phone || '').toString();
    const email    = (params.email || '').toString();
    const date1    = (params.date1 || '').toString();     // yyyy-mm-dd
    const time1    = (params.time1 || '').toString();     // "10:00〜11:00"
    const date2    = (params.date2 || '').toString();
    const time2    = (params.time2 || '').toString();
    const message  = (params.message || '').toString();

    if (!date1 || !time1 || !name) {
      return jsonResponse({ ok: false, error: 'missing required fields' });
    }

    const typeLabel = (type === 'online') ? 'オンライン相談' : '来店予約';
    const title = `（仮）${typeLabel} - ${name}`;

    const range = parseDateTimeRange(date1, time1);
    if (!range) return jsonResponse({ ok: false, error: 'invalid date/time' });

    const desc =
      `【予約種別】${typeLabel}\n` +
      `【お名前】${name}（${furigana}）\n` +
      `【電話】${phone}\n` +
      `【メール】${email}\n` +
      `【第1希望】${date1} ${time1}\n` +
      (date2 && time2 ? `【第2希望】${date2} ${time2}\n` : '') +
      `\n【ご質問・ご希望】\n${message}\n\n` +
      `※このイベントは仮予約です。日時を確定したらタイトルの「（仮）」を外してください。`;

    const cal = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = cal.createEvent(title, range.start, range.end, {
      description: desc
    });

    // 仮扱いに（予定あり/なし: 空き時間＝「仮」相当の扱い）
    try {
      event.setTransparency(CalendarApp.EventTransparency.TRANSPARENT);
    } catch (err) { /* 旧環境は無視 */ }

    return jsonResponse({ ok: true, eventId: event.getId() });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/** 時間帯文字列 "10:00〜11:00" を start/end の Date に変換 */
function parseDateTimeRange(dateStr, timeStr) {
  const tRe = /^(\d{1,2}):(\d{2})\s*[〜~\-]\s*(\d{1,2}):(\d{2})$/;
  const m = timeStr.match(tRe);
  const dRe = /^(\d{4})-(\d{2})-(\d{2})$/;
  const d = dateStr.match(dRe);
  if (!d) return null;

  let startH, startM, endH, endM;
  if (m) {
    startH = Number(m[1]); startM = Number(m[2]);
    endH   = Number(m[3]); endM   = Number(m[4]);
  } else {
    // フォールバック：先頭の HH:MM だけ拾い、1時間枠にする
    const f = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (!f) return null;
    startH = Number(f[1]); startM = Number(f[2]);
    endH   = startH + 1;   endM   = startM;
  }

  const y = Number(d[1]), mo = Number(d[2]) - 1, da = Number(d[3]);
  const start = new Date(y, mo, da, startH, startM, 0);
  const end   = new Date(y, mo, da, endH,   endM,   0);
  if (end <= start) end.setHours(start.getHours() + 1);
  return { start: start, end: end };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 動作確認用（Apps Script エディタから手動実行） */
function test_() {
  const fakeEvent = {
    parameter: {
      type: 'visit',
      name: 'テスト 太郎',
      furigana: 'テスト タロウ',
      phone: '090-0000-0000',
      email: 'test@example.com',
      date1: Utilities.formatDate(new Date(Date.now() + 86400000), TZ, 'yyyy-MM-dd'),
      time1: '14:00〜15:00',
      message: 'テスト予約です'
    }
  };
  const res = doPost(fakeEvent);
  Logger.log(res.getContent());
}
