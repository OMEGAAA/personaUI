/**
 * todo.js - ToDoリスト管理
 * カレンダーの日付ごとにタスクを管理する
 */

// 定数
const STORAGE_KEY_TODO = 'persona_todos';

// ToDoデータ取得
function getTodos() {
    const data = localStorage.getItem(STORAGE_KEY_TODO);
    return data ? JSON.parse(data) : [];
}

// ToDoデータ保存
function saveTodos(todos) {
    localStorage.setItem(STORAGE_KEY_TODO, JSON.stringify(todos));
}

// 指定日のToDo取得
function getTodosByDate(dateStr) {
    const todos = getTodos();
    return todos.filter(todo => todo.date === dateStr);
}

// ToDo追加
function addTodo(text, dateStr) {
    const todos = getTodos();
    const newTodo = {
        id: 'todo_' + Date.now(),
        text: text,
        date: dateStr,
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    saveTodos(todos);
    return newTodo;
}

// ToDo完了状態切り替え
function toggleTodo(todoId) {
    const todos = getTodos();
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos(todos);
    }
    return todo;
}

// ToDo削除
function deleteTodo(todoId) {
    let todos = getTodos();
    todos = todos.filter(t => t.id !== todoId);
    saveTodos(todos);
}

// ToDoリストHTML生成
function renderTodoList(dateStr) {
    const todos = getTodosByDate(dateStr);

    if (todos.length === 0) {
        return '<div class="todo-empty">タスクはありません</div>';
    }

    return todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-checkbox">
                ${todo.completed ? '✔' : ''}
            </div>
            <div class="todo-text">${escapeHtml(todo.text)}</div>
            <button class="todo-delete-btn" aria-label="削除">×</button>
        </div>
    `).join('');
}

// HTMLエスケープ
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
