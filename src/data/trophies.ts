import { STUDY_RANKS, studyRankFromUser } from "./ranks";
import type { UserData } from "../types";

export type TrophyTier = "bronze" | "silver" | "gold" | "platinum" | "legend";

export type TrophyCategory =
  | "focusPoints"
  | "studyMinutes"
  | "streak"
  | "sessions"
  | "tasks"
  | "flashcards"
  | "games"
  | "weekly"
  | "rank"
  | "shop"
  | "social"
  | "unique";

export type TrophyProgress = { current: number; target: number };

export type TrophyReward =
  | { kind: "points"; amount: number; label?: string }
  | { kind: "freeTitle"; label?: string }
  | { kind: "freeShopItem"; label?: string }
  | { kind: "shield"; amount: number; label?: string }
  | { kind: "discount"; percent: number; label?: string }
  | { kind: "freeTheme"; label?: string }
  | { kind: "freeSound"; label?: string }
  | { kind: "freeGame"; label?: string };

export type TrophyDef = {
  id: string;
  name: string;
  description: string;
  category: TrophyCategory;
  tier: TrophyTier;
  hidden?: boolean;
  reward?: TrophyReward;
  check: (user: UserData) => boolean;
  progress?: (user: UserData) => TrophyProgress;
};

/** Map threshold position (0..n-1) to a tier based on magnitude. */
function tierFromIndex(index: number, total: number): TrophyTier {
  if (total <= 1) return "bronze";
  const ratio = index / (total - 1);
  if (ratio < 0.2) return "bronze";
  if (ratio < 0.4) return "silver";
  if (ratio < 0.6) return "gold";
  if (ratio < 0.8) return "platinum";
  return "legend";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

/** Assign a bonus reward to milestone trophies (not every bronze step). */
function pickTrophyReward(
  category: TrophyCategory,
  tier: TrophyTier,
  index: number,
  total: number,
): TrophyReward | undefined {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (isFirst) {
    return { kind: "points", amount: 100, label: "+100 focus points" };
  }

  switch (tier) {
    case "bronze":
      return undefined;
    case "silver":
      if (category === "streak") {
        return { kind: "shield", amount: 1, label: "+1 streak shield" };
      }
      return { kind: "points", amount: 250, label: "+250 focus points" };
    case "gold":
      if (["rank", "weekly", "social"].includes(category)) {
        return { kind: "freeTitle", label: "Free title!" };
      }
      if (["focusPoints", "studyMinutes", "sessions", "tasks"].includes(category)) {
        return { kind: "freeTheme", label: "Free theme!" };
      }
      if (category === "games") {
        return { kind: "freeGame", label: "Free mini-game!" };
      }
      if (category === "flashcards") {
        return { kind: "freeSound", label: "Free timer sound!" };
      }
      if (category === "shop") {
        return { kind: "discount", percent: 15, label: "15% off next purchase" };
      }
      return { kind: "points", amount: 750, label: "+750 focus points" };
    case "platinum":
      return { kind: "freeShopItem", label: "1 free shop item!" };
    case "legend":
      if (isLast && category === "focusPoints") {
        return { kind: "points", amount: 5_000, label: "+5,000 focus points" };
      }
      if (isLast) {
        return { kind: "freeShopItem", label: "1 free shop item!" };
      }
      return { kind: "freeTitle", label: "Free title!" };
  }
}

function thresholdTrophies(
  category: TrophyCategory,
  slug: string,
  thresholds: readonly number[],
  getValue: (user: UserData) => number,
  name: (target: number) => string,
  description: (target: number) => string,
): TrophyDef[] {
  return thresholds.map((target, index) => {
    const tier = tierFromIndex(index, thresholds.length);
    return {
      id: `${slug}-${target}`,
      name: name(target),
      description: description(target),
      category,
      tier,
      reward: pickTrophyReward(category, tier, index, thresholds.length),
      check: (user) => getValue(user) >= target,
      progress: (user) => ({ current: Math.min(getValue(user), target), target }),
    };
  });
}

function shopPurchaseCount(user: UserData): number {
  const unlocks = Object.values(user.unlocks).filter(Boolean).length;
  const themes = Math.max(0, user.ownedThemes.length - 1);
  const titles = Math.max(0, user.ownedTitles.length - 1);
  const custom = user.ownedCustomThemes.length + user.savedCustomThemes.length;
  const rotating = user.ownedRotatingThemeIds.length;
  const games = user.gamesUnlocked.length;
  return unlocks + themes + titles + custom + rotating + games;
}

function totalGamePlays(user: UserData): number {
  return Object.values(user.miniGameStats).reduce((sum, g) => sum + (g.plays ?? 0), 0);
}

function bestGameScore(user: UserData): number {
  return Object.values(user.miniGameStats).reduce((best, g) => Math.max(best, g.bestScore ?? 0), 0);
}

function sessionHours(user: UserData): Set<number> {
  return new Set(user.sessionLog.map((s) => s.hour));
}

function hasSessionAtHour(user: UserData, hours: number[]): boolean {
  const seen = sessionHours(user);
  return hours.some((h) => seen.has(h));
}

function maxSessionPoints(user: UserData): number {
  return user.sessionLog.reduce((max, s) => Math.max(max, s.pointsEarned ?? 0), 0);
}

const FOCUS_POINT_THRESHOLDS = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000] as const;
const STUDY_MINUTE_THRESHOLDS = [30, 60, 100, 150, 200, 300, 600, 900, 1_200, 1_800, 2_500, 5_000, 7_500, 10_000] as const;
const STREAK_THRESHOLDS = [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 100, 180, 365] as const;
const LOGIN_STREAK_THRESHOLDS = [2, 3, 7, 14, 30, 60, 100, 200, 365] as const;
const SESSION_THRESHOLDS = [1, 3, 5, 10, 25, 50, 75, 100, 200, 350, 500, 750, 1_000] as const;
const TASK_THRESHOLDS = [1, 3, 5, 10, 25, 50, 75, 100, 200, 350, 500] as const;
const FLASHCARD_REVIEW_THRESHOLDS = [10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000] as const;
const FLASHCARD_DECK_THRESHOLDS = [1, 2, 3, 5, 10, 15, 25] as const;
const FLASHCARD_SESSION_THRESHOLDS = [1, 5, 10, 25, 50, 100, 250] as const;
const GAME_PLAY_THRESHOLDS = [5, 10, 25, 50, 100, 250, 500, 1_000] as const;
const GAME_SCORE_THRESHOLDS = [50, 100, 250, 500, 1_000, 2_500, 5_000] as const;
const WEEKLY_TITLE_THRESHOLDS = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50] as const;
const SHOP_PURCHASE_THRESHOLDS = [1, 2, 3, 5, 8, 10, 15, 20, 30] as const;
const FRIEND_THRESHOLDS = [1, 2, 3, 5, 8, 10, 15, 25] as const;
const FOCUS_LAB_MISSION_THRESHOLDS = [1, 5, 10, 25, 50, 100] as const;
const NOTE_COUNT_THRESHOLDS = [1, 3, 5, 10, 25, 50] as const;
const DECK_CARD_THRESHOLDS = [5, 10, 25, 50, 100, 250] as const;

