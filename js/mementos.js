/**
 * mementos.js - アイデア整理（メメントス）
 * 思いつきを「深層」へ沈めていく整理術
 */

// 定数
const STORAGE_KEY_MEMENTOS = 'persona_mementos';
const MEMENTOS_MAX_DEPTH = 3;

// 深度定義
const MEMENTOS_DEPTHS = {
    1: { name: '入口 (Entrance)', class: 'depth-1', desc: '思いつき・未整理' },
    2: { name: '思想回廊 (Path)', class: 'depth-2', desc: '思考中・タグ付け済' },
    3: { name: '深層 (Core)', class: 'depth-3', desc: '重要・タスク化待ち' }
};

// データ構造
// {
//   id: string,
//   content: string,
//   tags: string[],
//   depth: number (1-3),
//   status: 'active' | 'archived' | 'converted',
//   createdAt: string,
//   updatedAt: string
// }

// データ取得
function getMementos() {
    const data = localStorage.getItem(STORAGE_KEY_MEMENTOS);
    return data ? JSON.parse(data) : [];
}

// データ保存
function saveMementos(list) {
    localStorage.setItem(STORAGE_KEY_MEMENTOS, JSON.stringify(list));
}

// 新規アイデア追加
function addMemento(content, tags = []) {
    const list = getMementos();
    const newItem = {
        id: 'mem_' + Date.now(),
        content,
        tags,
        depth: 1, // 初期は深度1
        status: 'active', // active, archived, converted
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    list.unshift(newItem); // 新しいものを先頭に
    saveMementos(list);
    return newItem;
}

// アイデア更新（内容・タグ）
function updateMemento(id, content, tags) {
    const list = getMementos();
    const item = list.find(m => m.id === id);
    if (item) {
        item.content = content;
        item.tags = tags;
        item.updatedAt = new Date().toISOString();
        saveMementos(list);
    }
    return item;
}

// 深度変更（沈める/浮上させる）
function changeMementoDepth(id, delta) {
    const list = getMementos();
    const item = list.find(m => m.id === id);
    if (item) {
        const newDepth = item.depth + delta;
        if (newDepth >= 1 && newDepth <= MEMENTOS_MAX_DEPTH) {
            item.depth = newDepth;
            item.updatedAt = new Date().toISOString();
            saveMementos(list);
            return true;
        }
    }
    return false;
}

// 削除（アーカイブ）
function deleteMemento(id) {
    const list = getMementos();
    const item = list.find(m => m.id === id);
    if (item) {
        // 物理削除せずアーカイブにする場合はこちら
        // item.status = 'archived'; 
        // 今回は物理削除
        const newList = list.filter(m => m.id !== id);
        saveMementos(newList);
    }
}

// タスク化（ToDoへ変換）
// todo.jsのaddTodoに依存
function convertMementoToTask(id, dateStr) {
    const list = getMementos();
    const item = list.find(m => m.id === id);

    if (item && typeof addTodo === 'function') {
        const taskText = `[${item.tags.join('/')}] ${item.content}`;
        addTodo(taskText, dateStr);

        item.status = 'converted';
        item.updatedAt = new Date().toISOString();
        saveMementos(list);
        return true;
    }
    return false;
}

// 表示用HTML生成
function renderMementosList(depth = 1) {
    const list = getMementos().filter(m => m.depth === depth && m.status === 'active');

    if (list.length === 0) {
        return '<div class="mementos-empty">ここに思考の痕跡はない...</div>';
    }

    return list.map(item => `
        <div class="mementos-item depth-${item.depth}" data-id="${item.id}">
            <div class="mementos-content">${escapeHtml(item.content)}</div>
            <div class="mementos-tags">
                ${item.tags.map(tag => `<span class="mementos-tag">#${tag}</span>`).join('')}
            </div>
            <div class="mementos-actions">
                ${item.depth > 1 ? '<button class="btn-float">▲ 浮上</button>' : ''}
                <button class="btn-edit">編集</button>
                ${item.depth < MEMENTOS_MAX_DEPTH ? '<button class="btn-deepen">▼ 沈める</button>' : '<button class="btn-materialize">★ タスク化</button>'}
            </div>
        </div>
    `).join('');
}
