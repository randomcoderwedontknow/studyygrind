package app.studyygrind.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * Fires when the native boot-backup alarm triggers (before the app has reopened).
 * Posts a daily reminder that deep-links to the focus timer.
 */
public class ReminderAlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "study-reminders-v2";
    public static final int NOTIFICATION_ID = 9001;
    public static final String DEEP_LINK_TIMER = "studygrind://timer";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!NotificationPrefsHelper.isEnabled(context)) return;

        ensureChannel(context);

        Intent launch = new Intent(Intent.ACTION_VIEW, Uri.parse(DEEP_LINK_TIMER));
        launch.setClass(context, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pending = PendingIntent.getActivity(context, NOTIFICATION_ID, launch, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_studygrind)
                .setContentTitle("StudyGrind")
                .setContentText("Time to focus — open the timer and start a session.")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pending);

        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS not granted after reboot — Capacitor restore or next app open will reschedule.
        }

        // Schedule the next day's alarm (one-shot chain).
        DailyReminderScheduler.scheduleNextAlarm(context);
    }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Study reminders",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Daily StudyGrind focus reminders at 5 PM Eastern");
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm != null) nm.createNotificationChannel(channel);
    }
}
