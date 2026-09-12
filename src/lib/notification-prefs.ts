import { Capacitor, registerPlugin } from "@capacitor/core";

export interface NotificationPrefsPlugin {
  setNotificationsEnabled(options: { enabled: boolean }): Promise<void>;
  cancelNativeBackup(): Promise<void>;
  scheduleNativeBackup(): Promise<void>;
}

const NotificationPrefs = registerPlugin<NotificationPrefsPlugin>("NotificationPrefs");

export async function setNativeNotificationsEnabled(enabled: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NotificationPrefs.setNotificationsEnabled({ enabled });
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.setNotificationsEnabled failed:", err);
  }
}

export async function cancelNativeNotificationBackup(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NotificationPrefs.cancelNativeBackup();
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.cancelNativeBackup failed:", err);
  }
}

export async function scheduleNativeNotificationBackup(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NotificationPrefs.scheduleNativeBackup();
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.scheduleNativeBackup failed:", err);
  }
}