const focusPointTrophies = thresholdTrophies(
  "focusPoints",
  "focus-points",
  FOCUS_POINT_THRESHOLDS,
  (u) => u.focusPoints,
  (t) => `${fmt(t)} Focus Points`,
  (t) => `Accumulate ${fmt(t)} focus points.`,
);

const studyMinuteTrophies = thresholdTrophies(
  "studyMinutes",
  "study-minutes",
  STUDY_MINUTE_THRESHOLDS,
  (u) => u.totalStudyMinutes,
  (t) => `${fmt(t)} Study Minutes`,
  (t) => `Log ${fmt(t)} total study minutes.`,
);

const streakTrophies = thresholdTrophies(
  "streak",
  "study-streak",
  STREAK_THRESHOLDS,
  (u) => u.streak,
  (t) => `${t}-Day Study Streak`,
  (t) => `Study on ${t} consecutive days.`,
);

const loginStreakTrophies = thresholdTrophies(
  "streak",
  "login-streak",
  LOGIN_STREAK_THRESHOLDS,
  (u) => u.loginStreak,
  (t) => `${t}-Day Login Streak`,
  (t) => `Open the app on ${t} consecutive days.`,
);

const sessionTrophies = thresholdTrophies(
  "sessions",
  "sessions",
  SESSION_THRESHOLDS,
  (u) => u.sessionsCompleted,
  (t) => (t === 1 ? "First Session" : `${fmt(t)} Sessions`),
  (t) => (t === 1 ? "Complete your first focus session." : `Complete ${fmt(t)} focus sessions.`),
);

