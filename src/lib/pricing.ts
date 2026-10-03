import { LIQUID_THEME_PREMIUM_RATIO, PRICE_SCALE } from "../data/constants";

/** Shop display and purchase price after economy scale. */
export function scalePrice(base: number): number {
  if (base <= 0) return 0;
  return Math.round(base * PRICE_SCALE);
}

export function themeClassicPrice(base: number): number {
  return scalePrice(base);
}

export function themeLiquidPrice(base: number): number {
  const classic = scalePrice(base);
  if (classic <= 0) return 0;
  return Math.round(classic * LIQUID_THEME_PREMIUM_RATIO);
}

export function applyDiscount(price: number, discountPct: number): number {
  return Math.max(0, price - Math.floor((price * discountPct) / 100));
}

/** Price shown in shop UI (scaled + discount). */
export function shopDisplayPrice(base: number, discountPct = 0): number {
  return applyDiscount(scalePrice(base), discountPct);
}

export function themeSurfaceDelta(base: number): number {
  return Math.max(0, themeLiquidPrice(base) - themeClassicPrice(base));
}

/** Points to buy a theme surface (full or upgrade delta). */
export function themePurchasePrice(
  base: number,
  surface: "classic" | "liquid",
  hasClassic: boolean,
  hasLiquid: boolean,
): number {
  const classic = themeClassicPrice(base);
  const liquid = themeLiquidPrice(base);
  if (base <= 0) return 0;
  const delta = Math.max(0, liquid - classic);
  if (surface === "classic") {
    if (hasClassic) return 0;
    if (hasLiquid) return delta;
    return classic;
  }
  if (hasLiquid) return 0;
  if (hasClassic) return delta;
  return liquid;
}
