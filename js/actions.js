/**
 * actions.js - 行動テンプレート管理
 */

// 行動を実行（パラメータ加算＋履歴記録）
function executeAction(actionId) {
    const actions = getActions();
    const action = actions.find(a => a.id === actionId);

    if (!action) {
        console.error('Action not found:', actionId);
        return null;
    }

    const stats = getStats();
    const appliedEffects = [];

    // 各効果を適用
    action.effects.forEach(effect => {
        const stat = stats.find(s => s.id === effect.statId);
        if (stat) {
            stat.value = Math.max(0, stat.value + effect.value);
            appliedEffects.push({
                statId: effect.statId,
                statName: stat.name,
                value: effect.value
            });
        }
    });

    saveStats(stats);

    // 履歴に記録
    addHistoryEntry({
        actionId: action.id,
        actionName: action.name,
        actionIcon: action.icon,
        effects: appliedEffects
    });

    return {
        action,
        effects: appliedEffects
    };
}

// 行動カードのHTML生成
function renderActionCard(action) {
    const stats = getStats();
    const effectsHtml = action.effects.map(effect => {
        const stat = stats.find(s => s.id === effect.statId);
        const statName = stat ? stat.name : effect.statId;
        const sign = effect.value >= 0 ? '+' : '';
        const className = effect.value >= 0 ? 'positive' : 'negative';
        return `<span class="action-effect ${className}">${statName} ${sign}${effect.value}</span>`;
    }).join('');

    return `
    <div class="card action-card" data-action-id="${action.id}">
      <div class="card-header">
        <span class="card-title">${action.icon} ${action.name}</span>
      </div>
      <div class="action-effects">
        ${effectsHtml}
      </div>
    </div>
  `;
}

// 全行動カードを描画
function renderAllActions() {
    const actions = getActions();
    return actions.map(action => renderActionCard(action)).join('');
}

// 新しい行動テンプレートを追加
function addAction(name, icon, effects) {
    const actions = getActions();
    const newAction = {
        id: 'a' + Date.now(),
        name,
        icon,
        effects
    };
    actions.push(newAction);
    saveActions(actions);
    return newAction;
}

// 行動テンプレートを編集
function updateAction(actionId, name, icon, effects) {
    const actions = getActions();
    const index = actions.findIndex(a => a.id === actionId);
    if (index !== -1) {
        actions[index] = { ...actions[index], name, icon, effects };
        saveActions(actions);
        return actions[index];
    }
    return null;
}

// 行動テンプレートを削除
function deleteAction(actionId) {
    const actions = getActions();
    const filtered = actions.filter(a => a.id !== actionId);
    saveActions(filtered);
    return filtered;
}
