import { LocalNotifications } from "@capacitor/local-notifications";
import { randomReminderMessage } from "./messages";
import type { NotificationService } from "./types";

const DAILY_ID = 9001;
const CHANNEL_ID = "study-reminders-v2";
const TZ = "America/New_York";

function nextEasternReminder(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
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
  if (h > 17 || (h === 17 && min >= 0)) targetDay += 1;
  const utcGuess = Date.UTC(y, m - 1, targetDay, 17, 0, 0);
  for (let i = 0; i < 48; i++) {
    const probe = new Date(utcGuess + i * 30 * 60_000);
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(probe);
    const ph = Number(p.find((x) => x.type === "hour")?.value ?? 0);
    const pm = Number(p.find((x) => x.type === "minute")?.value ?? 0);
    if (ph === 17 && pm === 0) return probe;
  }
  return new Date(Date.now() + 60_000);
}

async function ensureChannel() {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Study reminders",
    description: "Daily StudyGrind focus reminders at 5 PM Eastern",
    importance: 4,
    visibility: 1,
  });
}

export async function scheduleDailyReminderInternal() {
  await ensureChannel();
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
  const at = nextEasternReminder();
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

  async scheduleDailyReminder(_hour: number, _minute: number, _tz: string) {
    await scheduleDailyReminderInternal();
  },

  async cancelDailyReminder() {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_ID }] });
  },
};
