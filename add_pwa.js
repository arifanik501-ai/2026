const fs = require('fs');

// 1. Create logo.svg
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="120" fill="#f2fcf2"/>
    <path d="M140 260 L220 340 L380 180" stroke="#111" stroke-width="45" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
fs.writeFileSync('logo.svg', logoSvg, 'utf8');

// 2. Create manifest.json
const manifest = {
  "name": "To-Do List Pro",
  "short_name": "To-Do",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "logo.svg",
      "type": "image/svg+xml",
      "sizes": "any",
      "purpose": "any maskable"
    }
  ]
};
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2), 'utf8');

// 3. Create service-worker.js
const swJs = `const CACHE_NAME = 'todo-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});`;
fs.writeFileSync('service-worker.js', swJs, 'utf8');

// 4. Modify index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('manifest.json')) {
    html = html.replace('</title>', `</title>\n    <link rel="manifest" href="manifest.json">\n    <meta name="theme-color" content="#ffffff">\n    <link rel="apple-touch-icon" href="logo.svg">`);
}

// Add Install Buttons
html = html.replace(
    '<button id="themeBtnHeader">🎨 Themes</button>',
    '<button id="installAppBtn" class="hidden" style="background: var(--text-color); color: var(--bg-color); font-weight: bold; border-radius: 8px;">⬇ Install App</button>\n        <button id="themeBtnHeader">🎨 Themes</button>'
);

html = html.replace(
    '<button id="themeBtnSidebar" style="width: 100%; margin-bottom: 20px;">🎨 Themes</button>',
    '<button id="sidebarInstallBtn" class="hidden" style="width: 100%; margin-bottom: 10px; background: var(--text-color); color: var(--bg-color); font-weight: bold; padding: 12px; border: none; border-radius: 8px; cursor:pointer;">⬇ Install App</button>\n        <button id="themeBtnSidebar" style="width: 100%; margin-bottom: 20px;">🎨 Themes</button>'
);
fs.writeFileSync('index.html', html, 'utf8');


// 5. Modify app.js
let js = fs.readFileSync('app.js', 'utf8');

const pwaLogic = `

// --- PWA LOGIC ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(err => console.log('SW registration failed', err));
    });
}

let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');
const sidebarInstallBtn = document.getElementById('sidebarInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden');
    if (sidebarInstallBtn) sidebarInstallBtn.classList.remove('hidden');
});

function handleInstallClick() {
    if (installBtn) installBtn.classList.add('hidden');
    if (sidebarInstallBtn) sidebarInstallBtn.classList.add('hidden');
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
        });
    }
}

if (installBtn) installBtn.addEventListener('click', handleInstallClick);
if (sidebarInstallBtn) sidebarInstallBtn.addEventListener('click', handleInstallClick);

window.addEventListener('appinstalled', (evt) => {
    console.log('App installed!');
});
// --- END PWA LOGIC ---
`;

if (!js.includes('// --- PWA LOGIC ---')) {
    js += pwaLogic;
    fs.writeFileSync('app.js', js, 'utf8');
}

console.log("PWA implemented successfully!");
