import { DATA_VERSION } from "../data/constants";
import { themes } from "../data/themes";
import { UNLOCK_IDS } from "../data/constants";
import { STARTER_TITLE_ID } from "../data/titles";
import { getWeekKey } from "./week";
import { normalizeDateKey, isTodayKey, todayKey } from "./dates";
import { backfillTrophies } from "./trophies";
import { pickDailyQuest } from "../data/daily-quests";
import type { AppStore, DeckCard, Note, OnboardingProfile, Tab, Task, UserData } from "../types";

const DEFAULT_ONBOARDING_DRAFT: OnboardingProfile = {
  displayName: "",
  focusDurationMin: 25,
  breakDurationMin: 5,
  mainGoal: "Stay consistent",
  studyStyle: "Balanced",
  starterTheme: "green",
  notificationPref: false,
  reminderHour: 17,
  reminderMinute: 0,
};

function migrateDeckCard(c: Partial<DeckCard>): DeckCard {
  const known = c.known ?? false;
  const status = c.status ?? (known ? "known" : c.seen && (c.seen ?? 0) > 0 ? "practice" : "new");
  return {
    id: c.id ?? crypto.randomUUID(),
    q: c.q ?? "",
    a: c.a ?? "",
    ease: c.ease ?? 2.5,
    seen: c.seen ?? 0,
    known,
    status,
    dueAt: c.dueAt ?? new Date().toISOString(),
    intervalDays: c.intervalDays ?? 1,
    reps: c.reps ?? 0,
  };
}

const OWNER_EMAIL = "abdullahahmed";

export const isToday = (date: string) => isTodayKey(normalizeDateKey(date) || date);
export { dayDiff, todayKey, normalizeDateKey } from "./dates";

function migrateTask(t: Partial<Task> & { done?: boolean }): Task {
  const status = t.status ?? (t.done ? "done" : "todo");
  return {
    id: t.id ?? crypto.randomUUID(),
    title: t.title ?? "Untitled",
    tag: t.tag ?? "General",
    category: t.category ?? t.tag ?? "General",
    description: t.description ?? "",
    priority: t.priority ?? "Medium",
    status,
    done: status === "done",
    minutes: t.minutes ?? 25,
    dueDate: t.dueDate || undefined,
    focusMinutesSpent: t.focusMinutesSpent ?? 0,
    pointsReward: t.pointsReward ?? 25,
  };
}

function migrateNotes(raw: unknown, folders: { id: string; name: string }[]): Note[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    const now = new Date().toISOString();
    const defaultFolder = folders[0]?.id ?? "general";
    return (raw as string[]).map((body, i) => ({
      id: crypto.randomUUID(),
      title: body.slice(0, 40).trim() || `Note ${i + 1}`,
      body,
      folderId: defaultFolder,
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    }));
  }
  return (raw as Note[]).map((n) => ({
    id: n.id ?? crypto.randomUUID(),
    title: n.title ?? "Untitled",
    body: n.body ?? "",
    folderId: n.folderId ?? folders[0]?.id ?? "general",
    tags: n.tags ?? [],
    pinned: n.pinned ?? false,
    createdAt: n.createdAt ?? new Date().toISOString(),
    updatedAt: n.updatedAt ?? new Date().toISOString(),
  }));
}

