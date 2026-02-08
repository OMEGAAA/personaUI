/**
 * app.js - メインアプリケーション
 */

// 現在の画面
let currentScreen = 'dashboard';

// 画面を切り替え
function switchScreen(screenName) {
  currentScreen = screenName;

  // 全画面を非表示
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // 指定画面を表示
  const targetScreen = document.getElementById(`screen-${screenName}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // ナビゲーションのアクティブ状態更新
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.screen === screenName) {
      item.classList.add('active');
    }
  });

  // 画面ごとの描画
  renderCurrentScreen();
}

// 現在の画面を描画
function renderCurrentScreen() {
  switch (currentScreen) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'actions':
      renderActionsScreen();
      break;
    case 'coop':
      renderCoopScreen();
      break;
    case 'history':
      renderHistoryScreen();
      break;
    case 'settings':
      renderSettingsScreen();
      break;
  }
}

// ダッシュボード描画
function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  const stats = getStats();

  let html = renderSummaryCard(stats);
  html += '<div class="stats-grid">';
  stats.forEach(stat => {
    html += renderStatCard(stat, true);
  });

  // メメントスボタンをグリッド内に追加（魅力の横＝最後の要素として）
  html += `
    <div class="card stat-card mementos-card" id="btn-mementos">
      <div class="stat-icon">🧠</div>
      <div class="stat-info">
        <div class="stat-name">MEMENTOS</div>
        <div class="stat-rank">Metacognition</div>
      </div>
    </div>
  `;
  html += '</div>';

  container.innerHTML = html;

  // イベント設定
  document.getElementById('btn-mementos').addEventListener('click', () => showMementosModal(1));
}

// 行動画面描画
function renderActionsScreen() {
  const container = document.getElementById('actions-content');
  container.innerHTML = renderAllActions();

  // クリックイベント設定
  container.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const actionId = card.dataset.actionId;
      handleActionClick(actionId);
    });
  });
}

// コープ画面描画
function renderCoopScreen() {
  const container = document.getElementById('coop-content');
  container.innerHTML = renderAllCoops();

  // コープ追加ボタン
  const addBtn = document.getElementById('btn-add-coop') || document.getElementById('btn-add-first-coop');
  if (addBtn) {
    addBtn.addEventListener('click', showAddCoopModal);
  }

  // リスト項目クリックで詳細表示
  container.querySelectorAll('.coop-item').forEach(item => {
    item.addEventListener('click', () => {
      const coopId = item.dataset.coopId;
      showCoopDetailModal(coopId);
    });
  });

  // 全コープ削除ボタン
  const deleteAllBtn = document.getElementById('btn-delete-all-coops');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      if (confirm('本当に全てのコープデータを削除しますか？\nこの操作は取り消せません。')) {
        deleteAllCoops();
        showToast('全てのコープデータを削除しました', 'success');
        renderCoopScreen();
      }
    });
  }
}

// コープ追加モーダル
function showAddCoopModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');

  const categoriesHtml = COOP_CATEGORIES.map(cat =>
    `<option value="${cat.id}">${cat.name}</option>`
  ).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">コープを追加</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">名前</label>
      <input type="text" class="form-input" id="coop-name" placeholder="例: 田中さん">
    </div>
    <div class="form-group">
      <label class="form-label">カテゴリ</label>
      <select class="form-input" id="coop-category">
        ${categoriesHtml}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">次にやること（任意）</label>
      <input type="text" class="form-input" id="coop-note" placeholder="例: 来週食事に誘う">
    </div>
    <button class="btn btn-primary btn-full" id="save-coop">追加</button>
  `;

  overlay.classList.add('active');

  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('save-coop').onclick = () => {
    const name = document.getElementById('coop-name').value.trim();
    const category = document.getElementById('coop-category').value;
    const note = document.getElementById('coop-note').value.trim();

    if (!name) {
      showToast('名前を入力してください', 'error');
      return;
    }

    addCoop(name, category, note ? `次にやること: ${note}` : '');
    showToast('コープを追加しました', 'success');
    closeModal();
    renderCoopScreen();
  };
}

// コープ詳細モーダル
function showCoopDetailModal(coopId) {
  const coops = getCoops();
  const coop = coops.find(c => c.id === coopId);
  if (!coop) return;

  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');

  // ランクと進捗
  const rank = getCoopRank(coop.points);
  const rankName = COOP_RANK_NAMES[rank];
  const { progress, remaining, nextRank } = getCoopProgress(coop.points);
  const starsFilled = rank + 1;
  const starsEmpty = 10 - starsFilled;
  const starsHtml = '★'.repeat(starsFilled) + '<span style="opacity:0.2">★</span>'.repeat(starsEmpty);

  const logsHtml = coop.logs.slice(0, 5).map(log => `
    <div class="coop-log-item">
      <span class="coop-log-action">${log.actionName}</span>
      <span class="coop-log-points">+${log.points}</span>
      <span class="coop-log-date">${formatCoopDate(log.timestamp)}</span>
    </div>
  `).join('') || '<div style="color: var(--persona-light-gray); font-size:0.9rem;">ログがありません</div>';

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">${coop.name}</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 1.2rem; color: var(--persona-yellow); margin-bottom: 5px;">${starsHtml}</div>
      <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem;">${rankName}</div>
      ${nextRank ? `
        <div style="font-size: 0.9rem; color: var(--persona-light-gray); margin-top: 5px;">
          Next: ${nextRank}まであと${remaining}pt
        </div>
        <div class="coop-progress" style="margin-top: 10px;">
          <div class="coop-progress-bar" style="width: ${progress}%"></div>
        </div>
      ` : '<div style="color: var(--persona-yellow); font-weight: bold; margin-top: 10px;">RELATIONSHIP MAX!</div>'}
    </div>

    <div class="form-group">
      <label class="form-label">アクションを実行（ポイント加算）</label>
      <div class="coop-actions-grid">
        ${COOP_ACTIONS.map(action => `
          <button class="btn btn-outline coop-detail-action-btn" data-action="${action.id}">
            ${action.name} (+${action.points})
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">次にやること（メモ）</label>
      <input type="text" class="form-input" id="coop-note-edit" value="${coop.note || ''}" placeholder="次にやること...">
      <button class="btn btn-secondary btn-full" id="save-note" style="margin-top: 8px;">メモを保存</button>
    </div>

    <div class="form-group">
      <label class="form-label">最近のログ</label>
      <div class="coop-logs">${logsHtml}</div>
    </div>
    
    <button class="btn btn-danger btn-full" id="delete-coop" style="margin-top: 24px;">このコープを削除</button>
  `;

  overlay.classList.add('active');

  // イベント設定
  document.getElementById('modal-close').onclick = closeModal;

  // アクションボタンイベント
  modal.querySelectorAll('.coop-detail-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionId = btn.dataset.action;
      const result = executeCoopAction(coopId, actionId);
      if (result) {
        if (result.rankUp) {
          showToast(`${result.coop.name}がランクアップ！`, 'success');
        } else {
          showToast(`${result.action.name}を実行 (+${result.action.points}pt)`, 'success');
        }
        // モーダルを閉じずに再描画して内容を更新
        showCoopDetailModal(coopId);
        // 裏側のリストも更新しておく
        renderCoopScreen();
      }
    });
  });

  document.getElementById('save-note').onclick = () => {
    const note = document.getElementById('coop-note-edit').value.trim();
    updateCoopNote(coopId, note);
    showToast('メモを更新しました', 'success');
    renderCoopScreen();
  };

  document.getElementById('delete-coop').onclick = () => {
    if (confirm('本当に削除しますか？')) {
      deleteCoop(coopId);
      showToast('コープを削除しました', 'success');
      closeModal();
      renderCoopScreen();
    }
  };
}

