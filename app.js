const firebaseConfig = {
  apiKey: "AIzaSyBcjbR7Qu7M-RnHUtLJ9zeehILqQHYLw4E",
  authDomain: "whatsapp-c10ef.firebaseapp.com",
  databaseURL: "https://whatsapp-c10ef-default-rtdb.firebaseio.com",
  projectId: "whatsapp-c10ef",
  storageBucket: "whatsapp-c10ef.firebasestorage.app",
  messagingSenderId: "675053106773",
  appId: "1:675053106773:web:b7078468691a07ecfec6dc",
  measurementId: "G-89Z8WBJ3R0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dbRef = db.ref('todo_app_data');

// Application State
let state = {
    tasks: [],
    lists: ['Default'],
    currentList: 'Default',
    theme: 'light',
    viewMode: 'active'
};



// Core Functions
function init() {
    loadData();
    applyTheme();
    renderLists();
    renderTasks();
    setDefaultDueDate();
    
    // Attach event listeners for real-time filtering
    ['searchInput', 'filterPriority', 'sortOptions'].forEach(id => {
        document.getElementById(id).addEventListener('input', renderTasks);
    });
    
    // Check reminders every 10 seconds
    setInterval(checkReminders, 10000);
}

function checkReminders() {
    const nowMs = Date.now();
    let needsSave = false;
    
    state.tasks.forEach(task => {
        if (!task.completed && task.reminderDate && !task.reminderNotified) {
            const reminderMs = new Date(task.reminderDate).getTime();
            if (nowMs >= reminderMs) {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("To-Do Reminder!", { body: task.text });
                }
                task.reminderNotified = true;
                needsSave = true;
            }
        }
    });
    
    if (needsSave) {
        state.tasks.forEach(task => {
            if (task.reminderNotified) syncTask(task);
        });
    }
}

function setDefaultDueDate() {
    // Explicitly use Dhaka time (UTC+6)
    const now = new Date();
    const dhakaMs = now.getTime() + (6 * 60 * 60 * 1000);
    const dhakaTime = new Date(dhakaMs);
    
    // Set exactly to current time (no +1 hour offset)
    
    const year = dhakaTime.getUTCFullYear();
    const month = String(dhakaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dhakaTime.getUTCDate()).padStart(2, '0');
    const hours = String(dhakaTime.getUTCHours()).padStart(2, '0');
    const minutes = String(dhakaTime.getUTCMinutes()).padStart(2, '0');
    
    document.getElementById('taskDueDate').value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

function loadData() {
    // Firebase Instant Sync Listener using compat API
    dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (Array.isArray(data.tasks)) {
                state.tasks = data.tasks.filter(t => t !== null);
            } else if (typeof data.tasks === 'object' && data.tasks !== null) {
                state.tasks = Object.values(data.tasks).filter(t => t !== null);
            } else {
                state.tasks = [];
            }
            
            if (Array.isArray(data.lists)) {
                state.lists = data.lists.filter(l => l !== null);
            } else if (typeof data.lists === 'object' && data.lists !== null) {
                state.lists = Object.values(data.lists).filter(l => l !== null);
            } else {
                state.lists = ['Default'];
            }
            state.theme = data.theme || 'light';
        }
        // Force UI updates when cloud data arrives
        applyTheme();
        renderLists();
        renderTasks();
        updateStats();
    });
}

function syncTask(task) {
    dbRef.child('tasks').child(task.id).set(task);
}

function syncDeleteTask(taskId) {
    dbRef.child('tasks').child(taskId).remove();
}

function syncAllTasks() {
    let updates = {};
    state.tasks.forEach(t => { updates[t.id] = t; });
    dbRef.child('tasks').set(updates);
}

function syncLists() {
    dbRef.child('lists').set(state.lists);
}

