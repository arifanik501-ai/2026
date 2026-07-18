const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
// Replace Plus Jakarta Sans with Inter
html = html.replace('family=Plus+Jakarta+Sans:wght@400;500;600;700', 'family=Inter:wght@400;500;600;700');
fs.writeFileSync('index.html', html, 'utf8');

// 2. Update styles.css
let css = fs.readFileSync('styles.css', 'utf8');

// Fonts and Transitions
css = css.replace(
    /font-family: 'Times New Roman', serif;/g,
    "font-family: 'Inter', sans-serif;"
);
css = css.replace(
    /font-family: 'Plus Jakarta Sans', sans-serif;/g,
    "font-family: 'Inter', sans-serif;"
);

// Completely remove transitions and animations
css = css.replace(
    /transition: background-color 0\.2s ease, color 0\.2s ease, border-color 0\.2s ease, box-shadow 0\.2s ease;/g,
    "transition: none !important;"
);
css = css.replace(
    /transition: left 0\.35s cubic-bezier\(0\.4, 0, 0\.2, 1\) !important;/g,
    "transition: none !important;"
);
css = css.replace(
    /transition: background 0\.35s ease;/g,
    "transition: none !important;"
);
css = css.replace(
    /transition: transform 0\.2s;/g,
    "transition: none !important;"
);
// Remove button hover scale
css = css.replace(
    /transform: translateY\(-1px\);/g,
    ""
);
css = css.replace(
    /transform: translateY\(1px\);/g,
    ""
);
// Make border-radius and shadows premium
// buttons, inputs
css = css.replace(
    "border: 1px solid var(--border-color);\n    padding: 8px 12px;\n    cursor: pointer;\n    font-size: 0.9rem;",
    "border: 1px solid var(--border-color);\n    padding: 10px 14px;\n    border-radius: 8px;\n    cursor: pointer;\n    font-size: 0.95rem;\n    box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
);
// button hover shadow
css = css.replace(
    "box-shadow: 0 2px 5px rgba(0,0,0,0.1);",
    "box-shadow: 0 4px 6px rgba(0,0,0,0.08);"
);

// task form
css = css.replace(
    "    background: var(--task-bg);\n    padding: 15px;\n    border: 1px solid var(--border-color);",
    "    background: var(--task-bg);\n    padding: 20px;\n    border: none;\n    border-radius: 12px;\n    box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
);

// task items
css = css.replace(
    "    background-color: var(--task-bg);\n    border: 1px solid var(--border-color);\n    margin-bottom: 10px;\n    padding: 15px;",
    "    background-color: var(--task-bg);\n    border: none;\n    border-radius: 12px;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.06);\n    margin-bottom: 12px;\n    padding: 20px;"
);

// modal content
css = css.replace(
    "    background: var(--bg-color);\n    padding: 25px;\n    border: 1px solid var(--border-color);",
    "    background: var(--bg-color);\n    padding: 30px;\n    border: none;\n    border-radius: 16px;\n    box-shadow: 0 10px 25px rgba(0,0,0,0.15);"
);

// Also remove transitions from color palette in JS
let js = fs.readFileSync('app.js', 'utf8');
js = js.replace(/btn\.style\.transition = 'transform 0\.2s';/g, "btn.style.transition = 'none';");
js = js.replace(/btn\.addEventListener\('mouseover', \(\) => btn\.style\.transform = 'scale\(1\.1\)'\);/g, "// removed hover scale");
js = js.replace(/btn\.addEventListener\('mouseout', \(\) => btn\.style\.transform = 'scale\(1\)'\);/g, "// removed hover scale");
fs.writeFileSync('app.js', js, 'utf8');

fs.writeFileSync('styles.css', css, 'utf8');
console.log("Successfully applied Premium UI with zero animations.");
