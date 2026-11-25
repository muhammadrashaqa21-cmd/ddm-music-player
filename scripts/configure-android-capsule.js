const {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} = require('node:fs');
const path = require('node:path');

const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
const javaRoot = path.join('android', 'app', 'src', 'main', 'java');
const templateRoot = path.join('scripts', 'templates');

if (!existsSync(manifestPath) || !existsSync(javaRoot)) {
  throw new Error('Android project not found. Run "npx cap add android" first.');
}

function findMainActivity(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = findMainActivity(entryPath);
      if (found) return found;
    } else if (entry.name === 'MainActivity.java') {
      return entryPath;
    }
  }
  return null;
}

const activityPath = findMainActivity(javaRoot);
if (!activityPath) {
  throw new Error(`MainActivity.java not found under ${javaRoot}.`);
}

const activity = readFileSync(activityPath, 'utf8');
const packageStatement = activity.match(/^package\s+([\w.]+);/m);
if (!packageStatement || !activity.includes('extends BridgeActivity')) {
  throw new Error(`Unexpected Android activity implementation: ${activityPath}`);
}

const appJavaRoot = path.join(javaRoot, ...packageStatement[1].split('.'));
mkdirSync(appJavaRoot, { recursive: true });
for (const className of ['PlaybackCapsulePlugin', 'PlaybackCapsuleService']) {
  const templatePath = path.join(templateRoot, `${className}.java`);
  const destinationPath = path.join(appJavaRoot, `${className}.java`);
  if (!existsSync(templatePath)) {
    throw new Error(`Android capsule template not found: ${templatePath}`);
  }
  const javaSource = readFileSync(templatePath, 'utf8').replace('__PACKAGE__', packageStatement[1]);
  writeFileSync(destinationPath, javaSource);
}

let manifest = readFileSync(manifestPath, 'utf8');
const manifestTag = manifest.match(/<manifest\b[\s\S]*?>/);
if (!manifestTag) {
  throw new Error(`Invalid Android manifest: ${manifestPath}`);
}
if (!manifest.includes('android.permission.SYSTEM_ALERT_WINDOW')) {
  const insertionPoint = manifest.indexOf(manifestTag[0]) + manifestTag[0].length;
  manifest = `${manifest.slice(0, insertionPoint)}\n    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />${manifest.slice(insertionPoint)}`;
}

if (!manifest.includes('PlaybackCapsuleService')) {
  const applicationClose = manifest.lastIndexOf('</application>');
  if (applicationClose === -1) {
    throw new Error(`Android application element not found in ${manifestPath}.`);
  }
  const lineStart = manifest.lastIndexOf('\n', applicationClose) + 1;
  const closingIndent = manifest.slice(lineStart, applicationClose);
  const childIndent = `${closingIndent}    `;
  const serviceDeclaration = `${childIndent}<service android:name="${packageStatement[1]}.PlaybackCapsuleService" android:enabled="true" android:exported="false" />\n`;
  manifest = `${manifest.slice(0, lineStart)}${serviceDeclaration}${manifest.slice(lineStart)}`;
}
writeFileSync(manifestPath, manifest);

if (!activity.includes('registerPlugin(PlaybackCapsulePlugin.class)')) {
  const onCreate = /public\s+void\s+onCreate\s*\(\s*Bundle\s+savedInstanceState\s*\)\s*\{/;
  const onCreateMatch = activity.match(onCreate);
  if (!onCreateMatch) {
    throw new Error(`Cannot find MainActivity.onCreate in ${activityPath}.`);
  }
  const bodyStart = onCreateMatch.index + onCreateMatch[0].length;
  const superCall = activity.indexOf('super.onCreate(savedInstanceState);', bodyStart);
  if (superCall === -1) {
    throw new Error(`Cannot find MainActivity super.onCreate call in ${activityPath}.`);
  }
  const registration = '        registerPlugin(PlaybackCapsulePlugin.class);\n';
  const updatedActivity = `${activity.slice(0, superCall)}${registration}${activity.slice(superCall)}`;
  writeFileSync(activityPath, updatedActivity);
}
