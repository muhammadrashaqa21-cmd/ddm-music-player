const { existsSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
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

const javaRoot = path.join('android', 'app', 'src', 'main', 'java');
const mainActivityPath = existsSync(javaRoot) ? findMainActivity(javaRoot) : null;
if (!mainActivityPath) {
  throw new Error(`MainActivity.java not found under ${javaRoot}. Run "npx cap add android" first.`);
}

let mainActivity = readFileSync(mainActivityPath, 'utf8');
if (!mainActivity.includes('extends BridgeActivity')) {
  throw new Error(`Unexpected Android activity implementation: ${mainActivityPath}`);
}

if (!mainActivity.includes('applyDdmImmersiveMode')) {
  const packageStatement = mainActivity.match(/^package\s+[\w.]+;/m);
  if (!packageStatement) {
    throw new Error(`Missing package declaration in ${mainActivityPath}`);
  }

  const imports = [
    'import android.os.Build;',
    'import android.os.Bundle;',
    'import android.view.View;',
    'import android.view.WindowInsets;',
    'import android.view.WindowInsetsController;'
  ].filter(importStatement => !mainActivity.includes(importStatement));
  const insertionPoint = packageStatement.index + packageStatement[0].length;
  mainActivity = `${mainActivity.slice(0, insertionPoint)}\n\n${imports.join('\n')}${mainActivity.slice(insertionPoint)}`;

  const classOpening = mainActivity.indexOf('{', mainActivity.indexOf('class MainActivity'));
  const classClosing = mainActivity.lastIndexOf('}');
  if (classOpening === -1 || classClosing <= classOpening) {
    throw new Error(`Cannot locate MainActivity class body in ${mainActivityPath}`);
  }

  const immersiveMethods = `
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyDdmImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyDdmImmersiveMode();
    }

    private void applyDdmImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            );
        }
    }
`;
  mainActivity = `${mainActivity.slice(0, classClosing)}${immersiveMethods}${mainActivity.slice(classClosing)}`;
  writeFileSync(mainActivityPath, mainActivity);
}
