import { themes } from "../data/themes";
import { scalePrice } from "./pricing";
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

export function dailyDealForUser(email: string, date = new Date()): DailyDeal {
  const dayKey = todayKey(date);
  const seed = hashSeed(`${email}:${dayKey}`);
  const pool: Omit<DailyDeal, "dayKey" | "dealPrice" | "discountPct">[] = [
    ...THEME_IDS.filter((id) => id !== "green").map((id) => ({
      id: `theme-${id}`,
      name: themes[id].name,
      description: "Normal + Liquid UI theme bundle",
      basePrice: scalePrice(themes[id].price),
      kind: "theme" as const,
      themeId: id,
    })),
    ...SHOP_GAME_UNLOCKS.slice(0, 6).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      basePrice: scalePrice(g.price),
      kind: "unlock" as const,
      unlockKey: g.unlockKey,
    })),
    ...SHOP_TITLE_ITEMS.slice(0, 4).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      basePrice: scalePrice(t.price),
      kind: "title" as const,
      unlockKey: t.unlockKey,
    })),
  ];
  const pick = pool[seed % pool.length];
  const discountPct = 20 + (seed % 21);
  const dealPrice = Math.max(50, Math.round(pick.basePrice * (1 - discountPct / 100)));
  return { ...pick, dayKey, discountPct, dealPrice };
}
