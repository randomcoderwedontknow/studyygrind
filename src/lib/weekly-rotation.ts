import { WEEKLY_TITLE_THRESHOLDS } from "../data/constants";
import { pickWeeklyTitles } from "../data/pools/title-pool";
import { primaryWeeklyChallenge } from "../data/pools/challenge-pool";
import { pickDailyShopThemes } from "../data/pools/rotating-themes";
import { DAILY_SHOP_THEME_COUNT } from "../data/constants";
import type { UserData, WeeklyTitleUnlock } from "../types";
import { getWeekKey, getDayKey } from "./week";

export function weeklyTitleOffers(weekKey: string) {
  return pickWeeklyTitles(weekKey, WEEKLY_TITLE_THRESHOLDS.length).map((t, i) => ({
    ...t,
    threshold: WEEKLY_TITLE_THRESHOLDS[i],
  }));
}

export function currentWeeklyChallenge(weekKey: string) {
  return primaryWeeklyChallenge(weekKey);
}

export function dailyShopThemes(dayKey = getDayKey()) {
  return pickDailyShopThemes(dayKey, DAILY_SHOP_THEME_COUNT);
}

export function checkWeeklyTitleUnlocks(
  user: UserData,
  onUnlock?: (unlock: WeeklyTitleUnlock) => void,
): UserData {
  const weekKey = getWeekKey();
  const minutes = user.weeklyRecords?.[weekKey]?.focusMinutes ?? 0;
  const claimed = user.weeklyThresholdsClaimed?.[weekKey] ?? [];
  const offers = weeklyTitleOffers(weekKey);
  let next = user;
  const newClaims = [...claimed];
  const inventory = [...(user.weeklyTitleInventory ?? [])];
  const owned = new Set(user.ownedTitles);

  for (const offer of offers) {
    if (minutes < offer.threshold || newClaims.includes(offer.threshold)) continue;
    newClaims.push(offer.threshold);
    const unlock: WeeklyTitleUnlock = {
      id: offer.id,
      label: offer.label,
      threshold: offer.threshold,
      weekKey,
      unlockedAt: new Date().toISOString(),
    };
    inventory.push(unlock);
    owned.add(offer.id);
    onUnlock?.(unlock);
    const rec = next.weeklyRecords[weekKey];
    if (rec) {
      next = {
        ...next,
        weeklyRecords: {
          ...next.weeklyRecords,
          [weekKey]: {
            ...rec,
            titlesUnlockedThisWeek: [...rec.titlesUnlockedThisWeek, offer.id],
          },
        },
      };
    }
  }

  if (newClaims.length === claimed.length) return next;
  return {
    ...next,
    weeklyThresholdsClaimed: { ...(next.weeklyThresholdsClaimed ?? {}), [weekKey]: newClaims },
    weeklyTitleInventory: inventory,
    ownedTitles: Array.from(owned),
  };
}
