import { seededPick } from "./generators";

export type RotatingThemeTier = "common" | "rare" | "epic";

export type RotatingTheme = {
  id: string;
  name: string;
  color: string;
  color2?: string;
  gradient?: boolean;
  tier: RotatingThemeTier;
  price: number;
  style: "solid" | "gradient" | "neon" | "calm" | "dark";
};

const HUES = [
  "#31be83", "#0ea5e9", "#8b5cf6", "#ec4899", "#f97316", "#ef4444", "#14b8a6", "#6366f1",
  "#22c55e", "#06b6d4", "#a855f7", "#f43f5e", "#eab308", "#64748b", "#1e293b", "#0f766e",
];

const NAMES = [
  "Focus Mint", "Deep Ocean", "Neon Pulse", "Calm Slate", "Midnight Lock", "Sunrise Grind",
  "Violet Flow", "Coral Spark", "Forest Quiet", "Royal Study", "Aurora Drift", "Carbon Focus",
  "Ember Drive", "Skyline Calm", "Plum Night", "Crimson Push", "Gold Hour", "Teal Discipline",
];

function buildRotatingThemes(): RotatingTheme[] {
  const out: RotatingTheme[] = [];
  for (let i = 0; i < 100; i++) {
    const h1 = HUES[i % HUES.length];
    const h2 = HUES[(i + 5) % HUES.length];
    const gradient = i % 3 === 0;
    const tier: RotatingThemeTier = i % 11 === 0 ? "epic" : i % 4 === 0 ? "rare" : "common";
    const price = tier === "epic" ? 1200 : tier === "rare" ? 650 : 350;
    const style =
      i % 5 === 0 ? "neon" : i % 5 === 1 ? "dark" : i % 5 === 2 ? "calm" : gradient ? "gradient" : "solid";
    out.push({
      id: `rot-${String(i + 1).padStart(3, "0")}`,
      name: `${NAMES[i % NAMES.length]} ${i + 1}`,
      color: h1,
      color2: gradient ? h2 : undefined,
      gradient,
      tier,
      price,
      style,
    });
  }
  return out;
}

export const ROTATING_THEMES = buildRotatingThemes();

export function pickDailyShopThemes(dayKey: string, count: number): RotatingTheme[] {
  return seededPick(ROTATING_THEMES, `daily-themes-${dayKey}`, count);
}

export function rotatingThemeById(id: string): RotatingTheme | undefined {
  return ROTATING_THEMES.find((t) => t.id === id);
}
