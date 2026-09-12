import { LocalNotifications } from "@capacitor/local-notifications";
import { randomReminderMessage } from "./messages";
import type { NotificationService } from "./types";

const DAILY_ID = 9001;
const CHANNEL_ID = "study-reminders-v2";
export const REMINDER_TIME_ZONE = "Europe/London";

function nextReminderInTimeZone(hour: number, minute: number, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const h = get("hour");
  const min = get("minute");
  let targetDay = d;
  if (h > hour || (h === hour && min >= minute)) targetDay += 1;
  const utcGuess = Date.UTC(y, m - 1, targetDay, hour, minute, 0);
  for (let i = 0; i < 48; i++) {
    const probe = new Date(utcGuess + i * 30 * 60_000);
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(probe);
    const ph = Number(p.find((x) => x.type === "hour")?.value ?? 0);
    const pm = Number(p.find((x) => x.type === "minute")?.value ?? 0);
    if (ph === hour && pm === minute) return probe;
  }
  return new Date(Date.now() + 60_000);
}

async function ensureChannel(hour: number, minute: number) {
  const label = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"} London`;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Study reminders",
    description: `Daily StudyGrind focus reminders at ${label} (GMT/BST)`,
    importance: 4,
    visibility: 1,
  });
}

export async function scheduleDailyReminderInternal(
  hour: number,
  minute: number,
  timeZone: string = REMINDER_TIME_ZONE,
) {
  await ensureChannel(hour, minute);
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
  const at = nextReminderInTimeZone(hour, minute, timeZone);
  const daySeed = at.toISOString().slice(0, 10);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_ID,
        title: "StudyGrind",
        body: randomReminderMessage(daySeed),
        channelId: CHANNEL_ID,
        smallIcon: "ic_stat_studygrind",
        extra: { route: "timer", url: "studygrind://timer" },
        actionTypeId: "OPEN_TIMER",
        schedule: {
          at,
          repeats: true,
          every: "day",
          allowWhileIdle: true,
        },
      },
    ],
  });
}

/** Request exact-alarm permission on API 31+ (Samsung / Android 12+). */
export async function ensureExactAlarmPermission(): Promise<boolean> {
  try {
    const check = await LocalNotifications.checkExactNotificationSetting();
    if (check.exact_alarm === "granted") return true;
    const req = await LocalNotifications.changeExactNotificationSetting();
    return req.exact_alarm === "granted";
  } catch {
    return true;
  }
}

export const androidNotificationService: NotificationService = {
  platform: "android",
  isSupported: () => true,

  async getPermission() {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") return "granted" as const;
    if (perm.display === "denied") return "denied" as const;
    return "prompt" as const;
  },

  async requestPermission() {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted" ? ("granted" as const) : ("denied" as const);
  },

  async scheduleDailyReminder(hour: number, minute: number, tz: string) {
    await scheduleDailyReminderInternal(hour, minute, tz);
  },

  async cancelDailyReminder() {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
  },
};
