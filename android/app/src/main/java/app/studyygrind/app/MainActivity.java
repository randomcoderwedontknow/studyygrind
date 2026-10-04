package app.studyygrind.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * Keeps the Capacitor WebView warm when switching apps for {@link #BACKGROUND_GRACE_MS}.
 * Configures cache/DOM storage so the bundled UI is less likely to cold-reload on resume.
 */
public class MainActivity extends BridgeActivity {

    /** Do not force a fresh WebView load if user returns within this window. */
    static final long BACKGROUND_GRACE_MS = 30L * 60L * 1000L;

    private static final String PREFS = "studygrind_web_session";
    private static final String KEY_BACKGROUND_AT = "background_at_ms";

    private long backgroundAtMs = 0L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationPrefsBridge.class);
        registerPlugin(FocusTimerNotificationPlugin.class);
        super.onCreate(savedInstanceState);
        scheduleWebViewConfig();
    }

    private void scheduleWebViewConfig() {
        Bridge bridge = getBridge();
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;
        webView.post(() -> configureWebView(webView));
    }

    private void configureWebView(WebView webView) {
        if (webView == null) return;
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setJavaScriptEnabled(true);
    }

    @Override
    public void onPause() {
        backgroundAtMs = System.currentTimeMillis();
        getSharedPreferences(PREFS, MODE_PRIVATE)
                .edit()
                .putLong(KEY_BACKGROUND_AT, backgroundAtMs)
                .apply();
        WebView webView = bridgeWebView();
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        long stored = getSharedPreferences(PREFS, MODE_PRIVATE).getLong(KEY_BACKGROUND_AT, 0L);
        if (backgroundAtMs == 0L && stored > 0L) {
            backgroundAtMs = stored;
        }
        WebView webView = bridgeWebView();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
        scheduleWebViewConfig();
    }

    @Override
    public void onStop() {
        WebView webView = bridgeWebView();
        if (webView != null) {
            long away = System.currentTimeMillis() - backgroundAtMs;
            if (away >= 0 && away < BACKGROUND_GRACE_MS) {
                webView.onPause();
                webView.pauseTimers();
            }
        }
        super.onStop();
    }

    /**
     * Avoid saving WebView state that can trigger a full document reload on short background.
     * Rotation is handled via {@code android:configChanges} on the activity.
     */
    @Override
    public void onSaveInstanceState(Bundle outState) {
        // Intentionally empty — retain in-memory WebView while process stays alive.
    }

    private WebView bridgeWebView() {
        Bridge bridge = getBridge();
        return bridge != null ? bridge.getWebView() : null;
    }
}
