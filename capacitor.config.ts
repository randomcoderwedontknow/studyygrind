import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.studyygrind.app",
  appName: "StudyGrind",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#f4f7f5",
  android: {
    allowMixedContent: false,
    captureInput: true,
    // Release-ready: disable WebView remote debugging in shipped APKs.
    webContentsDebuggingEnabled: false,
    backgroundColor: "#f4f7f5",
  },
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: "#f4f7f5",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c1411",
      overlaysWebView: false,
    },
    Preferences: {
      group: "StudyGrindPrefs",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_studygrind",
      iconColor: "#31be83",
    },
  },
};

export default config;
