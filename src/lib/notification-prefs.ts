import { registerPlugin } from "@capacitor/core";
import { isNative } from "./native";

export interface NotificationPrefsPlugin {
  setNotificationsEnabled(options: { enabled: boolean; hour?: number; minute?: number }): Promise<void>;
  scheduleNativeBackup(): Promise<void>;
  cancelNativeBackup(): Promise<void>;
}

const NotificationPrefs = registerPlugin<NotificationPrefsPlugin>("NotificationPrefs");

export async function setNativeNotificationsEnabled(
  enabled: boolean,
  hour = 17,
  minute = 0,
): Promise<void> {
  if (!isNative) return;
  try {
    await NotificationPrefs.setNotificationsEnabled({ enabled, hour, minute });
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.setNotificationsEnabled failed:", err);
  }
}

export async function cancelNativeNotificationBackup(): Promise<void> {
  if (!isNative) return;
  try {
    await NotificationPrefs.cancelNativeBackup();
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.cancelNativeBackup failed:", err);
  }
}

export async function scheduleNativeNotificationBackup(): Promise<void> {
  if (!isNative) return;
  try {
    await NotificationPrefs.scheduleNativeBackup();
  } catch (err) {
    console.warn("[StudyGrind] NotificationPrefs.scheduleNativeBackup failed:", err);
  }
}
