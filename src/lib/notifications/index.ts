import { isNative } from "../native";
import { cancelNativeNotificationBackup, setNativeNotificationsEnabled } from "../notification-prefs";
import type { NotificationService } from "./types";
import { webNotificationStub } from "./web-stub";

let androidService: NotificationService | null = null;

export async function getNotificationService(): Promise<NotificationService> {
  if (!isNative) return webNotificationStub;
  if (!androidService) {
    const mod = await import("./android");
    androidService = mod.androidNotificationService;
  }
  return androidService;
}

export async function syncNotificationSchedule(enabled: boolean): Promise<void> {
  const svc = await getNotificationService();
  if (!svc.isSupported) return;
  if (enabled) {
    await svc.scheduleDailyReminder(17, 0, "America/New_York");
    await setNativeNotificationsEnabled(true);
    // Capacitor owns scheduling while the app has run — cancel native AlarmManager backup to avoid duplicates.
    await cancelNativeNotificationBackup();
  } else {
    await svc.cancelDailyReminder();
    await setNativeNotificationsEnabled(false);
    await cancelNativeNotificationBackup();
  }
}

export { ensureExactAlarmPermission } from "./android";
