import { rotatingThemeById } from "./pools/rotating-themes";
import { appearanceForSurface } from "../lib/theme-colors";
import type { CustomTheme, ThemeId, ThemeSurface } from "../types";

export type ThemeMeta = {
  name: string;
  price: number;
  color: string;
  color2?: string;
  gradient?: boolean;
  tier: "core" | "premium" | "vip" | "honour";
};

export const themes: Record<ThemeId, ThemeMeta> = {
  green: { name: "StudyGrind Green", price: 0, color: "#31be83", color2: "#163d2a", gradient: true, tier: "core" },
  midnight: { name: "Midnight Indigo", price: 700, color: "#5b6cf2", color2: "#312e81", gradient: true, tier: "core" },
  slate: { name: "Slate Steel", price: 800, color: "#64748b", color2: "#334155", gradient: true, tier: "core" },
  forest: { name: "Forest Sage", price: 900, color: "#4a8d6d", color2: "#163d2a", gradient: true, tier: "core" },
  lavender: { name: "Lavender Dream", price: 1_000, color: "#a583e0", color2: "#6d28d9", gradient: true, tier: "core" },
  rose: { name: "Rose Quartz", price: 1_000, color: "#e07a8a", color2: "#be185d", gradient: true, tier: "core" },
  ocean: { name: "Ocean Blue", price: 1_500, color: "#2d9ce2", color2: "#0ea5e9", gradient: true, tier: "premium" },
  sunset: { name: "Sunset Ember", price: 1_900, color: "#e08145", color2: "#ea580c", gradient: true, tier: "premium" },
  carbon: { name: "Carbon Black", price: 2_000, color: "#202733", tier: "premium" },
  coral: { name: "Coral Reef", price: 1_400, color: "#ff6b6b", color2: "#feca57", gradient: true, tier: "premium" },
  ember: { name: "Ember Glow", price: 1_600, color: "#ff512f", color2: "#dd2476", gradient: true, tier: "premium" },
  skyline: { name: "Skyline", price: 1_750, color: "#2193b0", color2: "#6dd5ed", gradient: true, tier: "premium" },
  plum: { name: "Plum Dusk", price: 1_800, color: "#667eea", color2: "#764ba2", gradient: true, tier: "premium" },
  mint: { name: "Mint Fresh", price: 950, color: "#56ab2f", color2: "#a8e063", gradient: true, tier: "core" },
  pink: { name: "Neon Pink", price: 2_700, color: "#e559b6", tier: "vip" },
  red: { name: "Focus Red", price: 2_700, color: "#d84a52", tier: "vip" },
  orange: { name: "Power Orange", price: 2_700, color: "#e58a2f", tier: "vip" },
  violet: { name: "Deep Violet", price: 2_700, color: "#7f63e5", tier: "vip" },
  crimson: { name: "Crimson Pulse", price: 2_850, color: "#eb3349", color2: "#f45c43", gradient: true, tier: "vip" },
  sand: { name: "Desert Sand", price: 2_200, color: "#c4a574", color2: "#e8dcc8", gradient: true, tier: "premium" },
  sandyGold: { name: "Sandy Gold", price: 3_200, color: "#d4a853", color2: "#f5e6b8", gradient: true, tier: "vip" },
  royal: { name: "Royal Gold", price: 3_600, color: "#d4a935", tier: "honour" },
  aurora: { name: "Aurora Mint", price: 3_600, color: "#3fd3be", tier: "honour" },
};

export const vipThemes: ThemeId[] = ["pink", "red", "orange", "violet", "crimson", "sandyGold"];
export const honoraryThemes: ThemeId[] = ["royal", "aurora"];

export function themeAppearance(
  id: string,
  customThemes: CustomTheme[],
  savedCustom?: { id: string; name: string; color: string; color2?: string; gradient?: boolean; liquidUi?: boolean }[],
  surface: ThemeSurface = "classic",
): { id: string; name: string; color: string; color2?: string; gradient?: boolean } {
  const built = themes[id as ThemeId];
  if (built) {
    const shifted = appearanceForSurface(built.color, built.color2, built.gradient, surface);
    return { id, name: built.name, ...shifted };
  }
  const rotating = rotatingThemeById(id);
  if (rotating) {
    const shifted = appearanceForSurface(rotating.color, rotating.color2, rotating.gradient, surface);
    return { id, name: rotating.name, ...shifted };
  }
  const ownerCustom = customThemes.find((t) => t.id === id);
  if (ownerCustom)
    return {
      id,
      name: ownerCustom.name,
      color: ownerCustom.color,
      color2: ownerCustom.color2,
      gradient: ownerCustom.gradient,
    };
  const userCustom = savedCustom?.find((t) => t.id === id);
  if (userCustom) {
    const useSurface = userCustom.liquidUi === false ? "classic" : surface;
    const shifted = appearanceForSurface(userCustom.color, userCustom.color2, userCustom.gradient, useSurface);
    return { id, name: userCustom.name, ...shifted };
  }
  return { id: "green", name: themes.green.name, color: themes.green.color };
}
