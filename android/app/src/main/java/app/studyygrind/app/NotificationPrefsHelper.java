package app.studyygrind.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Native prefs for boot-time notification backup (written from JS via NotificationPrefsBridge). */
public final class NotificationPrefsHelper {

    public static final String PREFS_NAME = "StudyGrindNative";
    public static final String KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";

    private NotificationPrefsHelper() {}

    public static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled).apply();
    }

    public static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_NOTIFICATIONS_ENABLED, false);
    }
}
