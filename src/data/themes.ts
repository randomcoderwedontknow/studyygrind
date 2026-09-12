import { rotatingThemeById } from "./pools/rotating-themes";
import type { CustomTheme, ThemeId } from "../types";

export type ThemeMeta = {
  name: string;
  price: number;
  color: string;
  color2?: string;
  gradient?: boolean;
  tier: "core" | "premium" | "vip" | "honour";
};

export const themes: Record<ThemeId, ThemeMeta> = {
  green: { name: "StudyGrind Green", price: 0, color: "#31be83", tier: "core" },
  midnight: { name: "Midnight Indigo", price: 700, color: "#5b6cf2", tier: "core" },
  slate: { name: "Slate Steel", price: 800, color: "#64748b", tier: "core" },
  forest: { name: "Forest Sage", price: 900, color: "#4a8d6d", tier: "core" },
  lavender: { name: "Lavender Dream", price: 1_000, color: "#a583e0", tier: "core" },
  rose: { name: "Rose Quartz", price: 1_000, color: "#e07a8a", tier: "core" },
  ocean: { name: "Ocean Blue", price: 1_500, color: "#2d9ce2", tier: "premium" },
  sunset: { name: "Sunset Ember", price: 1_900, color: "#e08145", tier: "premium" },
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
  gold: { name: "Golden Hour", price: 3_000, color: "#f7971e", color2: "#ffd200", gradient: true, tier: "vip" },
  royal: { name: "Royal Gold", price: 3_600, color: "#d4a935", tier: "honour" },
  aurora: { name: "Aurora Mint", price: 3_600, color: "#3fd3be", tier: "honour" },
};

export const vipThemes: ThemeId[] = ["pink", "red", "orange", "violet", "crimson", "gold"];
export const honoraryThemes: ThemeId[] = ["royal", "aurora"];

export function themeAppearance(
  id: string,
  customThemes: CustomTheme[],
  savedCustom?: { id: string; name: string; color: string; color2?: string; gradient?: boolean }[],
): { id: string; name: string; color: string; color2?: string; gradient?: boolean } {
  const built = themes[id as ThemeId];
  if (built) return { id, name: built.name, color: built.color, color2: built.color2, gradient: built.gradient };
  const rotating = rotatingThemeById(id);
  if (rotating)
    return {
      id,
      name: rotating.name,
      color: rotating.color,
      color2: rotating.color2,
      gradient: rotating.gradient,
    };
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
  if (userCustom) return { id, name: userCustom.name, color: userCustom.color, color2: userCustom.color2, gradient: userCustom.gradient };
  return { id: "green", name: themes.green.name, color: themes.green.color };
}