const taskTrophies = thresholdTrophies(
  "tasks",
  "tasks",
  TASK_THRESHOLDS,
  (u) => u.tasksCompleted,
  (t) => (t === 1 ? "First Task Done" : `${fmt(t)} Tasks`),
  (t) => (t === 1 ? "Mark your first task complete." : `Complete ${fmt(t)} tasks.`),
);

const flashcardReviewTrophies = thresholdTrophies(
  "flashcards",
  "fc-reviews",
  FLASHCARD_REVIEW_THRESHOLDS,
  (u) => u.flashcardStats.cardsReviewed,
  (t) => `${fmt(t)} Card Reviews`,
  (t) => `Review ${fmt(t)} flashcards.`,
);

const flashcardDeckTrophies = thresholdTrophies(
  "flashcards",
  "fc-decks",
  FLASHCARD_DECK_THRESHOLDS,
  (u) => u.flashcardStats.decksMastered,
  (t) => (t === 1 ? "Deck Mastered" : `${t} Decks Mastered`),
  (t) => (t === 1 ? "Master your first flashcard deck." : `Master ${t} flashcard decks.`),
);

const flashcardSessionTrophies = thresholdTrophies(
  "flashcards",
  "fc-sessions",
  FLASHCARD_SESSION_THRESHOLDS,
  (u) => u.flashcardStats.sessions,
  (t) => `${fmt(t)} Card Sessions`,
  (t) => `Complete ${fmt(t)} flashcard study sessions.`,
);

const gamePlayTrophies = thresholdTrophies(
  "games",
  "game-plays",
  GAME_PLAY_THRESHOLDS,
  totalGamePlays,
  (t) => `${fmt(t)} Game Plays`,
  (t) => `Play mini-games ${fmt(t)} times.`,
);

const gameScoreTrophies = thresholdTrophies(
  "games",
  "game-score",
  GAME_SCORE_THRESHOLDS,
  bestGameScore,
  (t) => `Score ${fmt(t)} in a Game`,
  (t) => `Reach a best score of ${fmt(t)} in any mini-game.`,
);

const weeklyTitleTrophies = thresholdTrophies(
  "weekly",
  "weekly-titles",
  WEEKLY_TITLE_THRESHOLDS,
  (u) => u.weeklyTitleInventory.length,
  (t) => (t === 1 ? "First Weekly Title" : `${t} Weekly Titles`),
  (t) =>
    t === 1
      ? "Unlock your first weekly challenge title."
      : `Collect ${t} weekly challenge titles.`,
);

const shopTrophies = thresholdTrophies(
  "shop",
  "shop-purchases",
  SHOP_PURCHASE_THRESHOLDS,
  shopPurchaseCount,
  (t) => (t === 1 ? "First Purchase" : `${t} Shop Purchases`),
  (t) =>
    t === 1
      ? "Buy your first item from the shop."
      : `Make ${t} shop purchases (themes, unlocks, titles, and more).`,
);

