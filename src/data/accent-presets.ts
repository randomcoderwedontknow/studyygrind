export type AccentPreset = { id: string; name: string; primary: string; primary2: string };

/** "Dynamic accent" tonal presets — a wallpaper-style palette since Material You extraction
 *  isn't available from the WebView. `theme` (follow equipped theme) and `auto` (time of day)
 *  are special ids handled in theme-engine. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "sage", name: "Sage", primary: "#6f9f7f", primary2: "#a9c8b1" },
  { id: "ocean", name: "Ocean", primary: "#3d8fc9", primary2: "#7cc4e6" },
  { id: "lavender", name: "Lavender", primary: "#8f7ad6", primary2: "#c3b4f0" },
  { id: "sunset", name: "Sunset", primary: "#e0805a", primary2: "#f2b58a" },
  { id: "sand", name: "Sand", primary: "#c2a06a", primary2: "#e2cba0" },
  { id: "rose", name: "Rose", primary: "#d47a92", primary2: "#f0b3c2" },
  { id: "slate", name: "Slate", primary: "#6b7a90", primary2: "#a3aebf" },
  { id: "mint", name: "Mint", primary: "#3fbf9f", primary2: "#8fe0c8" },
];

export const ACCENT_THEME_ID = "theme";
export const ACCENT_AUTO_ID = "auto";

export function accentPresetById(id: string): AccentPreset | undefined {
  return ACCENT_PRESETS.find((p) => p.id === id);
}

/** Time-of-day accent: warm at dawn/morning → neutral midday → cool evening/night. */
export function autoAccentForHour(hour: number): AccentPreset {
  if (hour >= 5 && hour < 9) return { id: "auto", name: "Auto · Dawn", primary: "#e08a5a", primary2: "#f4c08f" };
  if (hour >= 9 && hour < 13) return { id: "auto", name: "Auto · Morning", primary: "#d9a648", primary2: "#f1d58e" };
  if (hour >= 13 && hour < 17) return { id: "auto", name: "Auto · Afternoon", primary: "#4fae8a", primary2: "#9bd8bd" };
  if (hour >= 17 && hour < 21) return { id: "auto", name: "Auto · Evening", primary: "#5b7fd6", primary2: "#9db4ee" };
  return { id: "auto", name: "Auto · Night", primary: "#6c63c9", primary2: "#a49ce6" };
}

/** Resolve a preset id (including "auto") to concrete colours; undefined for "theme". */
export function resolveAccent(id: string, now = new Date()): AccentPreset | undefined {
  if (!id || id === ACCENT_THEME_ID) return undefined;
  if (id === ACCENT_AUTO_ID) return autoAccentForHour(now.getHours());
  return accentPresetById(id);
}