function syncTheme() {
    dbRef.child('theme').set(state.theme);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Rendering
function updateStats() {
    const listTasks = state.tasks.filter(t => t.list === state.currentList && !t.archived);
    const total = listTasks.length;
    const completed = listTasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = listTasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    let html = `
        <div>Total: <strong>${total}</strong></div>
        <div>Completed: <strong>${completed}</strong></div>
        <div>Pending: <strong>${pending}</strong></div>
    `;
    if (overdue > 0) {
        html += `<div style="color:var(--danger)">Overdue: <strong>${overdue}</strong></div>`;
    }
    
    html += `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
        <div style="font-size: 0.85em; text-align: right;">${percent}% Completed (${completed}/${total})</div>
    `;
    
    document.getElementById('statsContainer').innerHTML = html;
    
    // Update view button weights
    document.getElementById('viewActiveBtn').style.fontWeight = state.viewMode === 'active' ? 'bold' : 'normal';
    document.getElementById('viewCompletedBtn').style.fontWeight = state.viewMode === 'completed' ? 'bold' : 'normal';
    document.getElementById('viewArchiveBtn').style.fontWeight = state.viewMode === 'archived' ? 'bold' : 'normal';
}

function renderLists() {
    const container = document.getElementById('listsContainer');
    container.innerHTML = state.lists.map(list => {
        let btn = list !== 'Default' ? `<button class="delete-list-btn" data-name="${escapeHtml(list)}">X</button>` : '';
        return `
        <div class="list-item ${list === state.currentList ? 'active' : ''}" data-name="${escapeHtml(list)}">
            <span>${escapeHtml(list)}</span>
            ${btn}
        </div>
        `;
    }).join('');
}

function getFilteredAndSortedTasks() {
    let list = state.tasks.filter(t => t.list === state.currentList);
    
    if (state.viewMode === 'archived') {
        list = list.filter(t => t.archived);
    } else if (state.viewMode === 'completed') {
        list = list.filter(t => t.completed && !t.archived);
    } else {
        // active view shows only pending tasks
        list = list.filter(t => !t.completed && !t.archived);
    }

    const search = document.getElementById('searchInput').value.toLowerCase();
    const fPriority = document.getElementById('filterPriority').value;
    const sort = document.getElementById('sortOptions').value;
    
    list = list.filter(t => {
        const matchesSearch = t.text.toLowerCase().includes(search) || (t.notes && t.notes.toLowerCase().includes(search));
        const matchesPriority = fPriority === 'All' || t.priority === fPriority;
        
        return matchesSearch && matchesPriority;
    });

    list.sort((a, b) => {
        if (sort === 'default') {
            return (a.order || 0) - (b.order || 0);
        } else if (sort === 'alpha') {
            return a.text.localeCompare(b.text);
        } else if (sort === 'dueDate') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (sort === 'priority') {
            const p = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return (p[b.priority] || 0) - (p[a.priority] || 0);
        }
    });

    return list;
}

function parseMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHtml(text);
    // Bold
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Links
    parsed = parsed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#0066cc;">$1</a>');
    return parsed;
}

