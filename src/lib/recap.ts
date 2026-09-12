import type { UserData } from "../types";
import { getWeekKey, priorWeekKey } from "./week";
import { todayKey } from "./dates";

export type RecapDay = { key: string; label: string; minutes: number };

export type WeeklyRecap = {
  weekKey: string;
  rangeLabel: string;
  days: RecapDay[];
  totalMinutes: number;
  previousMinutes: number;
  /** Percent change vs the week before; null when the prior week had no minutes. */
  deltaPct: number | null;
  bestDay: RecapDay | null;
  sessions: number;
  fullSessions: number;
  tasksDone: number;
  topTag: { tag: string; minutes: number } | null;
  streakAtEnd: number;
  streakLabel: string;
  activeDays: number;
};

/** Monday (local midnight) of the ISO week containing `date`. */
export function mondayOf(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function daysFrom(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Session storage flag so Home can deep-link into the Analytics recap sheet. */
export const RECAP_OPEN_FLAG = "studygrind_open_recap";

/**
 * Builds a recap for the ISO week *before* the one containing `now` (i.e. "last week").
 * Uses `weeklyHistory` (day → minutes) and `sessionLog` for sessions/tasks/tags.
 */
export function buildWeeklyRecap(user: UserData, now = new Date()): WeeklyRecap {
  const thisMonday = mondayOf(now);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const prevMonday = new Date(lastMonday);
  prevMonday.setDate(lastMonday.getDate() - 7);

  const weekKey = getWeekKey(lastMonday);
  const lastDays = daysFrom(lastMonday);
  const prevDays = daysFrom(prevMonday);

  const days: RecapDay[] = lastDays.map((d) => {
    const key = todayKey(d);
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      minutes: user.weeklyHistory?.[key] ?? 0,
    };
  });
  const totalMinutes = days.reduce((a, d) => a + d.minutes, 0);
  const previousMinutes = prevDays.reduce((a, d) => a + (user.weeklyHistory?.[todayKey(d)] ?? 0), 0);
  const deltaPct = previousMinutes > 0 ? Math.round(((totalMinutes - previousMinutes) / previousMinutes) * 100) : null;

  const best = days.reduce<RecapDay | null>((acc, d) => (d.minutes > 0 && (!acc || d.minutes > acc.minutes) ? d : acc), null);

  const startMs = lastMonday.getTime();
  const endMs = thisMonday.getTime();
  const inWeek = (user.sessionLog ?? []).filter((s) => {
    const t = new Date(s.at).getTime();
    return t >= startMs && t < endMs;
  });
  const sessions = inWeek.length;
  const fullSessions = inWeek.filter((s) => s.completedFullFocus).length;
  const tasksDone = inWeek.filter((s) => s.taskCompleted).length;

  // Top tag: attribute each session's minutes to its linked task's tag (fallback "General").
  const tagMinutes: Record<string, number> = {};
  inWeek.forEach((s) => {
    const task = s.taskId ? user.tasks.find((t) => t.id === s.taskId) : undefined;
    const tag = task?.tag ?? "General";
    tagMinutes[tag] = (tagMinutes[tag] ?? 0) + s.minutes;
  });
  const topEntry = Object.entries(tagMinutes).sort((a, b) => b[1] - a[1])[0];
  const topTag = topEntry && topEntry[1] > 0 ? { tag: topEntry[0], minutes: topEntry[1] } : null;

  const activeDays = days.filter((d) => d.minutes > 0).length;
  const streakAtEnd = user.streak;
  const streakLabel =
    activeDays === 7
      ? "Perfect week — every day active"
      : activeDays >= 5
        ? `${activeDays}/7 days active — strong`
        : activeDays >= 3
          ? `${activeDays}/7 days active`
          : activeDays > 0
            ? `${activeDays}/7 days — room to grow`
            : "No focus logged";

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const rangeLabel = `${fmt(lastDays[0])} – ${fmt(lastDays[6])}`;

  return {
    weekKey,
    rangeLabel,
    days,
    totalMinutes,
    previousMinutes,
    deltaPct,
    bestDay: best,
    sessions,
    fullSessions,
    tasksDone,
    topTag,
    streakAtEnd,
    streakLabel,
    activeDays,
  };
}

/** True when today is Monday and the user hasn't viewed this week's recap yet. */
export function shouldShowRecapNotice(user: UserData, now = new Date()): boolean {
  if (now.getDay() !== 1) return false;
  const current = getWeekKey(now);
  return user.lastRecapSeenWeek !== current;
}

/** The week key the recap notice is "for" (the current week — the recap covers the one before). */
export function recapNoticeWeekKey(now = new Date()): string {
  return getWeekKey(now);
}

export { priorWeekKey };
