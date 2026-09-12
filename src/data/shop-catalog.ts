import type { Booster } from "../types";
import {
  COLOUR_MAKER_PRICE,
  CUSTOM_TITLE_UNLOCK_PRICE,
  FOCUS_LAB_PRICE,
  MENTOR_HUB_PRICE,
  UNLOCK_IDS,
} from "./constants";
import { PURCHASABLE_TITLES } from "./titles";

export type ShopCategory =
  | "hubs"
  | "themes"
  | "titles"
  | "games"
  | "analytics"
  | "effects"
  | "sounds"
  | "ui"
  | "qol"
  | "owner";

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  free?: boolean;
  ownerOnly?: boolean;
  unlockKey?: string;
};

export const SHOP_HUB_ITEMS: ShopItem[] = [
  {
    id: UNLOCK_IDS.mentorHub,
    name: "Mentor Hub",
    description: "Pin mentorship messages and submit community challenges.",
    price: MENTOR_HUB_PRICE,
    category: "hubs",
    unlockKey: UNLOCK_IDS.mentorHub,
  },
  {
    id: UNLOCK_IDS.focusLab,
    name: "Focus Lab",
    description: "Stats, streaks, daily missions, and focus experiments.",
    price: FOCUS_LAB_PRICE,
    category: "hubs",
    unlockKey: UNLOCK_IDS.focusLab,
  },
  {
    id: UNLOCK_IDS.colourMaker,
    name: "Colour & Gradient Studio",
    description: "Create custom themes with live preview across the app.",
    price: COLOUR_MAKER_PRICE,
    category: "hubs",
    unlockKey: UNLOCK_IDS.colourMaker,
  },
];

export const SHOP_TITLE_ITEMS: ShopItem[] = [
  ...PURCHASABLE_TITLES.map((t) => ({
    id: `title-${t.id}`,
    name: t.label,
    description: t.description,
    price: t.price,
    category: "titles" as ShopCategory,
    unlockKey: `title-${t.id}`,
  })),
  {
    id: UNLOCK_IDS.customName,
    name: "Custom Name",
    description: "Set your own display title (max 32 chars).",
    price: CUSTOM_TITLE_UNLOCK_PRICE,
    category: "titles",
    unlockKey: UNLOCK_IDS.customName,
  },
];

export const SHOP_GAME_UNLOCKS: ShopItem[] = [
  { id: "game-memory-sprint", name: "Memory Sprint", description: "Simon-style sequence game.", price: 600, category: "games", unlockKey: "memory-sprint" },
  { id: "game-logic-burst", name: "Logic Burst", description: "True/false trivia.", price: 600, category: "games", unlockKey: "logic-burst" },
  { id: "game-pattern-rush", name: "Pattern Rush", description: "5-tone pattern repeats.", price: 600, category: "games", unlockKey: "pattern-rush" },
  { id: "game-micro-chess", name: "Micro Chess", description: "Tiny tactic picks.", price: 600, category: "games", unlockKey: "micro-chess" },
  { id: "game-focus-dodge", name: "Focus Dodge", description: "Dodge distractions.", price: 1_000, category: "games", unlockKey: "focus-dodge" },
  { id: "game-pattern-repeat", name: "Pattern Repeat", description: "Repeat the pattern.", price: 750, category: "games", unlockKey: "pattern-repeat" },
  { id: "game-typing-burst", name: "Typing Burst", description: "Type fast for points.", price: 1_300, category: "games", unlockKey: "typing-burst" },
  { id: "game-coin-catcher", name: "Coin Catcher", description: "Catch falling coins.", price: 1_500, category: "games", unlockKey: "coin-catcher" },
  { id: "game-timer-rush", name: "Timer Rush", description: "Stop closest to target.", price: 2_000, category: "games", unlockKey: "timer-rush" },
];

export const SHOP_FREE_QOL: ShopItem[] = [
  { id: "qol-export-notes", name: "Export Notes", description: "Download notes as JSON.", price: 0, category: "qol", free: true },
  { id: "qol-compact-tasks", name: "Compact Task View", description: "Denser task cards.", price: 0, category: "qol", free: true },
  { id: "qol-extra-preset", name: "Extra Timer Preset", description: "Save a fourth timer preset.", price: 0, category: "qol", free: true },
];

export const SHOP_ANALYTICS_UPGRADES: ShopItem[] = [
  { id: "analytics-heatmap", name: "Focus Heatmap", description: "Hour-of-day focus chart.", price: 1_100, category: "analytics", unlockKey: "analytics-heatmap" },
  { id: "analytics-extended", name: "Extended History", description: "30-day analytics view.", price: 1_500, category: "analytics", unlockKey: "analytics-extended" },
];