// 履歴画面描画
function renderHistoryScreen() {
  const container = document.getElementById('history-content');
  container.innerHTML = renderHistory();
}

// 設定画面描画
function renderSettingsScreen() {
  const container = document.getElementById('settings-content');
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">データ管理</div>
      <div class="settings-item" id="btn-export">
        <span class="settings-item-label">データをエクスポート</span>
        <span class="settings-item-arrow">›</span>
      </div>
      <div class="settings-item" id="btn-import">
        <span class="settings-item-label">データをインポート</span>
        <span class="settings-item-arrow">›</span>
      </div>
      <div class="settings-item" id="btn-reset">
        <span class="settings-item-label">データをリセット</span>
        <span class="settings-item-arrow">›</span>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="settings-section-title">パラメータ編集</div>
      <div class="settings-item" id="btn-edit-stats">
        <span class="settings-item-label">パラメータを編集</span>
        <span class="settings-item-arrow">›</span>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="settings-section-title">行動テンプレート編集</div>
      <div class="settings-item" id="btn-edit-actions">
        <span class="settings-item-label">行動テンプレートを編集</span>
        <span class="settings-item-arrow">›</span>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="settings-section-title">アプリ情報</div>
      <div class="settings-item" style="cursor: default;">
        <span class="settings-item-label">バージョン</span>
        <span style="color: var(--text-muted);">1.0.0</span>
      </div>
    </div>
  `;

  // イベント設定
  document.getElementById('btn-export').addEventListener('click', handleExport);
  document.getElementById('btn-import').addEventListener('click', handleImport);
  document.getElementById('btn-reset').addEventListener('click', handleReset);
  document.getElementById('btn-edit-stats').addEventListener('click', showEditStatsModal);
  document.getElementById('btn-edit-actions').addEventListener('click', showEditActionsModal);
}

// 行動クリック処理
function handleActionClick(actionId) {
  const result = executeAction(actionId);
  if (result) {
    const effectsText = result.effects.map(e => {
      const sign = e.value >= 0 ? '+' : '';
      return `${e.statName} ${sign}${e.value}`;
    }).join(', ');

    // 音符アニメーションを表示
    result.effects.forEach(effect => {
      if (effect.value > 0) {
        showNoteAnimation(effect.value, effect.statName);
      }
    });

    showToast(`${result.action.icon} ${result.action.name}を実行！ (${effectsText})`, 'success');

    // ダッシュボードが表示されていれば更新
    if (currentScreen === 'dashboard') {
      renderDashboard();
    }
  }
}

// 音符アニメーション表示
function showNoteAnimation(points, statName) {
  // ポイントに応じた音符の数を決定
  let noteCount = 1;
  if (points >= 5) {
    noteCount = 3;
  } else if (points >= 3) {
    noteCount = 2;
  }

  // 音符コンテナを作成
  const container = document.createElement('div');
  container.className = 'note-animation-container';

  // 音符を追加
  for (let i = 0; i < noteCount; i++) {
    const note = document.createElement('div');
    note.className = 'note-animation';
    note.textContent = '♪';
    note.style.animationDelay = `${i * 0.15}s`;
    note.style.left = `${40 + i * 20}%`;
    container.appendChild(note);
  }

  // ポイント表示を追加
  const pointsDisplay = document.createElement('div');
  pointsDisplay.className = 'points-animation';
  pointsDisplay.textContent = `+${points}`;
  container.appendChild(pointsDisplay);

  document.body.appendChild(container);

  // アニメーション終了後に削除
  setTimeout(() => {
    container.remove();
  }, 1500);
}

// エクスポート処理
function handleExport() {
  const data = exportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `persona-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast('データをエクスポートしました', 'success');
}

