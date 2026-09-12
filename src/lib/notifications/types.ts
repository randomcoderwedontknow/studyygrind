export type NotificationPermission = "granted" | "denied" | "prompt" | "unsupported";

export interface NotificationService {
  readonly platform: "web-stub" | "android";
  isSupported(): boolean;
  getPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  scheduleDailyReminder(hour: number, minute: number, timeZone: string): Promise<void>;
  cancelDailyReminder(): Promise<void>;
}
