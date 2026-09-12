import { Capacitor } from "@capacitor/core";
import { App, type BackButtonListenerEvent } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
export const isAndroid = platform === "android";

export async function hideSplash(): Promise<void> {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch (err) {
    console.warn("[StudyGrind] hideSplash failed:", err);
  }
}

export async function applyStatusBarStyle(dark: boolean, themeColor: string): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: themeColor });
    }
  } catch (err) {
    console.warn("[StudyGrind] StatusBar setStyle failed:", err);
  }
}

export type BackHandler = (event: BackButtonListenerEvent) => boolean | void;

export function onBackButton(handler: BackHandler): () => void {
  if (!isNative) return () => {};
  let removed = false;
  let remove: (() => Promise<void>) | undefined;
  void App.addListener("backButton", (event) => {
    if (removed) return;
    handler(event);
  }).then((listenerHandle) => {
    remove = () => listenerHandle.remove();
    if (removed) {
      void listenerHandle.remove();
    }
  });
  return () => {
    removed = true;
    if (remove) void remove();
  };
}

export async function minimizeApp(): Promise<void> {
  if (!isNative) return;
  try {
    await App.minimizeApp();
  } catch (err) {
    console.warn("[StudyGrind] minimizeApp failed:", err);
  }
}

export async function exitApp(): Promise<void> {
  if (!isNative) return;
  try {
    await App.exitApp();
  } catch (err) {
    console.warn("[StudyGrind] exitApp failed:", err);
  }
}
