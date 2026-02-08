/**
 * coop.js - コープ（関係値）トラッカー
 * Persona 5 スタイルの人間関係管理
 */

// コープアクションの種類
const COOP_ACTIONS = [
    { id: 'contact', name: '連絡', points: 1 },
    { id: 'meet', name: '会う', points: 2 },
    { id: 'help', name: '手伝う', points: 3 },
    { id: 'gift', name: 'プレゼント', points: 2 },
    { id: 'event', name: 'イベント', points: 4 }
];

// コープカテゴリ
const COOP_CATEGORIES = [
    { id: 'family', name: '家族' },
    { id: 'friend', name: '友人' },
    { id: 'work', name: '同僚' },
    { id: 'other', name: 'その他' }
];

// ランクアップ閾値
const COOP_RANK_THRESHOLDS = [0, 5, 12, 22, 35, 52, 73, 98, 128, 165];
const COOP_RANK_NAMES = ['Rank 1', 'Rank 2', 'Rank 3', 'Rank 4', 'Rank 5', 'Rank 6', 'Rank 7', 'Rank 8', 'Rank 9', 'Rank MAX'];

// デフォルトコープデータ
const DEFAULT_COOPS = [];

// コープデータ取得
function getCoops() {
    const data = localStorage.getItem('persona_coops');
    return data ? JSON.parse(data) : DEFAULT_COOPS;
}

// コープデータ保存
function saveCoops(coops) {
    localStorage.setItem('persona_coops', JSON.stringify(coops));
}

// コープ追加
function addCoop(name, category, note = '') {
    const coops = getCoops();
    const newCoop = {
        id: 'coop_' + Date.now(),
        name,
        category,
        points: 0,
        note,
        logs: [],
        createdAt: new Date().toISOString()
    };
    coops.push(newCoop);
    saveCoops(coops);
    return newCoop;
}

// コープ削除
function deleteCoop(coopId) {
    const coops = getCoops().filter(c => c.id !== coopId);
    saveCoops(coops);
}

// コープにアクション実行
function executeCoopAction(coopId, actionId) {
    const coops = getCoops();
    const coop = coops.find(c => c.id === coopId);
    const action = COOP_ACTIONS.find(a => a.id === actionId);

    if (!coop || !action) return null;

    const oldRank = getCoopRank(coop.points);
    coop.points += action.points;
    const newRank = getCoopRank(coop.points);

    // ログに記録
    coop.logs.unshift({
        actionId,
        actionName: action.name,
        points: action.points,
        timestamp: new Date().toISOString()
    });

    // 最大100件まで保持
    if (coop.logs.length > 100) {
        coop.logs.pop();
    }

    saveCoops(coops);

    return {
        coop,
        action,
        oldRank,
        newRank,
        rankUp: newRank > oldRank
    };
}

// ランク計算
function getCoopRank(points) {
    for (let i = COOP_RANK_THRESHOLDS.length - 1; i >= 0; i--) {
        if (points >= COOP_RANK_THRESHOLDS[i]) {
            return i;
        }
    }
    return 0;
}

// ランク名取得
function getCoopRankName(points) {
    const rank = getCoopRank(points);
    return COOP_RANK_NAMES[rank];
}

// 次のランクまでの進捗
function getCoopProgress(points) {
    const rank = getCoopRank(points);
    if (rank >= COOP_RANK_THRESHOLDS.length - 1) {
        return { progress: 100, remaining: 0, nextRank: null };
    }

    const current = COOP_RANK_THRESHOLDS[rank];
    const next = COOP_RANK_THRESHOLDS[rank + 1];
    const progress = ((points - current) / (next - current)) * 100;

    return {
        progress: Math.min(100, Math.max(0, progress)),
        remaining: next - points,
        nextRank: COOP_RANK_NAMES[rank + 1]
    };
}

// メモ更新
function updateCoopNote(coopId, note) {
    const coops = getCoops();
    const coop = coops.find(c => c.id === coopId);
    if (coop) {
        coop.note = note;
        saveCoops(coops);
    }
}

// コープリストアイテム描画（Persona 5スタイル）
function renderCoopItem(coop) {
    const rank = getCoopRank(coop.points);
    // 星10個の生成（現在のランク分だけ★、残りは☆だが、P5風なら空の星は表示しないか、薄く表示）
    // 画像では「RANK MAX」や数字が大きい。
    // ユーザー要望「ランクを星１～１０にしてください」

    // ランク0(Rank 1) -> 1個, 最大Rank 9(Rank MAX) -> 10個
    const starsFilled = rank + 1;
    const starsEmpty = 10 - starsFilled;
    const starsHtml = '★'.repeat(starsFilled) + '<span style="opacity:0.2">★</span>'.repeat(starsEmpty);

    const category = COOP_CATEGORIES.find(c => c.id === coop.category);
    const categoryName = category ? category.name : '';

    return `
    <div class="coop-item" data-coop-id="${coop.id}">
      <div class="coop-item-arcana">${categoryName}</div>
      <div class="coop-item-name">${coop.name}</div>
      <div class="coop-item-rank">
        <div class="coop-stars">${starsHtml}</div>
      </div>
    </div>
  `;
}

// 全コープ削除
function deleteAllCoops() {
    localStorage.removeItem('persona_coops');
}

// 全コープ描画（リスト形式）
function renderAllCoops() {
    const coops = getCoops();

    if (coops.length === 0) {
        return `
      <div class="empty-state">
        <div class="empty-state-text">コープがありません</div>
        <button class="btn btn-primary" id="btn-add-first-coop">コープを追加</button>
      </div>
    `;
    }

    let html = `
    <div class="coop-list-container">
      <button class="btn btn-primary btn-full" id="btn-add-coop" style="margin-bottom: 24px;">+ コープを追加</button>
      <div class="coop-list">
        ${coops.map(coop => renderCoopItem(coop)).join('')}
      </div>
      <button class="btn btn-danger btn-full" id="btn-delete-all-coops" style="margin-top: 32px; opacity: 0.7;">全てのコープを削除</button>
    </div>
  `;

    return html;
}
