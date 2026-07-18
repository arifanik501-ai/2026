const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

const htmlTaskFormReminderOld = `<div style="display:flex; align-items:center; gap:5px;" title="Optional Reminder Notification">
                <span style="font-size:0.8em; color:gray;">Reminder:</span>
                <input type="datetime-local" id="taskReminderDate">
            </div>`;
const htmlTaskFormReminderNew = `<div style="display:flex; align-items:center; gap:5px;" title="Remind me in X days/hours">
                <span style="font-size:0.8em; color:gray;">Reminder in:</span>
                <input type="number" id="taskReminderDays" placeholder="Days" min="0" style="width: 65px;">
                <span style="font-size:0.8em; color:gray;">d</span>
                <input type="number" id="taskReminderHours" placeholder="Hrs" min="0" style="width: 65px;">
                <span style="font-size:0.8em; color:gray;">h</span>
            </div>`;
            
const htmlEditFormReminderOld = `<div style="display:flex; align-items:center; gap:5px;" title="Optional Reminder Notification">
                <span style="font-size:0.8em; color:gray;">Reminder:</span>
                <input type="datetime-local" id="editTaskReminderDate" style="flex:1;">
            </div>`;
const htmlEditFormReminderNew = `<div style="display:flex; align-items:center; gap:5px;" title="Remind me in X days/hours">
                <span style="font-size:0.8em; color:gray;">Reminder in:</span>
                <input type="number" id="editTaskReminderDays" placeholder="Days" min="0" style="width: 60px;">
                <span style="font-size:0.8em; color:gray;">d</span>
                <input type="number" id="editTaskReminderHours" placeholder="Hrs" min="0" style="width: 60px;">
                <span style="font-size:0.8em; color:gray;">h</span>
            </div>`;

html = html.replace(htmlTaskFormReminderOld, htmlTaskFormReminderNew);
html = html.replace(htmlEditFormReminderOld, htmlEditFormReminderNew);

fs.writeFileSync('index.html', html, 'utf8');

// 2. Update app.js
let js = fs.readFileSync('app.js', 'utf8');

// addTask()
js = js.replace(
    "const reminderEl = document.getElementById('taskReminderDate');",
    "const remDays = parseInt(document.getElementById('taskReminderDays').value) || 0;\n    const remHours = parseInt(document.getElementById('taskReminderHours').value) || 0;"
);

js = js.replace(
    "reminderDate: reminderEl.value,",
    "reminderDate: (remDays > 0 || remHours > 0) ? new Date(Date.now() + ((remDays * 24 + remHours) * 3600000)).toISOString() : '',"
);

js = js.replace(
    "reminderEl.value = '';",
    "document.getElementById('taskReminderDays').value = '';\n    document.getElementById('taskReminderHours').value = '';"
);


// openEditModal()
js = js.replace(
    "document.getElementById('editTaskReminderDate').value = editingTaskDraft.reminderDate || '';",
    `if (editingTaskDraft.reminderDate) {
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
    }`
);

// saveEditBtn()
js = js.replace(
    "const newReminder = document.getElementById('editTaskReminderDate').value;",
    `const eDays = parseInt(document.getElementById('editTaskReminderDays').value) || 0;
            const eHours = parseInt(document.getElementById('editTaskReminderHours').value) || 0;
            const newReminder = (eDays > 0 || eHours > 0) ? new Date(Date.now() + ((eDays * 24 + eHours) * 3600000)).toISOString() : '';`
);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Successfully updated reminder inputs!');
