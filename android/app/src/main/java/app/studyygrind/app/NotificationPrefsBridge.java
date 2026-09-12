package app.studyygrind.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Persists notification preference for boot-time native backup scheduling.
 * JS calls this when the user toggles reminders; Capacitor Local Notifications remain primary.
 */
@CapacitorPlugin(name = "NotificationPrefs")
public class NotificationPrefsBridge extends Plugin {

    @PluginMethod
    public void setNotificationsEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        Integer hour = call.getInt("hour", 17);
        Integer minute = call.getInt("minute", 0);
        NotificationPrefsHelper.setEnabled(getContext(), enabled);
        NotificationPrefsHelper.setReminderTime(getContext(), hour, minute);
        DailyReminderScheduler.cancel(getContext());
        call.resolve();
    }

    @PluginMethod
    public void scheduleNativeBackup(PluginCall call) {
        if (NotificationPrefsHelper.isEnabled(getContext())) {
            DailyReminderScheduler.scheduleNextAlarm(getContext());
        }
        call.resolve();
    }

    @PluginMethod
    public void cancelNativeBackup(PluginCall call) {
        DailyReminderScheduler.cancel(getContext());
        call.resolve();
    }
}
