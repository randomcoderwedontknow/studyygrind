import { ALL_SHOP_ITEMS } from "../data/shop-catalog";
import { UNLOCK_IDS } from "../data/constants";
import { themes } from "../data/themes";
import { PURCHASABLE_TITLES } from "../data/titles";
import type { TrophyReward } from "../data/trophies";
import type { ThemeId, UserData } from "../types";
import { TIMER_END_SOUNDS } from "./timer-audio";

export const TROPHY_CREDIT_MAX_PRICE = 5_000;

const CREDIT_EXCLUDED = new Set<string>([
  UNLOCK_IDS.mentorHub,
  UNLOCK_IDS.focusLab,
  UNLOCK_IDS.colourMaker,
  UNLOCK_IDS.customName,
]);

const GAME_UNLOCK_KEYS = [
  "memory-sprint",
  "logic-burst",
  "pattern-rush",
  "micro-chess",
  "focus-dodge",
  "pattern-repeat",
  "typing-burst",
  "coin-catcher",
  "timer-rush",
];

export function trophyRewardLabel(reward: TrophyReward): string {
  if (reward.label) return reward.label;
  switch (reward.kind) {
    case "points":
      return `+${reward.amount.toLocaleString()} focus points`;
    case "shield":
      return `+${reward.amount} streak shield${reward.amount === 1 ? "" : "s"}`;
    case "discount":
      return `${reward.percent}% off next purchase`;
    case "freeTitle":
      return "Free title!";
    case "freeShopItem":
      return "1 free shop item!";
    case "freeTheme":
      return "Free theme!";
    case "freeSound":
      return "Free timer sound!";
    case "freeGame":
      return "Free mini-game!";
  }
}

export function canRedeemTrophyCredit(item: {
  price: number;
  unlockKey?: string;
  free?: boolean;
  ownerOnly?: boolean;
}): boolean {
  if (item.free || item.ownerOnly) return false;
  if (item.unlockKey && CREDIT_EXCLUDED.has(item.unlockKey)) return false;
  return item.price <= TROPHY_CREDIT_MAX_PRICE;
}

export function canRedeemTrophyCreditForTheme(themeId: ThemeId): boolean {
  const meta = themes[themeId];
  if (!meta || meta.price <= 0) return false;
  if (meta.tier === "vip" || meta.tier === "honour") return false;
  return meta.price <= TROPHY_CREDIT_MAX_PRICE;
}

export function canRedeemTrophyCreditForTitle(_titleId: string, price: number): boolean {
  return price <= TROPHY_CREDIT_MAX_PRICE;
}

export function applyTrophyReward(user: UserData, reward: TrophyReward): { user: UserData; granted: string } {
  switch (reward.kind) {
    case "points": {
      const granted = trophyRewardLabel(reward);
      return {
        user: {
          ...user,
          focusPoints: user.focusPoints + reward.amount,
          totalPointsEarned: user.totalPointsEarned + reward.amount,
        },
        granted,
      };
    }
    case "shield": {
      return {
        user: { ...user, streakShields: user.streakShields + reward.amount },
        granted: trophyRewardLabel(reward),
      };
    }
    case "discount": {
      return {
        user: { ...user, discount: Math.max(user.discount, reward.percent) },
        granted: trophyRewardLabel(reward),
      };
    }
    case "freeShopItem": {
      return {
        user: { ...user, trophyShopCredits: (user.trophyShopCredits ?? 0) + 1 },
        granted: trophyRewardLabel(reward),
      };
    }
    case "freeTitle": {
      const locked = PURCHASABLE_TITLES.filter((t) => !user.ownedTitles.includes(t.id));
      if (!locked.length) {
        return applyTrophyReward(user, { kind: "points", amount: 1_000, label: "+1,000 focus points" });
      }
      const pick = locked[Math.floor(Math.random() * locked.length)];
      const key = `title-${pick.id}`;
      return {
        user: {
          ...user,
          ownedTitles: [...user.ownedTitles, pick.id],
          unlocks: { ...user.unlocks, [key]: true },
        },
        granted: `Free title: ${pick.label}!`,
      };
    }
    case "freeTheme": {
      const locked = (Object.keys(themes) as ThemeId[]).filter(
        (id) => id !== "green" && !user.ownedThemes.includes(id) && themes[id].price > 0 && themes[id].tier === "core",
      );
      if (!locked.length) {
        const premium = (Object.keys(themes) as ThemeId[]).filter(
          (id) => !user.ownedThemes.includes(id) && themes[id].price > 0 && themes[id].tier === "premium",
        );
        if (!premium.length) {
          return applyTrophyReward(user, { kind: "points", amount: 800, label: "+800 focus points" });
        }
        const pick = premium[Math.floor(Math.random() * premium.length)];
        return {
          user: { ...user, ownedThemes: [...user.ownedThemes, pick] },
          granted: `Free theme: ${themes[pick].name}!`,
        };
      }
      const pick = locked[Math.floor(Math.random() * locked.length)];
      return {
        user: { ...user, ownedThemes: [...user.ownedThemes, pick] },
        granted: `Free theme: ${themes[pick].name}!`,
      };
    }
    case "freeSound": {
      const locked = TIMER_END_SOUNDS.filter((s) => s.shopKey && !user.unlocks[s.shopKey]);
      if (!locked.length) {
        return applyTrophyReward(user, { kind: "points", amount: 500, label: "+500 focus points" });
      }
      const pick = locked[Math.floor(Math.random() * locked.length)]!;
      return {
        user: { ...user, unlocks: { ...user.unlocks, [pick.shopKey!]: true } },
        granted: `Free sound: ${pick.label}!`,
      };
    }
    case "freeGame": {
      const locked = GAME_UNLOCK_KEYS.filter((g) => !user.gamesUnlocked.includes(g));
      if (!locked.length) {
        return applyTrophyReward(user, { kind: "points", amount: 600, label: "+600 focus points" });
      }
      const pick = locked[Math.floor(Math.random() * locked.length)];
      return {
        user: {
          ...user,
          gamesUnlocked: [...user.gamesUnlocked, pick],
          unlocks: { ...user.unlocks, [pick]: true, [`game-${pick}`]: true },
        },
        granted: "Free mini-game unlocked!",
      };
    }
  }
}

/** Shop items eligible for trophy credit redemption (for UI hints). */
export function trophyCreditEligibleCount(user: UserData): number {
  return ALL_SHOP_ITEMS.filter(
    (item) => !item.free && !item.ownerOnly && canRedeemTrophyCredit(item) && item.unlockKey && !user.unlocks[item.unlockKey],
  ).length;
}
