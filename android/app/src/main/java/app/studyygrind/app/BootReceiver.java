package app.studyygrind.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * After reboot: refresh the home-screen widget and schedule native notification backup
 * if the user had reminders enabled (until Capacitor reschedules on next app open).
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            WidgetHelper.refreshAll(context);
            if (NotificationPrefsHelper.isEnabled(context)) {
                ReminderAlarmReceiver.ensureChannel(context);
                DailyReminderScheduler.scheduleNextAlarm(context);
            }
        }
    }
}
