const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const newThemes = `const lightThemes = [
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
];`;

const oldThemeLogicRegex = /const lightThemes = Array\.from\(\{length: 20\}\)\.map\(\(\_, i\) => \{[\s\S]*?\}\);/;

js = js.replace(oldThemeLogicRegex, newThemes);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Successfully updated to unique themes!');
