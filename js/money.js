/**
 * money.js - 所持金管理機能
 */

// 初期化
function initMoneyDisplay() {
    renderMoney();

    const display = document.getElementById('money-display');
    if (display) {
        display.addEventListener('click', showMoneyModal);
    }
}

// 描画
function renderMoney() {
    const amount = getMoney();
    const display = document.getElementById('money-amount');
    if (display) {
        // 3桁区切り
        display.textContent = amount.toLocaleString();
    }
}

// モーダル表示
function showMoneyModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    const current = getMoney();

    modal.innerHTML = `
        <div class="modal-header" style="border-bottom-color: var(--persona-yellow);">
            <span class="modal-title" style="color: var(--persona-yellow);">ASSETS MANAGER</span>
            <button class="modal-close" id="modal-close">&times;</button>
        </div>
        
        <div style="padding: 20px 0;">
            <div class="money-current-wrapper">
                <span class="money-current-label">CURRENT ASSETS</span>
                <div class="money-current-value">
                    <span class="yen-symbol">¥</span>
                    <span>${current.toLocaleString()}</span>
                </div>
            </div>

            <div class="form-group" style="margin-top: 24px;">
                <label class="form-label">INPUT AMOUNT</label>
                <input type="number" class="form-input" id="money-input" placeholder="0" min="1" style="font-size: 1.2rem; font-family: 'Bebas Neue', sans-serif;">
            </div>

            <div style="display: flex; gap: 12px; margin-top: 16px;">
                <button class="btn btn-primary" id="btn-income" style="flex: 1; background-color: var(--persona-blue); border-color: var(--persona-blue);">
                    INCOME (+)
                </button>
                <button class="btn btn-danger" id="btn-expense" style="flex: 1;">
                    EXPENSE (-)
                </button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    document.getElementById('modal-close').onclick = closeModal;

    document.getElementById('btn-income').onclick = () => handleMoneyUpdate(1);
    document.getElementById('btn-expense').onclick = () => handleMoneyUpdate(-1);

    // EnterキーでIncome
    document.getElementById('money-input').focus();
}

// 更新処理
function handleMoneyUpdate(multiplier) {
    const input = document.getElementById('money-input');
    const value = parseInt(input.value);

    if (!value || value <= 0) {
        showToast('数値を入力してください', 'error');
        return;
    }

    const amount = value * multiplier;
    updateMoney(amount);

    const action = amount > 0 ? 'INCOME' : 'EXPENSE';
    const sign = amount > 0 ? '+' : '';
    showToast(`${action}: ${sign}¥${Math.abs(value).toLocaleString()}`, 'success');

    // 履歴に追加
    addHistoryEntry({
        type: 'money',
        amount: amount,
        timestamp: new Date().toISOString()
    });

    renderMoney();
    if (document.getElementById('money-content')) {
        renderMoneyScreen(); // 画面も更新
    }
    closeModal();
}

// クイックアクション用更新処理
function quickUpdateMoney(amount) {
    updateMoney(amount);

    const action = amount > 0 ? 'INCOME' : 'EXPENSE';
    const sign = amount > 0 ? '+' : '';
    showToast(`${action}: ${sign}¥${Math.abs(amount).toLocaleString()}`, 'success');

    // 履歴に追加
    addHistoryEntry({
        type: 'money',
        amount: amount,
        timestamp: new Date().toISOString()
    });

    renderMoney();
    renderMoneyScreen();
}

// 所持金画面描画
function renderMoneyScreen() {
    const container = document.getElementById('money-content');
    const current = getMoney();

    // 履歴を取得（直近10件）
    // ※storage.jsにはマネーログはないので、簡易的に実装するか、今回はUIのみ
    // 将来的には履歴も保存するように修正が必要かも

    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px 20px; margin-bottom: 20px;">
            <div class="money-current-label">CURRENT ASSETS</div>
            <div class="money-current-value" style="font-size: 3.5rem;">
                <span class="yen-symbol">¥</span>
                <span>${current.toLocaleString()}</span>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">QUICK ACTION</label>
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <button class="btn btn-primary" onclick="quickUpdateMoney(100)" style="flex: 1; background-color: var(--persona-blue); border-color: var(--persona-blue);">+ ¥100</button>
                <button class="btn btn-primary" onclick="quickUpdateMoney(1000)" style="flex: 1; background-color: var(--persona-blue); border-color: var(--persona-blue);">+ ¥1,000</button>
                <button class="btn btn-primary" onclick="quickUpdateMoney(10000)" style="flex: 1; background-color: var(--persona-blue); border-color: var(--persona-blue);">+ ¥10,000</button>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="btn btn-danger" onclick="quickUpdateMoney(-100)" style="flex: 1;">- ¥100</button>
                <button class="btn btn-danger" onclick="quickUpdateMoney(-1000)" style="flex: 1;">- ¥1,000</button>
                <button class="btn btn-danger" onclick="quickUpdateMoney(-10000)" style="flex: 1;">- ¥10,000</button>
            </div>
        </div>

        <div class="form-group" style="margin-top: 24px;">
            <label class="form-label">CUSTOM AMOUNT</label>
            <div style="display: flex; gap: 8px;">
                <input type="number" class="form-input" id="money-screen-input" placeholder="0" style="flex: 1;">
                <button class="btn btn-outline" onclick="handleScreenMoneyUpdate(1)">INCOME</button>
                <button class="btn btn-outline" onclick="handleScreenMoneyUpdate(-1)" style="color: var(--persona-red); border-color: var(--persona-red);">EXPENSE</button>
            </div>
        </div>
    `;
}

function handleScreenMoneyUpdate(multiplier) {
    const input = document.getElementById('money-screen-input');
    const value = parseInt(input.value);

    if (!value || value <= 0) {
        showToast('数値を入力してください', 'error');
        return;
    }

    const amount = value * multiplier;
    updateMoney(amount);

    const action = amount > 0 ? 'INCOME' : 'EXPENSE';
    const sign = amount > 0 ? '+' : '';
    showToast(`${action}: ${sign}¥${Math.abs(value).toLocaleString()}`, 'success');

    // 履歴に追加
    addHistoryEntry({
        type: 'money',
        amount: amount,
        timestamp: new Date().toISOString()
    });

    renderMoney(); // 右上の表示更新
    renderMoneyScreen(); // 画面更新
}
