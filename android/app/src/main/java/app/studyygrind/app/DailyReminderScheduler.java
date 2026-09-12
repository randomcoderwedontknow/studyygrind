package app.studyygrind.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * Native backup scheduler for daily 5:00 PM America/New_York reminders.
 * Used after BOOT_COMPLETED until the web layer reschedules via Capacitor.
 */
public final class DailyReminderScheduler {

    public static final int ALARM_REQUEST_CODE = 9001;
    private static final TimeZone TZ = TimeZone.getTimeZone("America/New_York");

    private DailyReminderScheduler() {}

    /** Schedule the next one-shot alarm at 5 PM Eastern. */
    public static void scheduleNextAlarm(Context context) {
        if (!NotificationPrefsHelper.isEnabled(context)) return;

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        PendingIntent pi = alarmPendingIntent(context);
        long triggerAt = nextFivePmEasternMillis();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (SecurityException ignored) {
            // Exact alarm permission missing on API 31+ — Capacitor path handles when app opens.
        }
    }

    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(alarmPendingIntent(context));
    }

    private static PendingIntent alarmPendingIntent(Context context) {
        Intent intent = new Intent(context, ReminderAlarmReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);
    }

    /** Millis for the next 17:00 in America/New_York (today or tomorrow). */
    static long nextFivePmEasternMillis() {
        Calendar cal = Calendar.getInstance(TZ);
        cal.set(Calendar.HOUR_OF_DAY, 17);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        return cal.getTimeInMillis();
    }
}
