const fs = require('fs');

// 1. Update styles.css
let css = fs.readFileSync('styles.css', 'utf8');

// Replace body CSS
css = css.replace(
    /body \{[\s\S]*?overflow: hidden;\n\}/,
    `body {
    background-color: var(--bg-color);
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
}

body.no-scroll {
    overflow: hidden;
}`
);

// Replace header CSS
css = css.replace(
    /header \{[\s\S]*?border-bottom: 1px solid var\(--border-color\);\n\}/,
    `header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: var(--bg-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
}`
);

// Replace container CSS
css = css.replace(
    /\.container \{[\s\S]*?overflow: hidden;\n\}/,
    `.container {
    display: flex;
    flex: 1;
    align-items: flex-start;
}`
);

// Replace sidebar CSS (PC)
css = css.replace(
    /\.sidebar \{[\s\S]*?gap: 15px;\n\}/,
    `.sidebar {
    width: 280px;
    border-right: 1px solid var(--border-color);
    padding: 20px;
    position: sticky;
    top: 61px;
    height: calc(100dvh - 61px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
}`
);

// Replace main CSS (PC)
css = css.replace(
    /\.main \{[\s\S]*?flex-direction: column;\n\}/,
    `.main {
    flex: 1;
    padding: 20px;
    overflow-y: visible;
    display: flex;
    flex-direction: column;
}`
);

// Fix mobile sidebar height
css = css.replace(
    /height: 100vh;\n\s*z-index: 1001;/,
    `height: 100dvh;\n        z-index: 1001;`
);

fs.writeFileSync('styles.css', css, 'utf8');

// 2. Update app.js for no-scroll on body when sidebar is open
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(
    /if \(forceClose\) \{\n\s*sidebar\.classList\.remove\('open'\);\n\s*sidebarOverlay\.classList\.remove\('show'\);\n\s*\} else \{\n\s*sidebar\.classList\.toggle\('open'\);\n\s*sidebarOverlay\.classList\.toggle\('show'\);\n\s*\}/,
    `if (forceClose) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        document.body.classList.remove('no-scroll');
    } else {
        const isOpen = sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('show');
        document.body.classList.toggle('no-scroll', isOpen);
    }`
);

fs.writeFileSync('app.js', js, 'utf8');

console.log('Successfully fixed scroll issues!');