export function defaultUser(email: string, password: string, username: string): UserData {
  const now = new Date().toISOString();
  return {
    username,
    email,
    password,
    role: "user",
    vipAccess: false,
    honoraryAccess: false,
    banned: false,
    createdAt: now,
    focusPoints: 100,
    totalStudyMinutes: 0,
    sessionsCompleted: 0,
    tasksCompleted: 0,
    streak: 0,
    lastStudyDate: "",
    tags: {},
    tasks: [],
    decks: [],
    notes: [],
    noteFolders: [{ id: "general", name: "General" }, { id: "study", name: "Study" }],
    ownedThemes: ["green"],
    equippedTheme: "green",
    ownedCustomThemes: [],
    savedCustomThemes: [],
    darkMode: true,
    notifications: false,
    soundEffects: true,
    discount: 0,
    focusLockOn: false,
    lockedTabs: [],
    dailySpinDate: "",
    gamesUnlocked: ["word-scramble", "number-ninja", "reaction-tap", "memory-tiles", "math-sprint"],
    achievements: [],
    moodBefore: [],
    moodAfter: [],
    vipDailyClaimDate: "",
    suspendedUntil: "",
    dailyUserBoostDate: "",
    personalGoalMinutes: 60,
    inbox: [],
    customRankName: "",
    customTitleUnlocked: false,
    ownedTitles: [STARTER_TITLE_ID],
    equippedTitleId: STARTER_TITLE_ID,
    mentorHubUnlocked: false,
    roleExpiresAt: "",
    vipExpiresAt: "",
    honoraryExpiresAt: "",
    muted: false,
    mutedUntil: "",
    streakShields: 0,
    lastShieldRefill: "",
    lootBoxDate: "",
    mentorMessage: null,
    tagline: "",
    ownerNotes: "",
    lastGiftDate: "",
    giftedAmount: 0,
    friends: [],
    tagColors: {},
    tempBoostMultiplier: 1,
    tempBoostExpires: "",
    flagged: false,
    watchlistReason: "",
    weeklyHistory: {},
    weeklyRecords: { [getWeekKey()]: { weekKey: getWeekKey(), focusMinutes: 0, challengeProgress: 0, titlesUnlockedThisWeek: [] } },
    weeklyTitleInventory: [],
    weeklyThresholdsClaimed: {},
    loginStreak: 0,
    lastActiveDate: "",
    ownedRotatingThemeIds: [],
    notificationPref: false,
    reminderHour: 17,
    reminderMinute: 0,
    mainGoal: "Stay consistent",
    studyStyle: "Balanced",
    warningCount: 0,
    supabaseId: "",
    gamePointsEarnedDate: "",
    gamePointsEarnedToday: 0,
    focusDurationMin: 25,
    breakDurationMin: 5,
    unlocks: {},
    sessionLog: [],
    focusLabStats: {
      bestSessionMinutes: 0,
      favouriteFocusMin: 25,
      bestHour: 9,
      focusStreak: 0,
      lastMissionDate: "",
      missionsCompleted: 0,
    },
    miniGameStats: {},
    flashcardStats: { cardsReviewed: 0, decksMastered: 0, sessions: 0 },
    totalPointsEarned: 0,
    ownerFlags: { pointsBoostOn: false, extraParticles: false, debugOpen: false },
    studyGlowEnabled: false,
    dismissedRecommendations: [],
    seenMilestones: [],
    recentMilestones: [],
    hapticsEnabled: true,
    accentPreset: "theme",
    soundscapeId: "off",
    soundscapeVolume: 0.5,
    lastRecapSeenWeek: "",
    timerEndSoundId: "default",
    unlockedTrophies: [],
    trophyUnlockDates: {},
    trophyShopCredits: 0,
    focusProfiles: [
      {
        id: "default",
        name: "Default",
        focusDurationMin: 25,
        breakDurationMin: 5,
        soundscapeId: "off",
        soundscapeVolume: 0.5,
        timerEndSoundId: "default",
        focusLockOn: false,
        lockedTabs: [],
      },
    ],
    activeFocusProfileId: "default",
    dailyQuestDate: "",
    dailyQuestId: "",
    dailyQuestClaimed: false,
    shopWishlist: [],
    dataVersion: DATA_VERSION,
  };
}

/** Wipe progress/unlocks; keep login identity (and owner role when requested). */
export function resetUserAccount(
  existing: UserData,
  opts?: { preserveOwnerRole?: boolean },
): UserData {
  const fresh = defaultUser(existing.email, existing.password, existing.username);
  const isOwnerAccount = existing.email === OWNER_EMAIL || existing.role === "owner";
  return {
    ...fresh,
    email: existing.email,
    password: existing.password,
    username: existing.username,
    supabaseId: existing.supabaseId,
    createdAt: existing.createdAt,
    role: opts?.preserveOwnerRole || isOwnerAccount ? "owner" : "user",
    vipAccess: false,
    honoraryAccess: false,
    banned: false,
    muted: false,
    mutedUntil: "",
    suspendedUntil: "",
    flagged: false,
    watchlistReason: "",
    ownerFlags: { pointsBoostOn: false, extraParticles: false, debugOpen: false },
    dataVersion: DATA_VERSION,
  };
}

