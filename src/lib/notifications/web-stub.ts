import type { NotificationPermission, NotificationService } from "./types";

export const webNotificationStub: NotificationService = {
  platform: "web-stub",
  isSupported: () => false,
  async getPermission(): Promise<NotificationPermission> {
    return "unsupported";
  },
  async requestPermission(): Promise<NotificationPermission> {
    return "unsupported";
  },
  async scheduleDailyReminder(): Promise<void> {
    /* Android app only — see README in this folder */
  },
  async cancelDailyReminder(): Promise<void> {},
};
