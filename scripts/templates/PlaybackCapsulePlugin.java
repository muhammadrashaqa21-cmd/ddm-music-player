package __PACKAGE__;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PlaybackCapsule")
public class PlaybackCapsulePlugin extends Plugin {
    @PluginMethod
    public void hasOverlayPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", Build.VERSION.SDK_INT < Build.VERSION_CODES.M
            || Settings.canDrawOverlays(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void openOverlayPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M
            || Settings.canDrawOverlays(getContext())) {
            call.resolve();
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException error) {
            call.reject("Tidak dapat membuka pengaturan izin overlay Android.", error);
        }
    }

    @PluginMethod
    public void show(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            && !Settings.canDrawOverlays(getContext())) {
            call.reject("Izin Tampil di atas aplikasi lain belum diberikan.");
            return;
        }

        String title = call.getString("title");
        String artist = call.getString("artist");
        Intent intent = new Intent(getContext(), PlaybackCapsuleService.class);
        intent.setAction(PlaybackCapsuleService.ACTION_SHOW);
        intent.putExtra(PlaybackCapsuleService.EXTRA_TITLE, title);
        intent.putExtra(PlaybackCapsuleService.EXTRA_ARTIST, artist);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        Intent intent = new Intent(getContext(), PlaybackCapsuleService.class);
        getContext().stopService(intent);
        call.resolve();
    }
}