export function migrateUser(k: string, v: Partial<UserData>): UserData {
  const now = Date.now();
  const isMonday = new Date().getDay() === 1;
  let role = (v.role && ["owner", "admin", "moderator", "vip", "user"].includes(v.role)
    ? v.role
    : k === OWNER_EMAIL
      ? "owner"
      : "user") as UserData["role"];
  let vipAccess = v.vipAccess ?? v.role === "vip";
  let honoraryAccess = v.honoraryAccess ?? false;
  const roleExpiresAt = v.roleExpiresAt ?? "";
  const vipExpiresAt = v.vipExpiresAt ?? "";
  const honoraryExpiresAt = v.honoraryExpiresAt ?? "";
  if (k !== OWNER_EMAIL) {
    if (roleExpiresAt && new Date(roleExpiresAt).getTime() < now) role = "user";
    if (vipExpiresAt && new Date(vipExpiresAt).getTime() < now) vipAccess = false;
    if (honoraryExpiresAt && new Date(honoraryExpiresAt).getTime() < now) honoraryAccess = false;
  }
  let streakShields = v.streakShields ?? 0;
  let lastShieldRefill = v.lastShieldRefill ?? "";
  if ((vipAccess || honoraryAccess) && isMonday && lastShieldRefill !== new Date().toDateString()) {
    streakShields = honoraryAccess ? 3 : 1;
    lastShieldRefill = new Date().toDateString();
  }
  const mutedUntil = v.mutedUntil ?? "";
  const muted = mutedUntil && new Date(mutedUntil).getTime() < now ? false : (v.muted ?? false);
  const tempBoostExpires = v.tempBoostExpires ?? "";
  const tempBoostMultiplier =
    tempBoostExpires && new Date(tempBoostExpires).getTime() < now ? 1 : (v.tempBoostMultiplier ?? 1);

  const noteFolders =
    v.noteFolders?.length
      ? v.noteFolders
      : [
          { id: "general", name: "General" },
          { id: "study", name: "Study" },
        ];

  const unlocks: Record<string, boolean> = { ...(v.unlocks ?? {}) };
  if (v.mentorHubUnlocked) unlocks[UNLOCK_IDS.mentorHub] = true;
  if (v.customTitleUnlocked) unlocks[UNLOCK_IDS.customName] = true;

  const equipRaw = String(v.equippedTheme ?? "green");
  const equipNormalized =
    equipRaw in themes || equipRaw.startsWith("custom-") || equipRaw.startsWith("user-theme-")
      ? equipRaw
      : "green";

  const migratedLockedTabs = ((v.lockedTabs ?? []) as string[])
    .map((t) => (t === "progress" ? "profile" : t === "ownerSecret" ? "ownerSettings" : t))
    .filter((t) => t !== "progress" && t !== "ownerSecret" && t !== "mentor") as Tab[];

  const base = defaultUser(k, v.password ?? "", v.username ?? k);
  const notes = migrateNotes(v.notes, noteFolders);

  const baseReturn: UserData = {
    ...base,
    ...v,
    role,
    vipAccess,
    honoraryAccess,
    banned: v.banned ?? false,
    createdAt: v.createdAt ?? base.createdAt,
    darkMode: v.darkMode ?? true,
    notifications: v.notifications ?? true,
    soundEffects: v.soundEffects ?? true,
    tasks: (v.tasks ?? []).map(migrateTask),
    decks: (v.decks ?? []).map((d) => ({
      ...d,
      cards: (d.cards ?? []).map((c) => migrateDeckCard(c)),
    })),
    notes,
    noteFolders,
    equippedTheme: equipNormalized,
    ownedCustomThemes: v.ownedCustomThemes ?? [],
    savedCustomThemes: v.savedCustomThemes ?? [],
    customRankName: v.customRankName ?? "",
    customTitleUnlocked: v.customTitleUnlocked ?? false,
    ownedTitles: Array.from(
      new Set([STARTER_TITLE_ID, ...(v.ownedTitles ?? []), ...(v.customTitleUnlocked ? ["custom-name"] : [])]),
    ),
    equippedTitleId: v.equippedTitleId || STARTER_TITLE_ID,
    mentorHubUnlocked: v.mentorHubUnlocked ?? false,
    lockedTabs: migratedLockedTabs,
    unlocks,
    focusDurationMin: v.focusDurationMin ?? 25,
    breakDurationMin: v.breakDurationMin ?? 5,
    sessionLog: (v.sessionLog ?? []).map((s) => ({
      ...s,
      basePoints: s.basePoints ?? s.pointsEarned,
      comboMult: s.comboMult ?? 1,
      ownerMult: s.ownerMult ?? 1,
    })),
    weeklyRecords: v.weeklyRecords ?? { [getWeekKey()]: { weekKey: getWeekKey(), focusMinutes: 0, challengeProgress: 0, titlesUnlockedThisWeek: [] } },
    weeklyTitleInventory: v.weeklyTitleInventory ?? [],
    weeklyThresholdsClaimed: v.weeklyThresholdsClaimed ?? {},
    loginStreak: v.loginStreak ?? 0,
    ownedRotatingThemeIds: v.ownedRotatingThemeIds ?? [],
    notificationPref: v.notificationPref ?? v.notifications ?? true,
    reminderHour: v.reminderHour ?? 17,
    reminderMinute: v.reminderMinute ?? 0,
    mainGoal: v.mainGoal ?? "Stay consistent",
    studyStyle: v.studyStyle ?? "Balanced",
    focusLabStats: v.focusLabStats ?? base.focusLabStats,
    miniGameStats: v.miniGameStats ?? {},
    flashcardStats: v.flashcardStats ?? base.flashcardStats,
    totalPointsEarned: v.totalPointsEarned ?? v.focusPoints ?? 0,
    ownerFlags: v.ownerFlags ?? base.ownerFlags,
    studyGlowEnabled: v.studyGlowEnabled ?? false,
    dismissedRecommendations: (v.dismissedRecommendations ?? []).slice(-20),
    seenMilestones: v.seenMilestones ?? [],
    recentMilestones: (v.recentMilestones ?? []).slice(-12),
    hapticsEnabled: v.hapticsEnabled ?? true,
    accentPreset: typeof v.accentPreset === "string" && v.accentPreset ? v.accentPreset : "theme",
    soundscapeId: typeof v.soundscapeId === "string" && v.soundscapeId ? v.soundscapeId : "off",
    soundscapeVolume:
      typeof v.soundscapeVolume === "number" && Number.isFinite(v.soundscapeVolume)
        ? Math.min(1, Math.max(0, v.soundscapeVolume))
        : 0.5,
    lastRecapSeenWeek: v.lastRecapSeenWeek ?? "",
    timerEndSoundId: typeof v.timerEndSoundId === "string" && v.timerEndSoundId ? v.timerEndSoundId : "default",
    unlockedTrophies: v.unlockedTrophies ?? [],
    trophyUnlockDates: v.trophyUnlockDates ?? {},
    trophyShopCredits: v.trophyShopCredits ?? 0,
    focusProfiles:
      v.focusProfiles?.length
        ? v.focusProfiles.map((p) => ({
            id: p.id ?? crypto.randomUUID(),
            name: p.name ?? "Preset",
            focusDurationMin: p.focusDurationMin ?? v.focusDurationMin ?? 25,
            breakDurationMin: p.breakDurationMin ?? v.breakDurationMin ?? 5,
            soundscapeId: p.soundscapeId ?? v.soundscapeId ?? "off",
            soundscapeVolume: p.soundscapeVolume ?? v.soundscapeVolume ?? 0.5,
            timerEndSoundId: p.timerEndSoundId ?? v.timerEndSoundId ?? "default",
            focusLockOn: p.focusLockOn ?? false,
            lockedTabs: (p.lockedTabs ?? []) as Tab[],
          }))
        : [
            {
              id: "default",
              name: "Default",
              focusDurationMin: v.focusDurationMin ?? 25,
              breakDurationMin: v.breakDurationMin ?? 5,
              soundscapeId: v.soundscapeId ?? "off",
              soundscapeVolume: v.soundscapeVolume ?? 0.5,
              timerEndSoundId: v.timerEndSoundId ?? "default",
              focusLockOn: v.focusLockOn ?? false,
              lockedTabs: migratedLockedTabs,
            },
          ],
    activeFocusProfileId: v.activeFocusProfileId ?? "default",
    dailyQuestDate: v.dailyQuestDate ?? "",
    dailyQuestId: v.dailyQuestId ?? "",
    dailyQuestClaimed: v.dailyQuestClaimed ?? false,
    shopWishlist: (v.shopWishlist ?? []).slice(0, 8),
    lastStudyDate: normalizeDateKey(v.lastStudyDate ?? ""),
    lastActiveDate: normalizeDateKey(v.lastActiveDate ?? ""),
    streakShields,
    lastShieldRefill,
    muted,
    mutedUntil,
    tempBoostMultiplier,
    tempBoostExpires,
    dataVersion: DATA_VERSION,
  };
  const questDay = todayKey();
  let merged = baseReturn;
  if (merged.dailyQuestDate !== questDay) {
    const q = pickDailyQuest(k, questDay);
    merged = { ...merged, dailyQuestDate: questDay, dailyQuestId: q.id, dailyQuestClaimed: false };
  }
  return backfillTrophies(merged);
}

