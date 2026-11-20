package substrack.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Reminder reliability helpers: the "Alarms & reminders" permission (Android
 * 12+) and the battery-optimisation exemption (Android 6+). Both live in system
 * settings, so the plugin only reports state and opens the right screen.
 *
 * Also owns the high-importance "payments" notification channel used by
 * src/domain/reminders.ts — created here so the sound is the system default;
 * the LocalNotifications channel API only accepts bundled raw resources.
 */
@CapacitorPlugin(name = "Alarms")
public class AlarmsPlugin extends Plugin {
    static final String CHANNEL_ID = "payments";

    @Override
    public void load() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "Напоминания о платежах", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Платежи по подпискам");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.enableVibration(true);
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .build();
        channel.setSound(Settings.System.DEFAULT_NOTIFICATION_URI, attrs);
        nm.createNotificationChannel(channel);
    }

    private boolean canScheduleExact() {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    private boolean batteryUnrestricted() {
        if (Build.VERSION.SDK_INT < 23) return true;
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }

    private void openScreen(Intent intent) {
        getContext().startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    private Intent appScreen(String action) {
        return new Intent(action, Uri.parse("package:" + getContext().getPackageName()));
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("exact", canScheduleExact());
        r.put("battery", batteryUnrestricted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestExact(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31 && !canScheduleExact()) {
            try {
                openScreen(appScreen(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM));
            } catch (Exception e) {
                openScreen(appScreen(Settings.ACTION_APPLICATION_DETAILS_SETTINGS));
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestBattery(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 23 && !batteryUnrestricted()) {
            try {
                openScreen(appScreen(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS));
            } catch (Exception e) {
                openScreen(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            }
        }
        call.resolve();
    }
}
