import { isNative } from "../native";
import { cancelNativeNotificationBackup, setNativeNotificationsEnabled } from "../notification-prefs";
import type { NotificationService } from "./types";
import { webNotificationStub } from "./web-stub";

const LONDON_TZ = "Europe/London";

let androidService: NotificationService | null = null;

export async function getNotificationService(): Promise<NotificationService> {
  if (!isNative) return webNotificationStub;
  if (!androidService) {
    const mod = await import("./android");
    androidService = mod.androidNotificationService;
  }
  return androidService;
}

export async function syncNotificationSchedule(
  enabled: boolean,
  hour = 17,
  minute = 0,
  timeZone = LONDON_TZ,
): Promise<void> {
  const svc = await getNotificationService();
  if (!svc.isSupported) return;
  if (enabled) {
    await svc.scheduleDailyReminder(hour, minute, timeZone);
    await setNativeNotificationsEnabled(true, hour, minute);
    // Capacitor owns scheduling while the app has run — cancel native AlarmManager backup to avoid duplicates.
    await cancelNativeNotificationBackup();
  } else {
    await svc.cancelDailyReminder();
    await setNativeNotificationsEnabled(false);
    await cancelNativeNotificationBackup();
  }
}

export { ensureExactAlarmPermission } from "./android";