function renderTasks() {
    const listEl = document.getElementById('taskList');
    const tasks = getFilteredAndSortedTasks();
    
    if (tasks.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 20px; color: gray;">No tasks found.</div>`;
        updateStats();
        return;
    }

    listEl.innerHTML = tasks.map(task => {
        let isOverdue = false;
        let formattedDate = '';
        if (task.dueDate) {
            const d = new Date(task.dueDate);
            formattedDate = d.toLocaleString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' });
            if (!task.completed && d < new Date()) {
                isOverdue = true;
            }
        }

        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            subtasksHtml = `<ul class="subtasks">` + task.subtasks.map(st => `
                <li class="subtask-item">
                    <input type="checkbox" class="subtask-checkbox" data-taskid="${task.id}" data-subtaskid="${st.id}" ${st.completed ? 'checked' : ''}>
                    <span style="${st.completed ? 'text-decoration:line-through;color:gray;' : ''}">${escapeHtml(st.text)}</span>
                </li>
            `).join('') + `</ul>`;
        }

        let notesHtml = '';
        if (task.notes) {
            notesHtml = `<div class="notes-section">${parseMarkdown(task.notes)}</div>`;
        }
        
        let archiveBtn = state.viewMode !== 'archived' ? `<button class="archive-btn" data-id="${task.id}">Archive</button>` : '';
        let unarchiveBtn = state.viewMode === 'archived' ? `<button class="unarchive-btn" data-id="${task.id}">Unarchive</button>` : '';
        let catHtml = task.category ? `<span>🏷️ ${escapeHtml(task.category)}</span>` : '';
        let dateHtml = formattedDate ? `<span style="${isOverdue ? 'color:var(--danger);font-weight:bold;' : ''}">📅 Due: ${formattedDate}</span>` : '';
        
        let reminderHtml = '';
        if (task.reminderDate) {
            const rDate = new Date(task.reminderDate).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' });
            reminderHtml = `<span style="color: #0066cc;">🔔 Reminder: ${rDate}</span>`;
        }
        
        let recurHtml = task.recurring && task.recurring !== 'None' ? `<span>🔁 ${task.recurring}</span>` : '';

        return `
            <li class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}" draggable="true">
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} style="transform: scale(1.2);">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <button class="edit-btn" data-id="${task.id}">Edit</button>
                    <button class="delete-btn" data-id="${task.id}" style="color:var(--danger)">Delete</button>
                    ${archiveBtn}
                    ${unarchiveBtn}
                </div>
                <div class="task-meta">
                    <span class="priority-${task.priority}">[${task.priority}]</span>
                    ${catHtml}
                    ${dateHtml}
                    ${reminderHtml}
                    ${recurHtml}
                </div>
                ${notesHtml}
                ${subtasksHtml}
            </li>
        `;
    }).join('');
    
    updateStats();
}

// Actions
function addTask() {
    const textEl = document.getElementById('taskText');
    const detailsEl = document.getElementById('taskDetails');
    const priorityEl = document.getElementById('taskPriority');
    const categoryEl = document.getElementById('taskCategory');
    const dueDateEl = document.getElementById('taskDueDate');
    const remDays = parseInt(document.getElementById('taskReminderDays').value) || 0;
    const remHours = parseInt(document.getElementById('taskReminderHours').value) || 0;
    const recurringEl = document.getElementById('taskRecurring');

    const text = textEl.value.trim();
    if (!text) return;

    const newTask = {
        id: generateId(),
        list: state.currentList,
        text: text,
        priority: priorityEl.value,
        category: categoryEl.value.trim(),
        dueDate: dueDateEl.value,
        reminderDate: (remDays > 0 || remHours > 0) ? new Date(Date.now() + ((remDays * 24 + remHours) * 3600000)).toISOString() : '',
        reminderNotified: false,
        recurring: recurringEl.value,
        completed: false,
        archived: false,
        notes: detailsEl.value.trim(),
        subtasks: [],
        order: state.tasks.filter(t => t.list === state.currentList).length
    };

    state.tasks.push(newTask);
    textEl.value = '';
    detailsEl.value = '';
    document.getElementById('taskReminderDays').value = '';
    document.getElementById('taskReminderHours').value = '';
    setDefaultDueDate();
    
    syncTask(newTask);
    renderTasks();
}
document.getElementById('addTaskBtn').addEventListener('click', addTask);

