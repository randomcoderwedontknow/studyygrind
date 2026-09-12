import type { SessionLogEntry } from "../types";
import { classifyWeek, compareWeeks, getWeekKey, priorWeekKey } from "./week";
import type { UserData } from "../types";

export type WeeklyInsight = { title: string; body: string };

export function buildWeeklyInsights(user: UserData): WeeklyInsight[] {
  const weekKey = getWeekKey();
  const priorKey = priorWeekKey(weekKey);
  const current = user.weeklyRecords?.[weekKey]?.focusMinutes ?? 0;
  const prior = user.weeklyRecords?.[priorKey]?.focusMinutes ?? 0;
  const cmp = compareWeeks(current, prior);
  const intensity = classifyWeek(current);
  const insights: WeeklyInsight[] = [];

  if (cmp === "up") insights.push({ title: "Momentum", body: "You focused more this week than last week." });
  else if (cmp === "down")
    insights.push({ title: "Lighter week", body: "This was a lighter week than last. One short session today can restart momentum." });
  else if (cmp === "first" && current === 0)
    insights.push({ title: "Fresh week", body: "Start your first focus session this week to build progress." });
  else insights.push({ title: "Steady", body: "Your focus time is similar to last week — consistency counts." });

  if (intensity === "light" && current > 0)
    insights.push({ title: "Room to grow", body: "You've started — adding one more session will strengthen this week." });
  if (intensity === "heavy") insights.push({ title: "Strong week", body: "You studied a lot this week. Great discipline." });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byDay: Record<number, number> = {};
  user.sessionLog.forEach((s) => {
    const d = new Date(s.at);
    const diff = Math.floor((d.getTime() - weekStart.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) byDay[diff] = (byDay[diff] ?? 0) + s.minutes;
  });
  const best = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  if (best && Number(best[1]) > 0) {
    insights.push({
      title: "Best day",
      body: `Your strongest day was ${dayNames[Number(best[0])] ?? "this week"}.`,
    });
  }

  const sessions = user.sessionLog.filter((s) => {
    const d = new Date(s.at);
    return getWeekKey(d) === weekKey;
  });
  if (sessions.length) {
    const avg = sessions.reduce((a, s) => a + s.minutes, 0) / sessions.length;
    insights.push({
      title: "Session length",
      body:
        avg >= 40
          ? "You focused best in longer sessions this week."
          : "Shorter sessions worked well — try one longer block if you want more depth.",
    });
  }

  const weekPts = sessions.reduce((a, s) => a + (s.pointsEarned ?? 0), 0);
  if (weekPts > 0) insights.push({ title: "Points", body: `${weekPts.toLocaleString()} focus points earned from timer sessions this week.` });

  return insights.slice(0, 5);
}

export function filterSessions(
  log: SessionLogEntry[],
  filter: "today" | "week" | "month" | "all",
  taskId?: string,
  minMinutes?: number,
): SessionLogEntry[] {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekKey = getWeekKey();
  return log
    .filter((s) => {
      const d = s.at.slice(0, 10);
      if (filter === "today" && d !== today) return false;
      if (filter === "week" && getWeekKey(new Date(s.at)) !== weekKey) return false;
      if (filter === "month") {
        const m = now.toISOString().slice(0, 7);
        if (!s.at.startsWith(m)) return false;
      }
      if (taskId && s.taskId !== taskId) return false;
      if (minMinutes != null && s.minutes < minMinutes) return false;
      return true;
    })
    .reverse();
}
