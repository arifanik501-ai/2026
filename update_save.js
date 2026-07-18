const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. checkReminders
code = code.replace(
    /if \(needsSave\) \{\s*saveData\(\);\s*\}/,
    `if (needsSave) {\n        state.tasks.forEach(task => {\n            if (task.reminderNotified) syncTask(task);\n        });\n    }`
);

// 2. addTask
code = code.replace(
    /saveData\(\);\s*renderTasks\(\);/g,
    function(match, offset, string) {
        // We will just do a general replacement based on context
        return match; // skip for now
    }
);

// Manual string replacements to be safe
code = code.replace("saveData();\n    renderTasks();", "syncTask(newTask);\n    renderTasks();");

code = code.replace(
    "state.tasks.push(newTask);\n    }",
    "state.tasks.push(newTask);\n        syncTask(newTask);\n    }"
);

code = code.replace("saveData(); renderTasks();", "syncDeleteTask(id); renderTasks();"); // This will hit the delete-btn
code = code.replace("saveData(); renderTasks();", "syncTask(task); renderTasks();"); // This will hit task-checkbox
code = code.replace("saveData(); renderTasks();", "syncTask(task); renderTasks();"); // archive
code = code.replace("saveData(); renderTasks();", "syncTask(task); renderTasks();"); // unarchive
code = code.replace("saveData(); renderTasks();", "syncTask(task); renderTasks();"); // subtask-checkbox

code = code.replace("saveData();\n            renderTasks();", "syncTask(editingTaskDraft);\n            renderTasks();"); // saveEditBtn

// Lists logic
code = code.replace(
    "state.tasks = state.tasks.filter(t => t.list !== listName);\n            state.currentList = 'Default';\n            saveData(); renderLists(); renderTasks();",
    "const deletedTasks = state.tasks.filter(t => t.list === listName);\n            state.tasks = state.tasks.filter(t => t.list !== listName);\n            state.currentList = 'Default';\n            syncLists();\n            deletedTasks.forEach(t => syncDeleteTask(t.id));\n            renderLists(); renderTasks();"
);

code = code.replace(
    "state.viewMode = 'active';\n        saveData(); renderLists(); renderTasks();",
    "state.viewMode = 'active';\n        renderLists(); renderTasks();"
);

code = code.replace(
    "input.value = '';\n        saveData(); renderLists(); renderTasks();",
    "input.value = '';\n        syncLists(); renderLists(); renderTasks();"
);

// Drag & Drop
code = code.replace(
    "visibleTasks.forEach((t, i) => t.order = i);\n                saveData(); renderTasks();",
    "visibleTasks.forEach((t, i) => t.order = i);\n                syncAllTasks(); renderTasks();"
);

// Views
code = code.replace("state.viewMode = 'active'; saveData(); renderTasks();", "state.viewMode = 'active'; renderTasks();");
code = code.replace("state.viewMode = 'completed'; saveData(); renderTasks();", "state.viewMode = 'completed'; renderTasks();");
code = code.replace("state.viewMode = 'archived'; saveData(); renderTasks();", "state.viewMode = 'archived'; renderTasks();");

// Clear Completed
code = code.replace(
    "state.tasks = state.tasks.filter(t => {\n            if (t.list !== state.currentList) return true;\n            if (t.archived !== (state.viewMode === 'archived')) return true;\n            return !t.completed;\n        });\n        saveData(); renderTasks();",
    "const toDelete = state.tasks.filter(t => t.list === state.currentList && t.archived === (state.viewMode === 'archived') && t.completed);\n        state.tasks = state.tasks.filter(t => !toDelete.includes(t));\n        toDelete.forEach(t => syncDeleteTask(t.id));\n        renderTasks();"
);

// Clear All
code = code.replace(
    "state.tasks = state.tasks.filter(t => t.list !== state.currentList);\n        saveData(); renderTasks();",
    "const toDelete = state.tasks.filter(t => t.list === state.currentList);\n        state.tasks = state.tasks.filter(t => t.list !== state.currentList);\n        toDelete.forEach(t => syncDeleteTask(t.id));\n        renderTasks();"
);

// Import
code = code.replace(
    "saveData(); applyTheme(); renderLists(); renderTasks();",
    "syncAllTasks(); syncLists(); syncTheme(); applyTheme(); renderLists(); renderTasks();"
);

// Theme
code = code.replace(
    "applyTheme(); saveData();",
    "applyTheme(); syncTheme();"
);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Successfully updated app.js!');