function handleRecurring(task) {
    if (task.recurring === 'Daily' || task.recurring === 'Weekly') {
        let newDate = new Date(task.dueDate);
        if (isNaN(newDate.getTime())) {
             newDate = new Date();
        }
        if (task.recurring === 'Daily') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (task.recurring === 'Weekly') {
            newDate.setDate(newDate.getDate() + 7);
        }
        
        let pad = (n) => n < 10 ? '0'+n : n;
        let newDateString = `${newDate.getFullYear()}-${pad(newDate.getMonth()+1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;

        const newTask = JSON.parse(JSON.stringify(task));
        newTask.id = generateId();
        newTask.completed = false;
        newTask.archived = false;
        newTask.dueDate = newDateString;
        newTask.order = state.tasks.filter(t => t.list === state.currentList).length;
        newTask.subtasks.forEach(st => {
            st.completed = false;
            st.id = generateId();
        });
        
        state.tasks.push(newTask);
        syncTask(newTask);
    }
}

// Event Delegation for Task List
document.getElementById('taskList').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        state.tasks = state.tasks.filter(t => t.id !== id);
        syncDeleteTask(id); renderTasks();
    } else if (e.target.classList.contains('task-checkbox')) {
        const id = e.target.dataset.id;
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = e.target.checked;
            if (task.completed && task.recurring !== 'None') {
                handleRecurring(task);
            }
            syncTask(task); renderTasks();
        }
    } else if (e.target.classList.contains('edit-btn')) {
        openEditModal(e.target.dataset.id);
    } else if (e.target.classList.contains('archive-btn')) {
        const task = state.tasks.find(t => t.id === e.target.dataset.id);
        if (task) { task.archived = true; syncTask(task); renderTasks(); }
    } else if (e.target.classList.contains('unarchive-btn')) {
        const task = state.tasks.find(t => t.id === e.target.dataset.id);
        if (task) { task.archived = false; syncTask(task); renderTasks(); }
    } else if (e.target.classList.contains('subtask-checkbox')) {
        const taskId = e.target.dataset.taskid;
        const subtaskId = e.target.dataset.subtaskid;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                subtask.completed = e.target.checked;
                syncTask(task); renderTasks();
            }
        }
    }
});

// Edit Modal Logic
let editingTaskDraft = null;
function openEditModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskDraft = JSON.parse(JSON.stringify(task));
    
    document.getElementById('editTaskText').value = editingTaskDraft.text;
    document.getElementById('editTaskNotes').value = editingTaskDraft.notes || '';
    document.getElementById('editTaskPriority').value = editingTaskDraft.priority;
    document.getElementById('editTaskCategory').value = editingTaskDraft.category || '';
    document.getElementById('editTaskDueDate').value = editingTaskDraft.dueDate || '';
    if (editingTaskDraft.reminderDate) {
        const msDiff = new Date(editingTaskDraft.reminderDate) - new Date();
        if (msDiff > 0) {
            const totalHours = Math.floor(msDiff / 3600000);
            document.getElementById('editTaskReminderDays').value = Math.floor(totalHours / 24);
            document.getElementById('editTaskReminderHours').value = totalHours % 24;
        } else {
            document.getElementById('editTaskReminderDays').value = '';
            document.getElementById('editTaskReminderHours').value = '';
        }
    } else {
        document.getElementById('editTaskReminderDays').value = '';
        document.getElementById('editTaskReminderHours').value = '';
    }
    document.getElementById('editTaskRecurring').value = editingTaskDraft.recurring || 'None';
    
    renderEditSubtasks();
    document.getElementById('editModal').classList.remove('hidden');
}

function renderEditSubtasks() {
    const list = document.getElementById('editSubtaskList');
    list.innerHTML = editingTaskDraft.subtasks.map(st => `
        <li class="subtask-item" style="justify-content: space-between; border-bottom: 1px solid var(--border-color); padding: 5px 0;">
            <span>${escapeHtml(st.text)}</span>
            <button class="delete-subtask-btn" data-id="${st.id}" style="color:var(--danger); padding:2px 6px;">X</button>
        </li>
    `).join('');
}

document.getElementById('editSubtaskList').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-subtask-btn')) {
        editingTaskDraft.subtasks = editingTaskDraft.subtasks.filter(st => st.id !== e.target.dataset.id);
        renderEditSubtasks();
    }
});
document.getElementById('addSubtaskBtn').addEventListener('click', () => {
    const input = document.getElementById('newSubtaskText');
    const text = input.value.trim();
    if (text && editingTaskDraft) {
        if (!editingTaskDraft.subtasks) editingTaskDraft.subtasks = [];
        editingTaskDraft.subtasks.push({ id: generateId(), text: text, completed: false });
        input.value = '';
        renderEditSubtasks();
    }
});
document.getElementById('saveEditBtn').addEventListener('click', () => {
    if (editingTaskDraft) {
        const taskIdx = state.tasks.findIndex(t => t.id === editingTaskDraft.id);
        if (taskIdx > -1) {
            editingTaskDraft.text = document.getElementById('editTaskText').value.trim() || 'Untitled Task';
            editingTaskDraft.notes = document.getElementById('editTaskNotes').value.trim();
            editingTaskDraft.priority = document.getElementById('editTaskPriority').value;
            editingTaskDraft.category = document.getElementById('editTaskCategory').value.trim();
            editingTaskDraft.dueDate = document.getElementById('editTaskDueDate').value;
            
            const eDays = parseInt(document.getElementById('editTaskReminderDays').value) || 0;
            const eHours = parseInt(document.getElementById('editTaskReminderHours').value) || 0;
            const newReminder = (eDays > 0 || eHours > 0) ? new Date(Date.now() + ((eDays * 24 + eHours) * 3600000)).toISOString() : '';
            if (editingTaskDraft.reminderDate !== newReminder) {
                editingTaskDraft.reminderNotified = false; // Reset notification state if time changed
            }
            editingTaskDraft.reminderDate = newReminder;
            
            editingTaskDraft.recurring = document.getElementById('editTaskRecurring').value;
            
            state.tasks[taskIdx] = editingTaskDraft;
            syncTask(editingTaskDraft);
            renderTasks();
            closeEditModal();
        }
    }
});
document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    editingTaskDraft = null;
}

// Lists Logic
document.getElementById('listsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-list-btn')) {
        const listName = e.target.dataset.name;
        if (confirm(`Delete list '${listName}' and all its tasks?`)) {
            state.lists = state.lists.filter(l => l !== listName);
            const deletedTasks = state.tasks.filter(t => t.list === listName);
            state.tasks = state.tasks.filter(t => t.list !== listName);
            state.currentList = 'Default';
            syncLists();
            deletedTasks.forEach(t => syncDeleteTask(t.id));
            renderLists(); renderTasks();
        }
    } else if (e.target.closest('.list-item')) {
        state.currentList = e.target.closest('.list-item').dataset.name;
        state.viewMode = 'active';
        renderLists(); renderTasks();
    }
});
document.getElementById('addListBtn').addEventListener('click', () => {
    const input = document.getElementById('newListInput');
    const name = input.value.trim();
    if (name && !state.lists.includes(name)) {
        state.lists.push(name);
        state.currentList = name;
        input.value = '';
        syncLists(); renderLists(); renderTasks();
    }
});

// Drag and Drop Logic
let draggedId = null;
const taskListEl = document.getElementById('taskList');
taskListEl.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.task-item');
    if (item) draggedId = item.dataset.id;
});
taskListEl.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessary to allow dropping
});
taskListEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const sortVal = document.getElementById('sortOptions').value;
    if (sortVal !== 'default') return; // Only allow drag-drop on default sort

    const targetItem = e.target.closest('.task-item');
    if (targetItem && draggedId) {
        const targetId = targetItem.dataset.id;
        if (targetId !== draggedId) {
            const visibleTasks = getFilteredAndSortedTasks();
            const draggedIdx = visibleTasks.findIndex(t => t.id === draggedId);
            const targetIdx = visibleTasks.findIndex(t => t.id === targetId);
            
            if (draggedIdx > -1 && targetIdx > -1) {
                const draggedTask = visibleTasks[draggedIdx];
                visibleTasks.splice(draggedIdx, 1);
                visibleTasks.splice(targetIdx, 0, draggedTask);
                
                // Reassign orders sequentially for this list's tasks
                visibleTasks.forEach((t, i) => t.order = i);
                syncAllTasks(); renderTasks();
            }
        }
    }
    draggedId = null;
});

// Additional Actions
document.getElementById('viewActiveBtn').addEventListener('click', () => {
    state.viewMode = 'active'; renderTasks();
});
document.getElementById('viewCompletedBtn').addEventListener('click', () => {
    state.viewMode = 'completed'; renderTasks();
});
document.getElementById('viewArchiveBtn').addEventListener('click', () => {
    state.viewMode = 'archived'; renderTasks();
});

document.getElementById('clearCompletedBtn').addEventListener('click', () => {
    if (confirm('Delete all completed tasks in the current view?')) {
        const toDelete = state.tasks.filter(t => t.list === state.currentList && t.archived === (state.viewMode === 'archived') && t.completed);
        state.tasks = state.tasks.filter(t => !toDelete.includes(t));
        toDelete.forEach(t => syncDeleteTask(t.id));
        renderTasks();
    }
});
document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('Delete ALL tasks in this list?')) {
        const toDelete = state.tasks.filter(t => t.list === state.currentList);
        state.tasks = state.tasks.filter(t => t.list !== state.currentList);
        toDelete.forEach(t => syncDeleteTask(t.id));
        renderTasks();
    }
});

// Import/Export
document.getElementById('exportBtn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `todo_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data && Array.isArray(data.tasks)) {
                state = data;
                syncAllTasks(); syncLists(); syncTheme(); applyTheme(); renderLists(); renderTasks();
                alert('Data imported successfully!');
            }
        } catch(err) {
            alert('Invalid JSON file.');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
});

