package app.studyygrind.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FocusTimerNotification")
public class FocusTimerNotificationPlugin extends Plugin {

    static final String CHANNEL_ID = "studygrind_focus_timer";
    static final int NOTIF_ID = 44012;
    static FocusTimerNotificationPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void update(PluginCall call) {
        boolean running = call.getBoolean("running", false);
        boolean paused = call.getBoolean("paused", false);
        int secondsLeft = call.getInt("secondsLeft", 0);
        String phase = call.getString("phase", "focus");
        if (!"focus".equals(phase)) {
            cancelNotification();
            call.resolve();
            return;
        }
        if (!running && secondsLeft <= 0) {
            cancelNotification();
            call.resolve();
            return;
        }
        Context ctx = getContext();
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.reject("No notification manager");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Focus timer", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        int mm = secondsLeft / 60;
        int ss = secondsLeft % 60;
        String time = String.format(java.util.Locale.US, "%02d:%02d", mm, ss);
        String title = paused ? "Focus paused · " + time : "Focus · " + time;

        Notification.Builder builder =
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? new Notification.Builder(ctx, CHANNEL_ID)
                        : new Notification.Builder(ctx);

        builder
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText("StudyGrind focus session")
                .setOngoing(running && !paused)
                .setOnlyAlertOnce(true)
                .setContentIntent(openApp(ctx))
                .addAction(buildAction(ctx, "pause", paused ? "Resume" : "Pause", 1))
                .addAction(buildAction(ctx, "add5", "+5 min", 2))
                .addAction(buildAction(ctx, "end", "End", 3));

        nm.notify(NOTIF_ID, builder.build());
        call.resolve();
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        cancelNotification();
        call.resolve();
    }

    private void cancelNotification() {
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIF_ID);
    }

    static void emitAction(String action) {
        if (instance == null) return;
        JSObject data = new JSObject();
        data.put("action", action);
        instance.notifyListeners("timerAction", data);
    }

    private static PendingIntent openApp(Context ctx) {
        Intent intent = new Intent(ctx, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(ctx, 0, intent, flags);
    }

    private static Notification.Action buildAction(Context ctx, String action, String label, int req) {
        Intent intent = new Intent(ctx, TimerNotificationReceiver.class);
        intent.setAction("studygrind.timer." + action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(ctx, req, intent, flags);
        return new Notification.Action.Builder(null, label, pi).build();
    }
}
