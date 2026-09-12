import type { AppStore, GlobalEvent } from "../types";

/** Bonus point days use the device local timezone (Wed, Fri, Sun). */
const BONUS_WEEKDAYS = new Set([0, 3, 5]); // Sun, Wed, Fri

export function isBonusPointsDay(d = new Date()): boolean {
  return BONUS_WEEKDAYS.has(d.getDay());
}

export function scheduledPointsMultiplier(d = new Date()): number {
  return isBonusPointsDay(d) ? 2 : 1;
}

export function activeGlobalEvent(store: AppStore, now = Date.now()): NonNullable<GlobalEvent> | null {
  if (!store.globalEvent) return null;
  if (new Date(store.globalEvent.expiresAt).getTime() <= now) return null;
  return store.globalEvent;
}

export function globalEventMultiplier(store: AppStore, now = Date.now()): number {
  return activeGlobalEvent(store, now)?.multiplier ?? 1;
}

/** Scheduled bonus days × active owner global event (if any). */
export function pointsEventMultiplier(store: AppStore, d = new Date(), now = Date.now()): number {
  return scheduledPointsMultiplier(d) * globalEventMultiplier(store, now);
}

export function scaleRewardPoints(basePoints: number, store: AppStore, d = new Date()): number {
  const mult = pointsEventMultiplier(store, d);
  return mult === 1 ? basePoints : Math.floor(basePoints * mult);
}

export function bonusDayScheduleLabel(): string {
  return "Wednesday, Friday, and Sunday";
}

export function pointsEventStatus(store: AppStore, d = new Date()): {
  multiplier: number;
  scheduledActive: boolean;
  globalActive: boolean;
  label: string | null;
} {
  const scheduledActive = isBonusPointsDay(d);
  const global = activeGlobalEvent(store);
  const multiplier = pointsEventMultiplier(store, d);
  const label =
    global?.label ??
    (scheduledActive ? `2× points — ${bonusDayScheduleLabel()} (local time)` : null);
  return {
    multiplier,
    scheduledActive,
    globalActive: Boolean(global),
    label,
  };
}