// Theme




// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active.id === 'taskText' || active.id === 'taskCategory') {
            addTask();
        } else if (active.id === 'newListInput') {
            document.getElementById('addListBtn').click();
        } else if (active.id === 'newSubtaskText') {
            document.getElementById('addSubtaskBtn').click();
        }
    }
});



// Request Notification Permission on load
if ("Notification" in window && Notification.permission !== "denied" && Notification.permission !== "granted") {
    Notification.requestPermission();
}

// Mobile Sidebar Logic
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

function toggleSidebar(forceClose = false) {
    if (window.innerWidth > 768) return; // Only apply on mobile
    if (forceClose) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    } else {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('show');
    }
}

if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleSidebar());
if(sidebarOverlay) sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(true));

// Auto-close sidebar on mobile when a view or list is clicked
document.getElementById('listsContainer').addEventListener('click', (e) => {
    if (e.target.closest('.list-item') || e.target.classList.contains('delete-list-btn')) {
        toggleSidebar(true);
    }
});
document.getElementById('viewActiveBtn').addEventListener('click', () => toggleSidebar(true));
document.getElementById('viewCompletedBtn').addEventListener('click', () => toggleSidebar(true));
document.getElementById('viewArchiveBtn').addEventListener('click', () => toggleSidebar(true));
document.getElementById('clearCompletedBtn').addEventListener('click', () => toggleSidebar(true));
document.getElementById('clearAllBtn').addEventListener('click', () => toggleSidebar(true));


