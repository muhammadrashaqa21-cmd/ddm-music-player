const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { build } = require('esbuild');

async function preparePlaybackCapsule() {
  const indexPath = 'dist/index.html';
  if (!existsSync(indexPath)) {
    throw new Error('Web build not found. Run "node scripts/prepare-web.js" first.');
  }

  await build({
    entryPoints: ['scripts/native-playback-capsule.js'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    outfile: 'dist/native-playback-capsule.js'
  });

  const indexHtml = readFileSync(indexPath, 'utf8');
  const audioBridgeTag = '<script src="native-audio-bridge.js"></script>';
  const capsuleBridgeTag = '<script src="native-playback-capsule.js"></script>';
  if (indexHtml.includes(capsuleBridgeTag)) return;
  if (!indexHtml.includes(audioBridgeTag)) {
    throw new Error('Cannot add the playback capsule: native audio bridge script was not found.');
  }

  writeFileSync(indexPath, indexHtml.replace(audioBridgeTag, `${audioBridgeTag}\n  ${capsuleBridgeTag}`));
}

preparePlaybackCapsule().catch(error => {
  console.error('Playback capsule preparation failed:', error);
  process.exitCode = 1;
});