const socialTrophies = thresholdTrophies(
  "social",
  "friends",
  FRIEND_THRESHOLDS,
  (u) => u.friends.length,
  (t) => (t === 1 ? "First Friend" : `${t} Friends`),
  (t) => (t === 1 ? "Add your first study buddy." : `Add ${t} friends.`),
);

const focusLabMissionTrophies = thresholdTrophies(
  "unique",
  "focus-lab-missions",
  FOCUS_LAB_MISSION_THRESHOLDS,
  (u) => u.focusLabStats.missionsCompleted,
  (t) => (t === 1 ? "First Focus Mission" : `${t} Focus Missions`),
  (t) =>
    t === 1
      ? "Complete your first Focus Lab daily mission."
      : `Complete ${t} Focus Lab daily missions.`,
);

const noteTrophies = thresholdTrophies(
  "unique",
  "notes",
  NOTE_COUNT_THRESHOLDS,
  (u) => u.notes.length,
  (t) => (t === 1 ? "First Note" : `${t} Notes`),
  (t) => (t === 1 ? "Write your first study note." : `Create ${t} study notes.`),
);

const deckCardTrophies = thresholdTrophies(
  "flashcards",
  "deck-cards",
  DECK_CARD_THRESHOLDS,
  (u) => u.decks.reduce((sum, d) => sum + d.cards.length, 0),
  (t) => `${t} Cards Created`,
  (t) => `Build decks containing ${t} flashcards total.`,
);

const rankTrophies: TrophyDef[] = STUDY_RANKS
  .filter((r) => r.minMinutes > 0)
  .sort((a, b) => a.minMinutes - b.minMinutes)
  .map((rank, index, arr) => ({
    id: `rank-${rank.id}`,
    name: rank.label,
    description: `Reach the ${rank.label} study rank (${rank.minMinutes}+ minutes).`,
    category: "rank" as TrophyCategory,
    tier: tierFromIndex(index, arr.length),
    reward: pickTrophyReward("rank", tierFromIndex(index, arr.length), index, arr.length),
    check: (user: UserData) => studyRankFromUser(user).minMinutes >= rank.minMinutes,
    progress: (user: UserData) => ({
      current: Math.min(user.totalStudyMinutes, rank.minMinutes),
      target: rank.minMinutes,
    }),
  }));

