const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!existsSync(manifestPath)) {
  throw new Error(`Android manifest not found: ${manifestPath}. Run "npx cap add android" first.`);
}

let manifest = readFileSync(manifestPath, 'utf8');
const manifestOpenTag = manifest.match(/<manifest\b[\s\S]*?>/);
if (!manifestOpenTag) {
  throw new Error(`Invalid Android manifest: ${manifestPath}`);
}
const manifestTagEnd = manifest.indexOf(manifestOpenTag[0]) + manifestOpenTag[0].length;

const permissions = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.WAKE_LOCK',
  'android.permission.POST_NOTIFICATIONS'
];
const missingPermissions = permissions.filter(permission =>
  !manifest.includes(`android:name="${permission}"`)
);

if (missingPermissions.length > 0) {
  const permissionTags = missingPermissions
    .map(permission => `\n    <uses-permission android:name="${permission}" />`)
    .join('');
  manifest = `${manifest.slice(0, manifestTagEnd)}${permissionTags}${manifest.slice(manifestTagEnd)}`;
  writeFileSync(manifestPath, manifest);
}
