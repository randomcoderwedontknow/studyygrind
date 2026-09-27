package app.studyygrind.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * 2x2 "Focus" home-screen widget: today's focus minutes, streak and points, plus a
 * "Start focus" tap target that deep-links into the timer tab (studygrind://timer).
 *
 * Data comes from the Capacitor Preferences plugin, which stores values in a
 * SharedPreferences file named after its "group" (see src/lib/widget.ts —
 * WIDGET_PREFS_GROUP). The web layer writes JSON under {@link #DATA_KEY} and then
 * calls WidgetBridge.refresh(), which broadcasts ACTION_APPWIDGET_UPDATE to this provider.
 */
public class StudyGrindWidget extends AppWidgetProvider {

    /** Must match WIDGET_PREFS_GROUP in src/lib/widget.ts. */
    public static final String PREFS_GROUP = "CapacitorStorage";
    /** Fallback: group name declared in capacitor.config.ts (used if the plugin is ever configured with it). */
    private static final String PREFS_GROUP_FALLBACK = "StudyGrindPrefs";
    /** Must match WIDGET_DATA_KEY in src/lib/widget.ts. */
    public static final String DATA_KEY = "widget_data";

    public static final String DEEP_LINK_TIMER = "studygrind://timer";
    public static final String DEEP_LINK_HOME = "studygrind://home";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        // A bare ACTION_APPWIDGET_UPDATE without ids (our WidgetBridge fallback) → refresh all.
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())
                && !intent.hasExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)) {
            refreshAll(context);
        }
    }

    /** Push fresh data to every placed instance of this widget. */
    public static void refreshAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        if (mgr == null) return;
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, StudyGrindWidget.class));
        for (int id : ids) {
            updateWidget(context, mgr, id);
        }
    }

    static void updateWidget(Context context, AppWidgetManager mgr, int appWidgetId) {
        WidgetHelper.WidgetData data = WidgetHelper.readData(context);
        int size = WidgetHelper.widgetSize(mgr, appWidgetId);
        int layout =
                size == WidgetHelper.SIZE_SMALL
                        ? R.layout.widget_focus_small
                        : size == WidgetHelper.SIZE_LARGE
                                ? R.layout.widget_focus_large
                                : R.layout.widget_focus;
        RemoteViews views = new RemoteViews(context.getPackageName(), layout);

        views.setTextViewText(R.id.widget_minutes, String.valueOf(data.todayMinutes));
        if (layout != R.layout.widget_focus_small) {
            if (layout == R.layout.widget_focus_large) {
                views.setTextViewText(R.id.widget_streak, data.streak + "d streak");
                views.setTextViewText(R.id.widget_points, formatPoints(data.points) + " pts");
            } else {
                views.setTextViewText(R.id.widget_streak, data.streak + "d");
                views.setTextViewText(R.id.widget_points, formatPoints(data.points));
            }
            views.setTextViewText(
                    R.id.widget_name,
                    data.username.isEmpty() ? context.getString(R.string.app_name) : data.username);
            views.setOnClickPendingIntent(R.id.widget_start, deepLink(context, DEEP_LINK_TIMER, 2));
        }

        views.setOnClickPendingIntent(R.id.widget_root, deepLink(context, DEEP_LINK_HOME, 1));

        mgr.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent deepLink(Context context, String url, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    private static String formatPoints(long points) {
        if (points >= 1_000_000) return String.format(java.util.Locale.US, "%.1fM", points / 1_000_000.0);
        if (points >= 10_000) return String.format(java.util.Locale.US, "%.0fk", points / 1000.0);
        if (points >= 1_000) return String.format(java.util.Locale.US, "%.1fk", points / 1000.0);
        return String.valueOf(points);
    }

}