const uniqueTrophies: TrophyDef[] = [
  {
    id: "unique-midnight-session",
    name: "Midnight Scholar",
    description: "Complete a focus session during the midnight hour (12 AM).",
    category: "unique",
    tier: "gold",
    hidden: true,
    reward: { kind: "freeTitle", label: "Free title!" },
    check: (u) => hasSessionAtHour(u, [0]),
  },
  {
    id: "unique-night-owl",
    name: "Night Owl",
    description: "Study during the late-night hours (10 PM – 11 PM).",
    category: "unique",
    tier: "silver",
    hidden: true,
    check: (u) => hasSessionAtHour(u, [22, 23]),
  },
  {
    id: "unique-early-bird",
    name: "Early Bird",
    description: "Study during the early morning (5 AM – 6 AM).",
    category: "unique",
    tier: "silver",
    hidden: true,
    check: (u) => hasSessionAtHour(u, [5, 6]),
  },
  {
    id: "unique-marathon-session",
    name: "Marathon Focus",
    description: "Complete a single focus session of 90 minutes or longer.",
    category: "unique",
    tier: "platinum",
    hidden: true,
    reward: { kind: "freeShopItem", label: "1 free shop item!" },
    check: (u) => u.focusLabStats.bestSessionMinutes >= 90,
    progress: (u) => ({
      current: Math.min(u.focusLabStats.bestSessionMinutes, 90),
      target: 90,
    }),
  },
  {
    id: "unique-deep-session",
    name: "Deep Dive",
    description: "Complete a single focus session of 120 minutes or longer.",
    category: "unique",
    tier: "legend",
    hidden: true,
    reward: { kind: "freeShopItem", label: "1 free shop item!" },
    check: (u) => u.focusLabStats.bestSessionMinutes >= 120,
    progress: (u) => ({
      current: Math.min(u.focusLabStats.bestSessionMinutes, 120),
      target: 120,
    }),
  },
  {
    id: "unique-perfect-focus",
    name: "Laser Focus",
    description: "Rate a session 5/5 for focus quality.",
    category: "unique",
    tier: "gold",
    hidden: true,
    reward: { kind: "freeSound", label: "Free timer sound!" },
    check: (u) => u.sessionLog.some((s) => s.focusRating === 5),
  },
  {
    id: "unique-session-centurion",
    name: "Century Session",
    description: "Earn 100+ focus points in a single session.",
    category: "unique",
    tier: "gold",
    hidden: true,
    check: (u) => maxSessionPoints(u) >= 100,
    progress: (u) => ({ current: Math.min(maxSessionPoints(u), 100), target: 100 }),
  },
  {
    id: "unique-focus-lab-unlocked",
    name: "Lab Rat",
    description: "Unlock the Focus Lab from the shop.",
    category: "unique",
    tier: "silver",
    check: (u) => Boolean(u.unlocks["focus-lab"]),
  },
  {
    id: "unique-mentor-unlocked",
    name: "Mentor's Apprentice",
    description: "Unlock the Mentor Hub from the shop.",
    category: "unique",
    tier: "silver",
    check: (u) => Boolean(u.unlocks["mentor-hub"]),
  },
  {
    id: "unique-theme-studio",
    name: "Colour Curator",
    description: "Unlock the Colour & Gradient Studio.",
    category: "unique",
    tier: "silver",
    check: (u) => Boolean(u.unlocks["colour-maker"]),
  },
  {
    id: "unique-custom-title",
    name: "Name Your Legacy",
    description: "Unlock the custom display title.",
    category: "unique",
    tier: "gold",
    check: (u) => Boolean(u.unlocks["custom-name"]) || u.customTitleUnlocked,
  },
  {
    id: "unique-theme-collector",
    name: "Theme Collector",
    description: "Own 8 or more colour themes.",
    category: "unique",
    tier: "gold",
    reward: { kind: "freeTheme", label: "Free theme!" },
    check: (u) => u.ownedThemes.length >= 8,
    progress: (u) => ({ current: Math.min(u.ownedThemes.length, 8), target: 8 }),
  },
  {
    id: "unique-title-collector",
    name: "Title Collector",
    description: "Own 5 or more display titles.",
    category: "unique",
    tier: "gold",
    reward: { kind: "freeTitle", label: "Free title!" },
    check: (u) => u.ownedTitles.length >= 5,
    progress: (u) => ({ current: Math.min(u.ownedTitles.length, 5), target: 5 }),
  },
  {
    id: "unique-gift-giver",
    name: "Generous Soul",
    description: "Gift focus points to another user.",
    category: "unique",
    tier: "platinum",
    hidden: true,
    check: (u) => u.giftedAmount > 0,
  },
  {
    id: "unique-vip",
    name: "VIP Status",
    description: "Hold VIP access.",
    category: "unique",
    tier: "platinum",
    hidden: true,
    check: (u) => u.vipAccess,
  },
  {
    id: "unique-honour",
    name: "Hall of Honour",
    description: "Earn honorary access.",
    category: "unique",
    tier: "legend",
    hidden: true,
    check: (u) => u.honoraryAccess,
  },
  {
    id: "unique-focus-streak-7",
    name: "Focus Streak",
    description: "Maintain a 7-day Focus Lab mission streak.",
    category: "unique",
    tier: "gold",
    check: (u) => u.focusLabStats.focusStreak >= 7,
    progress: (u) => ({
      current: Math.min(u.focusLabStats.focusStreak, 7),
      target: 7,
    }),
  },
  {
    id: "unique-task-grinder",
    name: "Task Grinder",
    description: "Spend 60+ focus minutes on a single task.",
    category: "unique",
    tier: "gold",
    hidden: true,
    check: (u) => u.tasks.some((t) => t.focusMinutesSpent >= 60),
  },
  {
    id: "unique-all-hours",
    name: "Around the Clock",
    description: "Study during morning, afternoon, and evening hours.",
    category: "unique",
    tier: "platinum",
    hidden: true,
    check: (u) => {
      const hours = sessionHours(u);
      const morning = [5, 6, 7, 8, 9, 10, 11].some((h) => hours.has(h));
      const afternoon = [12, 13, 14, 15, 16, 17].some((h) => hours.has(h));
      const evening = [18, 19, 20, 21, 22, 23].some((h) => hours.has(h));
      return morning && afternoon && evening;
    },
  },
  {
    id: "unique-combo-master",
    name: "Combo Master",
    description: "Reach a 7-day login streak for maximum combo multiplier.",
    category: "unique",
    tier: "platinum",
    reward: { kind: "discount", percent: 20, label: "20% off next purchase" },
    check: (u) => u.loginStreak >= 7,
    progress: (u) => ({ current: Math.min(u.loginStreak, 7), target: 7 }),
  },
  {
    id: "unique-shield-hoarder",
    name: "Shield Hoarder",
    description: "Hold 3 or more streak shields at once.",
    category: "unique",
    tier: "silver",
    hidden: true,
    check: (u) => u.streakShields >= 3,
    progress: (u) => ({ current: Math.min(u.streakShields, 3), target: 3 }),
  },
  {
    id: "unique-inbox-reader",
    name: "Well Informed",
    description: "Receive 5 or more inbox notifications.",
    category: "unique",
    tier: "bronze",
    hidden: true,
    check: (u) => u.inbox.length >= 5,
    progress: (u) => ({ current: Math.min(u.inbox.length, 5), target: 5 }),
  },
  {
    id: "unique-personal-goal",
    name: "Goal Getter",
    description: "Set a personal daily study goal of 60+ minutes.",
    category: "unique",
    tier: "bronze",
    check: (u) => u.personalGoalMinutes >= 60,
    progress: (u) => ({
      current: Math.min(u.personalGoalMinutes, 60),
      target: 60,
    }),
  },
  {
    id: "unique-total-earned",
    name: "Lifetime Earner",
    description: "Earn 50,000 total focus points across your journey.",
    category: "unique",
    tier: "legend",
    reward: { kind: "points", amount: 2_500, label: "+2,500 focus points" },
    check: (u) => u.totalPointsEarned >= 50_000,
    progress: (u) => ({
      current: Math.min(u.totalPointsEarned, 50_000),
      target: 50_000,
    }),
  },
];

