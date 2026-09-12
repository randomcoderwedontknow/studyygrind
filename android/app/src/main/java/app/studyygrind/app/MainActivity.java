package app.studyygrind.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Custom plugins must be registered before the bridge is created.
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationPrefsBridge.class);
        super.onCreate(savedInstanceState);
    }
}
