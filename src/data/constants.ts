export const STORE_KEY = "studygrind_v2";
export const DATA_VERSION = 14;
export const APP_RELEASE_VERSION = "12.3.0";
/** When false, beta entry UI is hidden and store beta flag is forced off on migrate. */
export const BETA_PROGRAM_PUBLIC = false;
/** Multiplier applied to shop/theme/unlock base prices (12.2.6 economy). */
export const PRICE_SCALE = 3.5;
/** Liquid UI theme variant costs this much more than classic (on scaled classic price). */
export const LIQUID_THEME_PREMIUM_RATIO = 1.35;
export const STUDY_DAY_FIRE_MINUTES = 30;
export const WEEKLY_TITLE_THRESHOLDS = [60, 180, 300, 600, 1200] as const;
export const DAILY_SHOP_THEME_COUNT = 10;
export const SESSION_LOG_CAP = 200;
export const SESSION_LOG_CAP_EXTENDED = 500;
export const COMBO_THRESHOLDS = [
  { days: 3, mult: 1.5 },
  { days: 5, mult: 1.75 },
  { days: 7, mult: 2 },
] as const;
export const OWNER_EMAIL = "abdullahahmed";
export const OWNER_PASS = "owner";
export const GAME_POINTS_DAILY_CAP = 350;
export const POINTS_PER_FOCUS_SECOND = 1;
export const MENTOR_HUB_PRICE = 25_000;
export const CUSTOM_TITLE_UNLOCK_PRICE = 75_000;
export const FOCUS_LAB_PRICE = 50_000;
export const PRESET_LAB_PRICE = 50_000;
export const COLOUR_MAKER_PRICE = 40_000;
export const MEMORY_SPRINT_ID = "memory-sprint";
export const LOGIC_BURST_ID = "logic-burst";
export const PATTERN_RUSH_ID = "pattern-rush";
export const MICRO_CHESS_ID = "micro-chess";

export const STUDYGRIND_APK_DOWNLOAD_URL = "https://github.com/randomcoderwedontknow/studyygrind/releases/tag/studygrind";

export const UNLOCK_IDS = {
  mentorHub: "mentor-hub",
  customName: "custom-name",
  focusLab: "focus-lab",
  presetLab: "preset-lab",
  colourMaker: "colour-maker",
} as const;
