const { cpSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { build } = require('esbuild');

async function prepareWeb() {
  mkdirSync('dist', { recursive: true });
  cpSync('index.html', 'dist/index.html');
  cpSync('img', 'dist/img', { recursive: true });

  await build({
    entryPoints: ['scripts/native-audio-bridge.js'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    outfile: 'dist/native-audio-bridge.js'
  });

  const indexPath = 'dist/index.html';
  const indexHtml = readFileSync(indexPath, 'utf8');
  if (!indexHtml.includes('</head>')) {
    throw new Error('Cannot add the native audio bridge: index.html has no closing head tag.');
  }
  writeFileSync(
    indexPath,
    indexHtml.replace('</head>', '  <script src="native-audio-bridge.js"></script>\n</head>')
  );
}

prepareWeb().catch(error => {
  console.error('Web build failed:', error);
  process.exitCode = 1;
});
