package __PACKAGE__;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

public class PlaybackCapsuleService extends Service {
    public static final String ACTION_SHOW = "ddm.music.action.SHOW_CAPSULE";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";

    private WindowManager windowManager;
    private View capsuleView;
    private TextView titleView;
    private TextView artistView;
    private String currentTitle = "DDM Music";
    private String currentArtist = "Sedang diputar";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_SHOW.equals(intent.getAction())) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                stopSelf(startId);
                return START_NOT_STICKY;
            }

            currentTitle = nonEmpty(intent.getStringExtra(EXTRA_TITLE), "DDM Music");
            currentArtist = nonEmpty(intent.getStringExtra(EXTRA_ARTIST), "Sedang diputar");
            showCapsule();
        }
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        removeCapsule();
        super.onDestroy();
    }

    private void showCapsule() {
        if (windowManager == null) {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        }
        if (capsuleView == null) {
            capsuleView = createCapsule();
        }
        titleView.setText(currentTitle);
        artistView.setText(currentArtist);
        capsuleView.setContentDescription(currentTitle + " - " + currentArtist);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            dp(224),
            dp(48),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        params.y = statusBarHeight() + dp(4);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        if (capsuleView.getParent() == null) {
            windowManager.addView(capsuleView, params);
        } else {
            windowManager.updateViewLayout(capsuleView, params);
        }
    }

    private View createCapsule() {
        LinearLayout capsule = new LinearLayout(this);
        capsule.setOrientation(LinearLayout.HORIZONTAL);
        capsule.setGravity(Gravity.CENTER_VERTICAL);
        capsule.setPadding(dp(10), 0, dp(12), 0);
        capsule.setElevation(0);

        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.rgb(18, 25, 37));
        background.setCornerRadius(dp(24));
        background.setStroke(dp(1), Color.rgb(48, 62, 81));
        capsule.setBackground(background);

        LinearLayout equalizer = new LinearLayout(this);
        equalizer.setOrientation(LinearLayout.HORIZONTAL);
        equalizer.setGravity(Gravity.CENTER_VERTICAL);
        int[] heights = { 9, 17, 12, 7 };
        for (int height : heights) {
            View bar = new View(this);
            GradientDrawable barBackground = new GradientDrawable();
            barBackground.setColor(Color.rgb(93, 185, 255));
            barBackground.setCornerRadius(dp(2));
            bar.setBackground(barBackground);
            LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(dp(3), dp(height));
            barParams.rightMargin = dp(2);
            equalizer.addView(bar, barParams);
        }
        capsule.addView(equalizer, new LinearLayout.LayoutParams(dp(25), dp(28)));

        LinearLayout textContainer = new LinearLayout(this);
        textContainer.setOrientation(LinearLayout.VERTICAL);
        textContainer.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams textParams =
            new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        textParams.leftMargin = dp(7);
        capsule.addView(textContainer, textParams);

        titleView = new TextView(this);
        titleView.setSingleLine(true);
        titleView.setEllipsize(TextUtils.TruncateAt.END);
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(12);
        titleView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        textContainer.addView(titleView, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        artistView = new TextView(this);
        artistView.setSingleLine(true);
        artistView.setEllipsize(TextUtils.TruncateAt.END);
        artistView.setTextColor(Color.rgb(173, 187, 203));
        artistView.setTextSize(10);
        textContainer.addView(artistView, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        capsule.setOnClickListener(view -> {
            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(launchIntent);
            }
        });
        return capsule;
    }

    private void removeCapsule() {
        if (windowManager != null && capsuleView != null && capsuleView.getParent() != null) {
            windowManager.removeView(capsuleView);
        }
        capsuleView = null;
        titleView = null;
        artistView = null;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private int statusBarHeight() {
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : dp(24);
    }

    private String nonEmpty(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