// --- THEME LOGIC ---
const lightThemes = [
    { id: 'light-0', bg: '#f0fff4', btn: '#c6f6d5', hover: '#9ae6b4', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-1', bg: '#f3e8ff', btn: '#e9d8fd', hover: '#d6bcfa', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-2', bg: '#fff5f5', btn: '#fed7d7', hover: '#feb2b2', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-3', bg: '#fffff0', btn: '#fefcbf', hover: '#faf089', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-4', bg: '#ebf8ff', btn: '#bee3f8', hover: '#90cdf4', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-5', bg: '#fff0f6', btn: '#fed7e2', hover: '#fbb6ce', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-6', bg: '#f0fdf4', btn: '#bbf7d0', hover: '#86efac', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-7', bg: '#fef3c7', btn: '#fde68a', hover: '#fcd34d', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-8', bg: '#e0f2fe', btn: '#bae6fd', hover: '#7dd3fc', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-9', bg: '#faf5ff', btn: '#e9d5ff', hover: '#d8b4fe', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-10', bg: '#ffedd5', btn: '#fed7aa', hover: '#fdba74', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-11', bg: '#f0fdfa', btn: '#ccfbf1', hover: '#99f6e4', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-12', bg: '#f8fafc', btn: '#e2e8f0', hover: '#cbd5e1', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-13', bg: '#ffe4e6', btn: '#fecdd3', hover: '#fda4af', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-14', bg: '#f7fee7', btn: '#d9f99d', hover: '#bef264', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-15', bg: '#ecfeff', btn: '#cffafe', hover: '#a5f3fc', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-16', bg: '#eef2ff', btn: '#c7d2fe', hover: '#a5b4fc', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-17', bg: '#fdf4ff', btn: '#fbcfe8', hover: '#f9a8d4', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-18', bg: '#fafaf9', btn: '#e7e5e4', hover: '#d6d3d1', task: '#ffffff', border: '#cbd5e0' },
    { id: 'light-19', bg: '#ecfdf5', btn: '#a7f3d0', hover: '#6ee7b7', task: '#ffffff', border: '#cbd5e0' }
];

const themeModal = document.getElementById('themeModal');
const closeThemeModalBtn = document.getElementById('closeThemeModalBtn');
const colorPalette = document.getElementById('colorPalette');
const modalDarkModeToggle = document.getElementById('modalDarkModeToggle');

if (document.getElementById('themeBtnHeader')) {
    document.getElementById('themeBtnHeader').addEventListener('click', () => {
        themeModal.classList.remove('hidden');
        renderColorPalette();
    });
}
if (document.getElementById('themeBtnSidebar')) {
    document.getElementById('themeBtnSidebar').addEventListener('click', () => {
        themeModal.classList.remove('hidden');
        renderColorPalette();
        toggleSidebar(true);
    });
}
if (closeThemeModalBtn) {
    closeThemeModalBtn.addEventListener('click', () => themeModal.classList.add('hidden'));
}

function renderColorPalette() {
    colorPalette.innerHTML = '';
    lightThemes.forEach((t, index) => {
        const btn = document.createElement('div');
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = t.bg;
        btn.style.border = '2px solid ' + t.border;
        btn.style.cursor = 'pointer';
        btn.style.transition = 'none';
        
        if (state.theme === t.id || (state.theme === 'light' && index === 7)) { // 7 is a nice greenish default fallback
            btn.style.boxShadow = '0 0 0 3px var(--text-color)';
        }
        
        // removed hover scale
        // removed hover scale
        btn.addEventListener('click', () => {
            state.theme = t.id;
            applyTheme();
            syncTheme();
            renderColorPalette();
        });
        colorPalette.appendChild(btn);
    });
}

modalDarkModeToggle.addEventListener('click', () => {
    state.theme = 'dark';
    applyTheme();
    syncTheme();
    renderColorPalette();
    themeModal.classList.add('hidden');
});

function applyTheme() {
    if (state.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.removeProperty('--bg-color');
        document.documentElement.style.removeProperty('--btn-bg');
        document.documentElement.style.removeProperty('--btn-hover');
        document.documentElement.style.removeProperty('--task-bg');
        document.documentElement.style.removeProperty('--border-color');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        
        let selectedTheme = lightThemes.find(t => t.id === state.theme);
        if (!selectedTheme) {
            // Default to something greenish if state.theme is just 'light'
            selectedTheme = lightThemes[7]; 
        }
        
        document.documentElement.style.setProperty('--bg-color', selectedTheme.bg);
        document.documentElement.style.setProperty('--btn-bg', selectedTheme.btn);
        document.documentElement.style.setProperty('--btn-hover', selectedTheme.hover);
        document.documentElement.style.setProperty('--task-bg', selectedTheme.task);
        document.documentElement.style.setProperty('--border-color', selectedTheme.border);
    }
}
// --- END THEME LOGIC ---

// Initialization
init();
