package app.studyygrind.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class QuickTimerWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) updateWidget(context, mgr, id);
    }

    public static void refreshAll(Context context) {
        WidgetHelper.refreshProvider(context, QuickTimerWidget.class);
    }

    static void updateWidget(Context context, AppWidgetManager mgr, int id) {
        WidgetHelper.WidgetData data = WidgetHelper.readData(context);
        int size = WidgetHelper.widgetSize(mgr, id);
        int layout =
                size == WidgetHelper.SIZE_SMALL
                        ? R.layout.widget_quick_small
                        : size == WidgetHelper.SIZE_LARGE
                                ? R.layout.widget_quick_large
                                : R.layout.widget_quick;
        RemoteViews views = new RemoteViews(context.getPackageName(), layout);
        if (data.timerRunning) {
            int mm = data.timerSecondsLeft / 60;
            int ss = data.timerSecondsLeft % 60;
            views.setTextViewText(R.id.widget_quick_label, String.format(java.util.Locale.US, "%02d:%02d left", mm, ss));
        } else {
            views.setTextViewText(R.id.widget_quick_label, "Start " + data.focusDurationMin + "m");
        }
        views.setOnClickPendingIntent(R.id.widget_root, open(context, StudyGrindWidget.DEEP_LINK_TIMER, 30));
        mgr.updateAppWidget(id, views);
    }

    private static PendingIntent open(Context context, String url, int code) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, code, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
