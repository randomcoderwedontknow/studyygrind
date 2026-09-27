package app.studyygrind.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TimerNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if ("studygrind.timer.pause".equals(action)) {
            FocusTimerNotificationPlugin.emitAction("pause");
        } else if ("studygrind.timer.add5".equals(action)) {
            FocusTimerNotificationPlugin.emitAction("add5");
        } else if ("studygrind.timer.end".equals(action)) {
            FocusTimerNotificationPlugin.emitAction("end");
        }
    }
}
