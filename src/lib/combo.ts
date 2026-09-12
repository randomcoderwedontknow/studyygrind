import { COMBO_THRESHOLDS } from "../data/constants";
import { dayDiff, todayKey } from "./dates";
import type { UserData } from "../types";

export function comboMultiplierForStreak(streak: number): number {
  let mult = 1;
  for (const t of COMBO_THRESHOLDS) {
    if (streak >= t.days) mult = t.mult;
  }
  return mult;
}

/** Bump login/usage streak once per calendar day on app open */
export function recordDailyActive(user: UserData): UserData {
  const today = todayKey();
  if (user.lastActiveDate === today) return user;
  if (!user.lastActiveDate) {
    return { ...user, lastActiveDate: today, loginStreak: 1 };
  }
  const gap = dayDiff(user.lastActiveDate);
  const loginStreak = gap === 1 ? user.loginStreak + 1 : gap > 1 ? 1 : user.loginStreak;
  return { ...user, lastActiveDate: today, loginStreak };
}

export function comboMultiplier(user: UserData): number {
  return comboMultiplierForStreak(user.loginStreak ?? 0);
}

export function nextComboTier(streak: number): { days: number; mult: number } | null {
  for (const t of COMBO_THRESHOLDS) {
    if (streak < t.days) return t;
  }
  return null;
}

export function comboLabel(mult: number): string {
  if (mult >= 2) return "7-day combo · 2×";
  if (mult >= 1.75) return "5-day combo · 1.75×";
  if (mult >= 1.5) return "3-day combo · 1.5×";
  return "No combo yet";
}
