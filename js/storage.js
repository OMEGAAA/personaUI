/**
 * storage.js - localStorage管理
 * Persona 5 パラメータシステム
 */

const STORAGE_KEYS = {
    STATS: 'persona_stats',
    ACTIONS: 'persona_actions',
    HISTORY: 'persona_history',
    SETTINGS: 'persona_settings'
};

// Persona 5 パラメータ定義
const DEFAULT_STATS = [
    {
        id: 'knowledge',
        name: '知識',
        value: 0,
        icon: '',
        ranks: ['平均的', '物知り', 'インテリ', '博識', '知恵の泉'],
        thresholds: [0, 34, 82, 126, 192]
    },
    {
        id: 'guts',
        name: '度胸',
        value: 0,
        icon: '',
        ranks: ['なくもない', '男らしい', '筋金入り', '大胆不敵', 'ライオンハート'],
        thresholds: [0, 11, 29, 57, 113]
    },
    {
        id: 'proficiency',
        name: '器用さ',
        value: 0,
        icon: '',
        ranks: ['ぎこちない', 'そこそこ', '職人級', '凄腕', '超魔術'],
        thresholds: [0, 12, 34, 60, 87]
    },
    {
        id: 'kindness',
        name: '優しさ',
        value: 0,
        icon: '',
        ranks: ['控え目', '聞き上手', '人情家', '駆け込み寺', '慈母神'],
        thresholds: [0, 14, 44, 91, 136]
    },
    {
        id: 'charm',
        name: '魅力',
        value: 0,
        icon: '',
        ranks: ['人並み', '気になる存在', '注目株', 'カリスマ', '魔性の男'],
        thresholds: [0, 6, 52, 92, 132]
    }
];

// デフォルト行動テンプレート（Persona 5風）
const DEFAULT_ACTIONS = [
    { id: 'a1', name: '読書', icon: '', effects: [{ statId: 'knowledge', value: 3 }] },
    { id: 'a2', name: '授業を聞く', icon: '', effects: [{ statId: 'knowledge', value: 2 }] },
    { id: 'a3', name: 'テスト勉強', icon: '', effects: [{ statId: 'knowledge', value: 5 }] },
    { id: 'a4', name: 'ビッグバンバーガー', icon: '', effects: [{ statId: 'guts', value: 3 }] },
    { id: 'a5', name: 'ホラー映画', icon: '', effects: [{ statId: 'guts', value: 3 }] },
    { id: 'a6', name: 'バッティングセンター', icon: '', effects: [{ statId: 'proficiency', value: 2 }] },
    { id: 'a7', name: 'コーヒーを淹れる', icon: '', effects: [{ statId: 'proficiency', value: 2 }, { statId: 'charm', value: 1 }] },
    { id: 'a8', name: '花屋でバイト', icon: '', effects: [{ statId: 'kindness', value: 2 }, { statId: 'charm', value: 1 }] },
    { id: 'a9', name: '銭湯', icon: '', effects: [{ statId: 'charm', value: 3 }] },
    { id: 'a10', name: 'DVDを見る', icon: '', effects: [{ statId: 'kindness', value: 3 }] },
    { id: 'a11', name: '瞑想', icon: '', effects: [{ statId: 'guts', value: 2 }] },
    { id: 'a12', name: 'ゲームセンター', icon: '', effects: [{ statId: 'proficiency', value: 3 }] }
];

// データの読み込み
function loadData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Data load error:', e);
        return null;
    }
}

// データの保存
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Data save error:', e);
        return false;
    }
}

// 初期化（デフォルトデータ設定）
function initializeStorage() {
    if (!loadData(STORAGE_KEYS.STATS)) {
        saveData(STORAGE_KEYS.STATS, DEFAULT_STATS);
    }
    if (!loadData(STORAGE_KEYS.ACTIONS)) {
        saveData(STORAGE_KEYS.ACTIONS, DEFAULT_ACTIONS);
    }
    if (!loadData(STORAGE_KEYS.HISTORY)) {
        saveData(STORAGE_KEYS.HISTORY, []);
    }
    if (!loadData(STORAGE_KEYS.SETTINGS)) {
        saveData(STORAGE_KEYS.SETTINGS, { darkMode: true });
    }
}

// パラメータ取得
function getStats() {
    const saved = loadData(STORAGE_KEYS.STATS);
    if (!saved) return DEFAULT_STATS;

    // 保存データにranks/thresholdsがない場合、デフォルトから補完
    return saved.map(stat => {
        const defaultStat = DEFAULT_STATS.find(d => d.id === stat.id);
        return {
            ...stat,
            ranks: stat.ranks || (defaultStat ? defaultStat.ranks : []),
            thresholds: stat.thresholds || (defaultStat ? defaultStat.thresholds : [])
        };
    });
}

// パラメータ保存
function saveStats(stats) {
    return saveData(STORAGE_KEYS.STATS, stats);
}

// 行動テンプレート取得
function getActions() {
    return loadData(STORAGE_KEYS.ACTIONS) || DEFAULT_ACTIONS;
}

// 行動テンプレート保存
function saveActions(actions) {
    return saveData(STORAGE_KEYS.ACTIONS, actions);
}

// 履歴取得
function getHistory() {
    return loadData(STORAGE_KEYS.HISTORY) || [];
}

// 履歴保存
function saveHistory(history) {
    return saveData(STORAGE_KEYS.HISTORY, history);
}

// 履歴追加
function addHistoryEntry(entry) {
    const history = getHistory();
    history.unshift({
        ...entry,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    // 最大500件まで保持
    if (history.length > 500) {
        history.pop();
    }
    return saveHistory(history);
}

// データリセット
function resetAllData() {
    saveData(STORAGE_KEYS.STATS, DEFAULT_STATS);
    saveData(STORAGE_KEYS.ACTIONS, DEFAULT_ACTIONS);
    saveData(STORAGE_KEYS.HISTORY, []);
}

// データエクスポート
function exportData() {
    return {
        stats: getStats(),
        actions: getActions(),
        history: getHistory(),
        exportedAt: new Date().toISOString()
    };
}

// データインポート
function importData(data) {
    try {
        if (data.stats) saveStats(data.stats);
        if (data.actions) saveActions(data.actions);
        if (data.history) saveHistory(data.history);
        return true;
    } catch (e) {
        console.error('Import error:', e);
        return false;
    }
}