// インポート処理
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (importData(data)) {
          showToast('データをインポートしました', 'success');
          renderCurrentScreen();
        } else {
          showToast('インポートに失敗しました', 'error');
        }
      } catch (err) {
        showToast('ファイルの読み込みに失敗しました', 'error');
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

// リセット処理
function handleReset() {
  showConfirmModal('本当にすべてのデータをリセットしますか？', () => {
    resetAllData();
    showToast('データをリセットしました', 'success');
    renderCurrentScreen();
  });
}

// トースト表示
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// 確認モーダル表示
function showConfirmModal(message, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">確認</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <p style="margin-bottom: 20px; color: var(--text-secondary);">${message}</p>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" id="modal-cancel" style="flex: 1;">キャンセル</button>
      <button class="btn btn-danger" id="modal-confirm" style="flex: 1;">実行</button>
    </div>
  `;

  overlay.classList.add('active');

  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-confirm').onclick = () => {
    onConfirm();
    closeModal();
  };
}

// パラメータ編集モーダル
function showEditStatsModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const stats = getStats();

  let statsHtml = stats.map(stat => `
    <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
      <span style="font-size: 1.5rem;">${stat.icon}</span>
      <input type="text" class="form-input" value="${stat.name}" data-stat-id="${stat.id}" data-field="name" style="flex: 1;">
      <input type="number" class="form-input" value="${stat.value}" data-stat-id="${stat.id}" data-field="value" style="width: 80px;">
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">パラメータ編集</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <div style="max-height: 300px; overflow-y: auto;">
      ${statsHtml}
    </div>
    <button class="btn btn-primary btn-full" id="save-stats" style="margin-top: 16px;">保存</button>
  `;

  overlay.classList.add('active');

  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('save-stats').onclick = () => {
    const updatedStats = stats.map(stat => {
      const nameInput = document.querySelector(`input[data-stat-id="${stat.id}"][data-field="name"]`);
      const valueInput = document.querySelector(`input[data-stat-id="${stat.id}"][data-field="value"]`);
      return {
        ...stat,
        name: nameInput.value,
        value: parseInt(valueInput.value) || 0
      };
    });
    saveStats(updatedStats);
    showToast('パラメータを更新しました', 'success');
    closeModal();
    renderCurrentScreen();
  };
}

// 行動テンプレート編集モーダル
function showEditActionsModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const actions = getActions();

  let actionsHtml = actions.map(action => `
    <div class="card" style="padding: 12px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${action.icon} ${action.name}</span>
        <button class="btn btn-danger" data-delete="${action.id}" style="padding: 4px 12px; font-size: 0.8rem;">削除</button>
      </div>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">行動テンプレート編集</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
      ${actionsHtml}
    </div>
    <button class="btn btn-primary btn-full" id="add-action">+ 新しい行動を追加</button>
  `;

  overlay.classList.add('active');

  document.getElementById('modal-close').onclick = closeModal;

  // 削除ボタン
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => {
      deleteAction(btn.dataset.delete);
      showToast('行動を削除しました', 'success');
      showEditActionsModal(); // 再描画
    };
  });

  // 追加ボタン
  document.getElementById('add-action').onclick = showAddActionModal;
}

// 行動追加モーダル
function showAddActionModal() {
  const modal = document.getElementById('modal');
  const stats = getStats();

  let effectsHtml = stats.map(stat => `
    <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
      <span style="flex: 1;">${stat.icon} ${stat.name}</span>
      <input type="number" class="form-input" id="effect-${stat.id}" value="0" style="width: 80px;">
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">新しい行動を追加</span>
      <button class="modal-close" id="modal-close">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">行動名</label>
      <input type="text" class="form-input" id="action-name" placeholder="例: 筋トレ">
    </div>
    <div class="form-group">
      <label class="form-label">アイコン（絵文字）</label>
      <input type="text" class="form-input" id="action-icon" placeholder="例: 🏋️" maxlength="4">
    </div>
    <div class="form-group">
      <label class="form-label">効果（各パラメータへの増減）</label>
      ${effectsHtml}
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" id="back-to-list" style="flex: 1;">戻る</button>
      <button class="btn btn-primary" id="save-action" style="flex: 1;">追加</button>
    </div>
  `;

  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('back-to-list').onclick = showEditActionsModal;
  document.getElementById('save-action').onclick = () => {
    const name = document.getElementById('action-name').value.trim();
    const icon = document.getElementById('action-icon').value.trim() || '⚡';

    if (!name) {
      showToast('行動名を入力してください', 'error');
      return;
    }

    const effects = [];
    stats.forEach(stat => {
      const value = parseInt(document.getElementById(`effect-${stat.id}`).value) || 0;
      if (value !== 0) {
        effects.push({ statId: stat.id, value });
      }
    });

    if (effects.length === 0) {
      showToast('少なくとも1つの効果を設定してください', 'error');
      return;
    }

    addAction(name, icon, effects);
    showToast('行動を追加しました', 'success');
    showEditActionsModal();
  };
}

// メメントスモーダル表示
function showMementosModal(depth = 1) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const depthInfo = MEMENTOS_DEPTHS[depth];

  const renderContent = (currentDepth) => {
    const listHtml = renderMementosList(currentDepth);
    const depthObj = MEMENTOS_DEPTHS[currentDepth];

    // 深さタブの生成
    let tabsHtml = '<div class="mementos-depth-nav">';
    for (let d = 1; d <= MEMENTOS_MAX_DEPTH; d++) {
      const info = MEMENTOS_DEPTHS[d];
      const activeClass = d === currentDepth ? 'active' : '';
      tabsHtml += `<button class="depth-tab ${activeClass}" data-depth="${d}">${info.name}</button>`;
    }
    tabsHtml += '</div>';

    modal.innerHTML = `
      <div class="modal-header" style="border-bottom-color: var(--persona-red);">
        <span class="modal-title" style="color: var(--persona-red);">MEMENTOS</span>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      
      ${tabsHtml}
      
      <div style="text-align: center; margin-bottom: 10px; color: var(--persona-light-gray); font-size: 0.9rem;">
        ${depthObj.desc}
      </div>

      <div class="mementos-list" id="mementos-list-container">
        ${listHtml}
      </div>
      
      <div class="mementos-input-area">
        <label class="form-label">アイデアを深層へ...</label>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-input" id="mementos-input" placeholder="思いつきを入力..." style="flex: 1;">
            <input type="text" class="form-input" id="mementos-tags" placeholder="タグ (UI, DEV...)" style="width: 30%;">
        </div>
        <button class="btn btn-primary btn-full" id="add-mementos-btn" style="background: var(--persona-red); border-color: var(--persona-red);">記録する</button>
      </div>
    `;

    // イベント設定
    document.getElementById('modal-close').onclick = closeModal;

    // タブ切り替え
    modal.querySelectorAll('.depth-tab').forEach(tab => {
      tab.onclick = () => {
        renderContent(parseInt(tab.dataset.depth));
      };
    });

    // 追加ボタン
    document.getElementById('add-mementos-btn').onclick = () => {
      const content = document.getElementById('mementos-input').value.trim();
      const tagsStr = document.getElementById('mementos-tags').value.trim();

      if (content) {
        const tags = tagsStr ? tagsStr.split(/[, ]+/).filter(t => t) : [];
        addMemento(content, tags);
        showToast('メメントスに記録しました', 'success');
        renderContent(currentDepth); // 入力欄クリアさせたいが...再描画でOK
      }
    };

    // Enterキー
    document.getElementById('mementos-input').onkeypress = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('add-mementos-btn').click();
      }
    };

    // リスト内アクション
    const container = document.getElementById('mementos-list-container');
    container.querySelectorAll('.mementos-item').forEach(item => {
      const id = item.dataset.id;

      // 深める
      const deepenBtn = item.querySelector('.btn-deepen');
      if (deepenBtn) {
        deepenBtn.onclick = () => {
          if (changeMementoDepth(id, 1)) {
            renderContent(currentDepth);
            showToast('思考が深まりました...', 'success');
          }
        };
      }

      // 浮上させる
      const floatBtn = item.querySelector('.btn-float');
      if (floatBtn) {
        floatBtn.onclick = () => {
          if (changeMementoDepth(id, -1)) {
            renderContent(currentDepth);
          }
        };
      }

      // タスク化
      const materializeBtn = item.querySelector('.btn-materialize');
      if (materializeBtn) {
        materializeBtn.onclick = () => {
          //今日の日付でタスク化
          const today = new Date();
          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const d = String(today.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          if (convertMementoToTask(id, dateStr)) {
            showToast('現実世界に具現化（タスク化）しました', 'success');
            renderContent(currentDepth);
          }
        };
      }

      // 編集（簡易的にpromptで）
      const editBtn = item.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.onclick = () => {
          const list = getMementos();
          const target = list.find(m => m.id === id);
          if (target) {
            const newContent = prompt('内容を編集:', target.content);
            if (newContent !== null) {
              const newTagsStr = prompt('タグを編集 (スペース区切り):', target.tags.join(' '));
              const newTags = newTagsStr !== null ? newTagsStr.split(/[, ]+/).filter(t => t) : target.tags;
              updateMemento(id, newContent, newTags);
              renderContent(currentDepth);
            }
          }
        };
      }
    });
  };

  renderContent(depth);
  overlay.classList.add('active');
}
function showTodoModal(dateStr) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');

  // 日付フォーマット (YYYY-MM-DD -> M月D日)
  const [y, m, d] = dateStr.split('-');
  const dateDisplay = `${parseInt(m)}月${parseInt(d)}日`;

  const renderModalContent = () => {
    const todoListHtml = renderTodoList(dateStr);

    modal.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">${dateDisplay}のToDo</span>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      
      <div class="form-group" style="display: flex; gap: 8px;">
        <input type="text" class="form-input" id="todo-input" placeholder="タスクを入力..." style="flex: 1;">
        <button class="btn btn-primary" id="add-todo-btn" style="width: 60px;">追加</button>
      </div>

      <div class="todo-list" id="todo-list-container">
        ${todoListHtml}
      </div>
    `;

    // イベント設定
    document.getElementById('modal-close').onclick = closeModal;

    document.getElementById('add-todo-btn').onclick = () => {
      const input = document.getElementById('todo-input');
      const text = input.value.trim();
      if (text) {
        addTodo(text, dateStr);
        // リストだけ再描画（入力欄はクリア）
        renderModalContent();
      }
    };

    // 入力欄でEnterキー
    document.getElementById('todo-input').onkeypress = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('add-todo-btn').click();
      }
    };

    // リスト内イベント（完了・削除）
    const container = document.getElementById('todo-list-container');
    container.querySelectorAll('.todo-item').forEach(item => {
      const id = item.dataset.id;

      // クリックで完了切り替え
      item.addEventListener('click', (e) => {
        // 削除ボタンクリック時は除外
        if (e.target.closest('.todo-delete-btn')) return;

        toggleTodo(id);
        renderModalContent();
      });

      // 削除ボタン
      const deleteBtn = item.querySelector('.todo-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('このタスクを削除しますか？')) {
            deleteTodo(id);
            renderModalContent();
          }
        });
      }
    });

    // 入力欄にフォーカス
    const input = document.getElementById('todo-input');
    if (input) input.focus();
  };

  renderModalContent();
  overlay.classList.add('active');
}

// モーダルを閉じる
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

// 初期化
function initApp() {
  // ストレージ初期化
  initializeStorage();

  // ナビゲーションイベント設定
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchScreen(item.dataset.screen);
    });
  });

  // モーダルオーバーレイクリックで閉じる
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
      closeModal();
    }
  });

  // スワイプナビゲーション設定
  setupSwipeNavigation();

  // 初期画面描画
  switchScreen('dashboard');
}

// スワイプナビゲーション設定
function setupSwipeNavigation() {
  const screens = ['dashboard', 'actions', 'coop', 'history', 'settings'];
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 50;

  const mainContent = document.querySelector('.main-content');

  mainContent.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // 水平方向のスワイプのみ処理（垂直より大きい場合）
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      const currentIndex = screens.indexOf(currentScreen);

      if (deltaX < 0) {
        // 左スワイプ → 次の画面
        const nextIndex = (currentIndex + 1) % screens.length;
        switchScreen(screens[nextIndex]);
      } else {
        // 右スワイプ → 前の画面
        const prevIndex = (currentIndex - 1 + screens.length) % screens.length;
        switchScreen(screens[prevIndex]);
      }
    }
  }
}

// Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
