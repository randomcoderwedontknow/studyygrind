import type { CustomTheme, SavedCustomTheme } from "../types";
import { themeAppearance } from "../data/themes";
import { resolveAccent } from "../data/accent-presets";

export type AppliedAppearance = { color: string; color2?: string; gradient: boolean };

/**
 * Applies the equipped theme to <body>, then (if `accentPreset` is not "theme")
 * overrides --primary / --primary-2 / --accent-fill with the dynamic accent.
 * Returns the effective primary colour so callers can sync theme-color / status bar.
 */
export function applyThemeToDocument(
  themeId: string,
  customThemes: CustomTheme[],
  savedCustom?: SavedCustomTheme[],
  accentPreset = "theme",
): AppliedAppearance {
  const t = themeAppearance(themeId, customThemes, savedCustom);
  document.body.style.setProperty("--primary", t.color);
  if (t.color2) {
    document.body.style.setProperty("--primary-2", t.color2);
  } else {
    document.body.style.removeProperty("--primary-2");
  }

  const hasGradient = Boolean(t.gradient && t.color2);
  if (hasGradient) {
    const grad = `linear-gradient(135deg, ${t.color}, ${t.color2})`;
    document.body.style.setProperty("--theme-gradient", grad);
    document.body.style.setProperty("--theme-header-bg", grad);
    document.body.style.setProperty(
      "--accent-fill",
      grad,
    );
    document.body.dataset.gradient = "true";
    document.body.style.background = `linear-gradient(165deg, color-mix(in srgb, ${t.color} 14%, var(--bg)), color-mix(in srgb, ${t.color2!} 14%, var(--bg)))`;
  } else {
    document.body.style.removeProperty("--theme-gradient");
    document.body.style.removeProperty("--theme-header-bg");
    document.body.style.removeProperty("--accent-fill");
    document.body.dataset.gradient = "false";
    document.body.style.background = "";
  }

  const accent = resolveAccent(accentPreset);
  if (accent) {
    document.body.style.setProperty("--primary", accent.primary);
    document.body.style.setProperty("--primary-2", accent.primary2);
    const grad = `linear-gradient(135deg, ${accent.primary}, ${accent.primary2})`;
    document.body.style.setProperty("--accent-fill", grad);
    document.body.style.setProperty("--theme-gradient", grad);
    document.body.dataset.accent = accent.id;
    return { color: accent.primary, color2: accent.primary2, gradient: true };
  }
  delete document.body.dataset.accent;
  return { color: t.color, color2: t.color2, gradient: hasGradient };
}
