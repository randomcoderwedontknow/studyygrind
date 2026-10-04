import { themes } from "../data/themes";
import { economyMarketPrice } from "./economy-pricing";
import { todayKey } from "./dates";
import { SHOP_GAME_UNLOCKS, SHOP_TITLE_ITEMS } from "../data/shop-catalog";
import type { ThemeId } from "../types";

export type DailyDeal = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  dealPrice: number;
  discountPct: number;
  kind: "theme" | "unlock" | "title";
  themeId?: ThemeId;
  unlockKey?: string;
  dayKey: string;
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const THEME_IDS = Object.keys(themes) as ThemeId[];

function catalogBaseForPick(pick: Omit<DailyDeal, "dayKey" | "dealPrice" | "discountPct" | "basePrice"> & { basePrice: number }): number {
  if (pick.kind === "theme" && pick.themeId) return themes[pick.themeId].price;
  const game = SHOP_GAME_UNLOCKS.find((g) => g.unlockKey === pick.unlockKey || g.id === pick.id);
  if (game) return game.price;
  const title = SHOP_TITLE_ITEMS.find((t) => t.unlockKey === pick.unlockKey || t.id === pick.id);
  if (title) return title.price;
  return 1000;
}

function marketKeyForPick(pick: { kind: string; themeId?: ThemeId; unlockKey?: string; id: string }): string {
  if (pick.kind === "theme" && pick.themeId) return `theme-${pick.themeId}`;
  return pick.unlockKey ?? pick.id;
}

export function dailyDealForUser(email: string, date = new Date()): DailyDeal {
  const dayKey = todayKey(date);
  const seed = hashSeed(`${email}:${dayKey}`);
  const pool = [
    ...THEME_IDS.filter((id) => id !== "green").map((id) => ({
      id: `theme-${id}`,
      name: themes[id].name,
      description: "Theme deal — today's market minus extra discount",
      basePrice: 0,
      kind: "theme" as const,
      themeId: id,
    })),
    ...SHOP_GAME_UNLOCKS.slice(0, 6).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      basePrice: 0,
      kind: "unlock" as const,
      unlockKey: g.unlockKey,
    })),
    ...SHOP_TITLE_ITEMS.slice(0, 4).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      basePrice: 0,
      kind: "title" as const,
      unlockKey: t.unlockKey,
    })),
  ];
  const pick = pool[seed % pool.length];
  const discountPct = 20 + (seed % 21);
  const key = marketKeyForPick(pick);
  const catalog = catalogBaseForPick(pick);
  const market = economyMarketPrice(catalog, key, dayKey);
  const dealPrice = Math.max(50, Math.round(market * (1 - discountPct / 100)));
  return { ...pick, dayKey, discountPct, dealPrice, basePrice: market };
}
