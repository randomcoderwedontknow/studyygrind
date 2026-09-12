import type { UserData, WeekRecord } from "../types";

/** ISO week key e.g. 2026-W21 (Monday-based week) */
export function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function sumDays(history: Record<string, number>, days: number): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    total += history[getDayKey(d)] ?? 0;
  }
  return total;
}

export function weekMinutesFromHistory(history: Record<string, number>, weekKey: string): number {
  const [yearStr, wPart] = weekKey.split("-W");
  const year = Number(yearStr);
  const week = Number(wPart);
  if (!year || !week) return 0;
  let total = 0;
  const jan4 = new Date(year, 0, 4);
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    total += history[getDayKey(d)] ?? 0;
  }
  return total;
}

export function emptyWeekRecord(weekKey: string): WeekRecord {
  return { weekKey, focusMinutes: 0, challengeProgress: 0, titlesUnlockedThisWeek: [] };
}

export function ensureCurrentWeek(user: UserData): UserData {
  const weekKey = getWeekKey();
  const records = { ...(user.weeklyRecords ?? {}) };
  if (!records[weekKey]) {
    records[weekKey] = emptyWeekRecord(weekKey);
  }
  const syncedMinutes = weekMinutesFromHistory(user.weeklyHistory, weekKey);
  if (records[weekKey].focusMinutes < syncedMinutes) {
    records[weekKey] = { ...records[weekKey], focusMinutes: syncedMinutes };
  }
  return { ...user, weeklyRecords: records };
}

export function addWeeklyMinutes(user: UserData, minutes: number): UserData {
  const u = ensureCurrentWeek(user);
  const weekKey = getWeekKey();
  const rec = u.weeklyRecords[weekKey] ?? emptyWeekRecord(weekKey);
  return {
    ...u,
    weeklyRecords: {
      ...u.weeklyRecords,
      [weekKey]: { ...rec, focusMinutes: rec.focusMinutes + minutes },
    },
  };
}

export type WeekIntensity = "light" | "moderate" | "heavy";

export function classifyWeek(minutes: number): WeekIntensity {
  if (minutes < 60) return "light";
  if (minutes < 300) return "moderate";
  return "heavy";
}

export function compareWeeks(
  currentMinutes: number,
  priorMinutes: number,
): "up" | "down" | "same" | "first" {
  if (priorMinutes <= 0 && currentMinutes > 0) return currentMinutes > 0 ? "up" : "first";
  if (priorMinutes <= 0) return "first";
  if (currentMinutes > priorMinutes * 1.1) return "up";
  if (currentMinutes < priorMinutes * 0.85) return "down";
  return "same";
}

export function priorWeekKey(weekKey: string): string {
  const [y, w] = weekKey.split("-W").map(Number);
  if (w <= 1) return `${y - 1}-W52`;
  return `${y}-W${String(w - 1).padStart(2, "0")}`;
}
