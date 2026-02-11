/**
 * history.js - 履歴ログ管理
 */

// 日付をフォーマット
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
        return '今日';
    } else if (targetDate.getTime() === yesterday.getTime()) {
        return '昨日';
    } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    }
}

// 時刻をフォーマット
function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 履歴アイテムのHTML生成
// 履歴アイテムのHTML生成
function renderHistoryItem(entry) {
    if (entry.type === 'money') {
        const isIncome = entry.amount > 0;
        const sign = isIncome ? '+' : '';
        const className = isIncome ? 'positive' : 'negative';
        const icon = isIncome ? '💰' : '💸';
        const label = isIncome ? 'INCOME' : 'EXPENSE';

        return `
        <div class="history-item money-log">
          <span class="history-time">${formatTime(entry.timestamp)}</span>
          <div class="history-content">
            <div class="history-action-name">${icon} ${label}</div>
            <div class="history-effects">
                <span class="history-effect ${className}">¥ ${sign}${Math.abs(entry.amount).toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }

    const effectsHtml = entry.effects.map(effect => {
        const sign = effect.value >= 0 ? '+' : '';
        const className = effect.value >= 0 ? 'positive' : 'negative';
        return `<span class="history-effect ${className}">${effect.statName} ${sign}${effect.value}</span>`;
    }).join('');

    return `
    <div class="history-item">
      <span class="history-time">${formatTime(entry.timestamp)}</span>
      <div class="history-content">
        <div class="history-action-name">${entry.actionIcon} ${entry.actionName}</div>
        <div class="history-effects">${effectsHtml}</div>
      </div>
    </div>
  `;
}

// 日付ごとにグループ化して履歴を描画
function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        return `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">まだ行動記録がありません</div>
      </div>
    `;
    }

    // 日付ごとにグループ化
    const grouped = {};
    history.forEach(entry => {
        const dateKey = formatDate(entry.timestamp);
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(entry);
    });

    // HTML生成
    let html = '';
    for (const [date, entries] of Object.entries(grouped)) {
        html += `<div class="history-date-header">${date}</div>`;
        html += entries.map(entry => renderHistoryItem(entry)).join('');
    }

    return html;
}

// 履歴をクリア
function clearHistory() {
    saveHistory([]);
}
