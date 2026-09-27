package app.studyygrind.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tiny Capacitor plugin so the web layer can force the home-screen widget to repaint
 * right after it writes new stats into Preferences. Registered in MainActivity.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        try {
            WidgetHelper.refreshAll(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("Widget refresh failed", e);
        }
    }
}