export const TROPHY_CATALOG: TrophyDef[] = [
  ...focusPointTrophies,
  ...studyMinuteTrophies,
  ...streakTrophies,
  ...loginStreakTrophies,
  ...sessionTrophies,
  ...taskTrophies,
  ...flashcardReviewTrophies,
  ...flashcardDeckTrophies,
  ...flashcardSessionTrophies,
  ...deckCardTrophies,
  ...gamePlayTrophies,
  ...gameScoreTrophies,
  ...weeklyTitleTrophies,
  ...shopTrophies,
  ...socialTrophies,
  ...rankTrophies,
  ...focusLabMissionTrophies,
  ...noteTrophies,
  ...uniqueTrophies,
];

const trophyMap = new Map(TROPHY_CATALOG.map((t) => [t.id, t]));

export function trophyById(id: string): TrophyDef | undefined {
  return trophyMap.get(id);
}

export function countTrophies(user: UserData): { earned: number; total: number; hiddenEarned: number; hiddenTotal: number } {
  let earned = 0;
  let hiddenEarned = 0;
  let hiddenTotal = 0;
  for (const trophy of TROPHY_CATALOG) {
    if (trophy.hidden) hiddenTotal += 1;
    if (trophy.check(user)) {
      earned += 1;
      if (trophy.hidden) hiddenEarned += 1;
    }
  }
  return { earned, total: TROPHY_CATALOG.length, hiddenEarned, hiddenTotal };
}
