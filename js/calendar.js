/**
 * calendar.js - Persona 5 スタイル カレンダー
 * 日付が左に流れる横スクロールカレンダー
 */

// 曜日名（日本語と英語）
const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAYS_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// カレンダーを描画
function renderCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // 前後3日を表示（計7日）
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date: date.getDate(),
      day: date.getDay(),
      isToday: i === 0,
      isPast: i < 0,
      isFuture: i > 0
    });
  }

  let daysHtml = days.map((d, index) => {
    const weekdayEn = WEEKDAYS_EN[d.day];
    const weekdayJp = WEEKDAYS_JP[d.day];
    const isWeekend = d.day === 0 || d.day === 6;

    let classes = 'calendar-day';
    if (d.isToday) classes += ' today';
    if (d.isPast) classes += ' past';
    if (d.isFuture) classes += ' future';
    if (isWeekend) classes += ' weekend';
    if (d.day === 0) classes += ' sunday';

    // 位置に応じてサイズを変える（中央が大きい）
    const position = Math.abs(index - 3);
    classes += ` pos-${position}`;

    return `
      <div class="${classes}">
        <div class="calendar-date">${d.date}</div>
        <div class="calendar-weekday-en">${weekdayEn}</div>
        <div class="calendar-weekday-jp">${weekdayJp}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="calendar-header">
      <span class="calendar-year">${year}</span>
      <span class="calendar-month">${month}</span>
      <span class="calendar-month-label">月</span>
    </div>
    <div class="calendar-days-wrapper">
      <div class="calendar-days">
        ${daysHtml}
      </div>
    </div>
  `;

  // クリックイベントの設定
  container.querySelectorAll('.calendar-day').forEach((el, index) => {
    el.addEventListener('click', () => {
      const dayData = days[index];
      // 日付をYYYY-MM-DD形式に変換（簡易的）
      // 実際はdays配列のDateオブジェクトを使う方が確実
      const date = new Date(today);
      date.setDate(today.getDate() + (index - 3)); // index 3 is today

      // YYYY-MM-DD変換
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      // アプリ側の関数を呼び出す（app.jsで定義予定）
      if (typeof showTodoModal === 'function') {
        showTodoModal(dateStr);
      }
    });
  });

  // スワイプでカレンダーを左右に動かす
  setupCalendarSwipe();
}

// カレンダースワイプ設定
function setupCalendarSwipe() {
  const wrapper = document.querySelector('.calendar-days-wrapper');
  if (!wrapper) return;

  let startX = 0;
  let scrollLeft = 0;

  wrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
    scrollLeft = wrapper.scrollLeft;
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX;
    const walk = (startX - x);
    wrapper.scrollLeft = scrollLeft + walk;
  }, { passive: true });
}

// ダッシュボード描画時にカレンダーも描画
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});
