const { cpSync, mkdirSync } = require('node:fs');

mkdirSync('dist', { recursive: true });
cpSync('index.html', 'dist/index.html');
cpSync('img', 'dist/img', { recursive: true });
