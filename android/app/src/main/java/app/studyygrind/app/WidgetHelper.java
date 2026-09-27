package app.studyygrind.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;

import org.json.JSONObject;

/** Shared widget payload + refresh all StudyGrind widget providers. */
public final class WidgetHelper {

    public static final String PREFS_GROUP = "CapacitorStorage";
    private static final String PREFS_GROUP_FALLBACK = "StudyGrindPrefs";
    public static final String DATA_KEY = "widget_data";

    public static final int SIZE_SMALL = 0;
    public static final int SIZE_MEDIUM = 1;
    public static final int SIZE_LARGE = 2;

    private WidgetHelper() {}

    public static void refreshAll(Context context) {
        StudyGrindWidget.refreshAll(context);
        StreakFlameWidget.refreshAll(context);
        NextTaskWidget.refreshAll(context);
        QuickTimerWidget.refreshAll(context);
    }

    public static int widgetSize(AppWidgetManager mgr, int appWidgetId) {
        Bundle opts = mgr.getAppWidgetOptions(appWidgetId);
        int w = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110);
        int h = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110);
        if (w >= 200 || h >= 130) return SIZE_LARGE;
        if (h < 72) return SIZE_SMALL;
        return SIZE_MEDIUM;
    }

    public static WidgetData readData(Context context) {
        String raw = readRaw(context, PREFS_GROUP);
        if (raw == null) raw = readRaw(context, PREFS_GROUP_FALLBACK);
        WidgetData d = new WidgetData();
        if (raw == null) return d;
        try {
            JSONObject o = new JSONObject(raw);
            d.todayMinutes = o.optInt("todayMinutes", 0);
            d.streak = o.optInt("streak", 0);
            d.points = o.optLong("points", 0L);
            d.username = o.optString("username", "");
            d.updatedAt = o.optString("updatedAt", "");
            d.nextTaskTitle = o.optString("nextTaskTitle", "");
            d.nextTaskId = o.optString("nextTaskId", "");
            d.timerRunning = o.optBoolean("timerRunning", false);
            d.timerSecondsLeft = o.optInt("timerSecondsLeft", 0);
            d.focusDurationMin = o.optInt("focusDurationMin", 25);
        } catch (Exception ignored) {
        }
        return d;
    }

    private static String readRaw(Context context, String group) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(group, Context.MODE_PRIVATE);
            return prefs.getString(DATA_KEY, null);
        } catch (Exception e) {
            return null;
        }
    }

    static void refreshProvider(Context context, Class<?> cls) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        if (mgr == null) return;
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, cls));
        if (cls == StudyGrindWidget.class) {
            for (int id : ids) StudyGrindWidget.updateWidget(context, mgr, id);
        } else if (cls == StreakFlameWidget.class) {
            for (int id : ids) StreakFlameWidget.updateWidget(context, mgr, id);
        } else if (cls == NextTaskWidget.class) {
            for (int id : ids) NextTaskWidget.updateWidget(context, mgr, id);
        } else if (cls == QuickTimerWidget.class) {
            for (int id : ids) QuickTimerWidget.updateWidget(context, mgr, id);
        }
    }

    public static final class WidgetData {
        public int todayMinutes = 0;
        public int streak = 0;
        public long points = 0L;
        public String username = "";
        public String updatedAt = "";
        public String nextTaskTitle = "";
        public String nextTaskId = "";
        public boolean timerRunning = false;
        public int timerSecondsLeft = 0;
        public int focusDurationMin = 25;
    }
}