export function migrateStore(parsed: Partial<AppStore> & { users?: Record<string, Partial<UserData>> }): AppStore {
  const now = Date.now();
  const migratedUsers = Object.fromEntries(
    Object.entries(parsed.users || {}).map(([k, v]) => [k, migrateUser(k, v)]),
  );
  if (migratedUsers[OWNER_EMAIL]) {
    migratedUsers[OWNER_EMAIL] = {
      ...migratedUsers[OWNER_EMAIL],
      role: "owner",
      banned: false,
      suspendedUntil: "",
      muted: false,
    };
  }
  const announcement =
    parsed.announcement && new Date(parsed.announcement.expiresAt).getTime() > now ? parsed.announcement : null;
  const globalEvent =
    parsed.globalEvent && new Date(parsed.globalEvent.expiresAt).getTime() > now ? parsed.globalEvent : null;

  return {
    seenOnboarding: parsed.seenOnboarding ?? false,
    onboardingStep: parsed.onboardingStep ?? 0,
    onboardingDraft: { ...DEFAULT_ONBOARDING_DRAFT, ...(parsed.onboardingDraft ?? {}) },
    users: migratedUsers,
    current: parsed.current ?? "",
    impersonatingFrom: parsed.impersonatingFrom ?? "",
    ownerSwitchWarningSeen: parsed.ownerSwitchWarningSeen ?? false,
    auditLog: (parsed.auditLog ?? []).slice(0, 200),
    announcement,
    globalEvent,
    pointMultiplierBase: parsed.pointMultiplierBase ?? 1,
    pointsPerInterval: 2,
    reports: parsed.reports ?? [],
    customThemes: parsed.customThemes ?? [],
    pendingChallenges: parsed.pendingChallenges ?? [],
    activeChallenge: parsed.activeChallenge ?? null,
    forceMode: parsed.forceMode ?? "off",
    quickReplies: parsed.quickReplies ?? [
      "Keep going. You got this!",
      "Take a 5-minute walk and reset.",
      "Drink water. Sit up straight. Re-engage.",
      "One more focused session — momentum is yours.",
    ],
    maintenanceMode: parsed.maintenanceMode ?? false,
  };
}

export const TAB_META: Record<Tab, { label: string; description: string }> = {
  home: { label: "Home", description: "Today's study snapshot and quick links." },
  tasks: { label: "Tasks", description: "Plan, prioritise, and track study tasks." },
  timer: { label: "Focus Timer", description: "Focus and break sessions that fit your schedule." },
  cards: { label: "Flashcards", description: "Decks and review for memorisation." },
  notes: { label: "Notes", description: "Notes with folders, tags, and search." },
  shop: { label: "Shop", description: "Optional themes and extras." },
  games: { label: "Break Activities", description: "Short activities for study breaks." },
  honour: { label: "Hall of Honour", description: "Community study leaders." },
  analytics: { label: "Analytics", description: "Study time and habit trends." },
  profile: { label: "Profile", description: "Progress, streak, and account." },
  settings: { label: "Settings", description: "App preferences and account." },
  focusLab: { label: "Focus Lab", description: "Focus habits and session insights." },
  themeStudio: { label: "Theme Studio", description: "Custom colours and appearance." },
  ownerSettings: { label: "Owner Settings", description: "Owner admin tools." },
  achievements: { label: "Achievements", description: "Trophies, milestones, and weekly titles." },
};
