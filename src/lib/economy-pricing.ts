import { applyDiscount, scalePrice } from "./pricing";
import { todayKey } from "./dates";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Daily market offset in [-50_000, +20_000] per item. */
function dailyOffset(itemKey: string, dayKey = todayKey()): number {
  const seed = hashSeed(`${dayKey}:${itemKey}`);
  const span = 70_001;
  const raw = seed % span;
  return raw - 50_000;
}

/** Scaled base + bounded daily swing (floor ~85% or -50k, ceiling +50k or +15%). */
function clampMarket(scaledBase: number, offset: number): number {
  const floor = Math.max(Math.round(scaledBase * 0.85), scaledBase - 50_000);
  const ceiling = Math.max(Math.round(scaledBase * 1.15), scaledBase + 50_000);
  return Math.min(ceiling, Math.max(floor, scaledBase + offset));
}

export function economyMarketPrice(base: number, itemKey: string, dayKey = todayKey()): number {
  if (base <= 0) return 0;
  const scaledBase = scalePrice(base);
  return clampMarket(scaledBase, dailyOffset(itemKey, dayKey));
}

/** When the charge is already a scaled/delta amount (themes). */
export function economyMarketPriceScaled(scaledBase: number, itemKey: string, dayKey = todayKey()): number {
  if (scaledBase <= 0) return 0;
  return clampMarket(scaledBase, dailyOffset(itemKey, dayKey));
}

export function economyShopPrice(base: number, itemKey: string, discountPct = 0, dayKey = todayKey()): number {
  return applyDiscount(economyMarketPrice(base, itemKey, dayKey), discountPct);
}

export function economyShopPriceScaled(scaledBase: number, itemKey: string, discountPct = 0, dayKey = todayKey()): number {
  return applyDiscount(economyMarketPriceScaled(scaledBase, itemKey, dayKey), discountPct);
}

export function economyPriceDelta(
  base: number,
  itemKey: string,
  dayKey = todayKey(),
): { market: number; scaledBase: number; delta: number } {
  const scaledBase = scalePrice(base);
  const market = economyMarketPrice(base, itemKey, dayKey);
  return { market, scaledBase, delta: market - scaledBase };
}