export const SHOP_EFFECTS: ShopItem[] = [
  { id: "effect-particles", name: "Particle Trail", description: "Subtle motion on home.", price: 900, category: "effects", unlockKey: "effect-particles" },
  { id: "effect-glow-buttons", name: "Glow Buttons", description: "Premium button glow.", price: 700, category: "effects", unlockKey: "effect-glow-buttons" },
  { id: "effect-ring-pulse", name: "Timer Ring Pulse", description: "Enhanced timer ring.", price: 800, category: "effects", unlockKey: "effect-ring-pulse" },
];

export const SHOP_SOUNDS: ShopItem[] = [
  { id: "sound-complete-chime", name: "Soft Bell", description: "Gentle session end chime.", price: 500, category: "sounds", unlockKey: "sound-complete-chime" },
  { id: "sound-deep-gong", name: "Deep Gong", description: "Low resonant finish.", price: 600, category: "sounds", unlockKey: "sound-deep-gong" },
  { id: "sound-digital-beep", name: "Digital Beep", description: "Crisp digital alert.", price: 500, category: "sounds", unlockKey: "sound-digital-beep" },
  { id: "sound-success-arpeggio", name: "Success Arpeggio", description: "Upward celebratory tones.", price: 700, category: "sounds", unlockKey: "sound-success-arpeggio" },
  { id: "sound-zen-bowl", name: "Zen Bowl", description: "Calm singing bowl.", price: 800, category: "sounds", unlockKey: "sound-zen-bowl" },
  { id: "sound-arcade", name: "Arcade", description: "Retro level-complete.", price: 650, category: "sounds", unlockKey: "sound-arcade" },
  { id: "sound-minimal-tick", name: "Minimal Tick", description: "Subtle finish tick.", price: 400, category: "sounds", unlockKey: "sound-minimal-tick" },
];

export const SHOP_UI: ShopItem[] = [
  { id: "ui-card-shine", name: "Card Shine", description: "Shimmer on shop cards.", price: 650, category: "ui", unlockKey: "ui-card-shine" },
  { id: "ui-banner-animated", name: "Animated Banners", description: "Home banner motion.", price: 750, category: "ui", unlockKey: "ui-banner-animated" },
];

export const SHOP_OWNER_FUN: ShopItem[] = [
  { id: "owner-badge-glow", name: "Owner Badge Glow", description: "Legendary owner flair.", price: 0, category: "owner", ownerOnly: true, free: true },
  { id: "owner-theme-void", name: "Void Theme", description: "Owner-only dark theme.", price: 0, category: "owner", ownerOnly: true, free: true, unlockKey: "owner-theme-void" },
  { id: "owner-title-legend", name: "Legend Title", description: "Owner display title.", price: 0, category: "owner", ownerOnly: true, free: true, unlockKey: "owner-title-legend" },
];

export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...SHOP_HUB_ITEMS,
  ...SHOP_TITLE_ITEMS,
  ...SHOP_GAME_UNLOCKS,
  ...SHOP_FREE_QOL,
  ...SHOP_ANALYTICS_UPGRADES,
  ...SHOP_EFFECTS,
  ...SHOP_SOUNDS,
  ...SHOP_UI,
  ...SHOP_OWNER_FUN,
];

export const boosters: Booster[] = [
  { id: "shield", name: "Streak Shield", description: "Adds +1 streak shield to protect a missed day.", price: 1_000, effect: "shield" },
  { id: "boost12", name: "Energy Jolt 12h", description: "Multiplies shop/game points by 1.5x for 12 hours (not timer).", price: 1_800, effect: "boost12" },
  { id: "boost24", name: "Focus Doubler 24h", description: "Multiplies shop/game points by 2x for 24 hours (not timer).", price: 3_800, effect: "boost24" },
  { id: "discount20", name: "Shopkeeper's Coupon", description: "20% off your next shop purchase.", price: 900, effect: "discount20" },
  { id: "gameUnlock", name: "Mini-Game Token", description: "Unlocks one random locked mini-game.", price: 1_500, effect: "gameUnlock" },
  { id: "lootbox", name: "Mystery Box", description: "Random reward: points, discount, theme, or shield.", price: 2_500, effect: "lootbox" },
  { id: "noteKit", name: "Notebook Starter", description: "Adds 5 productive starter notes.", price: 500, effect: "noteKit" },
];

export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = {
  hubs: "Hubs & Pages",
  themes: "Themes & Colours",
  titles: "Display Titles",
  games: "Break Activities",
  analytics: "Analytics Upgrades",
  effects: "Focus Effects",
  sounds: "Timer Sounds",
  ui: "UI Effects",
  qol: "Free QoL",
  owner: "Owner Fun",
};
