export type Tab =
  | "home"
  | "tasks"
  | "timer"
  | "cards"
  | "notes"
  | "shop"
  | "profile"
  | "settings"
  | "games"
  | "honour"
  | "analytics"
  | "focusLab"
  | "themeStudio"
  | "ownerSettings"
  | "achievements"
  | "accessibility"
  | "betaHome"
  | "focusPresetLab"
  | "routineBuilder"
  | "goals";

export type ThemeId =
  | "green"
  | "ocean"
  | "sunset"
  | "pink"
  | "red"
  | "orange"
  | "violet"
  | "royal"
  | "aurora"
  | "midnight"
  | "forest"
  | "lavender"
  | "slate"
  | "rose"
  | "carbon"
  | "coral"
  | "ember"
  | "skyline"
  | "plum"
  | "mint"
  | "crimson"
  | "sand"
  | "sandyGold";

export type ThemeSurface = "classic" | "liquid";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "Low" | "Medium" | "High";

export type Task = {
  id: string;
  title: string;
  tag: string;
  category: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  done: boolean;
  minutes: number;
  dueDate?: string;
  focusMinutesSpent: number;
  pointsReward: number;
};

export type CardStatus = "new" | "practice" | "known";

export type DeckCard = {
  id: string;
  q: string;
  a: string;
  ease: number;
  seen: number;
  known?: boolean;
  status?: CardStatus;
  dueAt?: string;
  intervalDays?: number;
  reps?: number;
};

export type Deck = {
  id: string;
  name: string;
  cards: DeckCard[];
  rewardedAt?: string;
  linkedExamId?: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  folderId: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolder = { id: string; name: string };

export type SessionReflection = {
  distractedBy?: string;
  goalMet?: boolean;
  note?: string;
};

export type SessionLogEntry = {
  at: string;
  minutes: number;
  breakMinutes?: number;
  taskId?: string;
  examId?: string;
  hour: number;
  pointsEarned: number;
  basePoints?: number;
  comboMult?: number;
  ownerMult?: number;
  moodBefore?: string;
  moodAfter?: string;
  taskCompleted?: boolean;
  phase?: "focus" | "break";
  focusRating?: 1 | 2 | 3 | 4 | 5;
  reflection?: SessionReflection;
  completedFullFocus?: boolean;
};

export type FocusProfile = {
  id: string;
  name: string;
  focusDurationMin: number;
  breakDurationMin: number;
  soundscapeId: string;
  soundscapeVolume: number;
  timerEndSoundId: string;
  focusLockOn: boolean;
  lockedTabs: Tab[];
};

export type StudyRoutineStep =
  | { id: string; kind: "focus"; focusMin: number; breakMin: number; label?: string }
  | { id: string; kind: "break"; breakMin: number }
  | { id: string; kind: "prompt"; text: string };

export type StudyRoutine = {
  id: string;
  name: string;
  steps: StudyRoutineStep[];
  createdAt: string;
  updatedAt: string;
};

export type GoalMilestone = { id: string; label: string; done: boolean };

export type SemesterGoal = {
  id: string;
  title: string;
  notes?: string;
  targetDate?: string;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
};

export type ActiveRoutineState = {
  routineId: string;
  stepIndex: number;
  startedAt: string;
};

export type WishlistEntry = {
  id: string;
  kind: "catalog" | "theme" | "title" | "booster" | "rotating";
  addedAt: string;
  targetPrice: number;
};

export type MilestoneRecord = {
  id: string;
  title: string;
  subtitle: string;
  tier: "bronze" | "silver" | "gold" | "legend";
  kind: string;
  unlockedAt: string;
};

export type TimerSnapshot = {
  running: boolean;
  phase: TimerPhase;
  secondsLeft: number;
  focusMin: number;
  collapsed: boolean;
};

export type WeekRecord = {
  weekKey: string;
  focusMinutes: number;
  challengeProgress: number;
  titlesUnlockedThisWeek: string[];
  challengeId?: string;
};

export type WeeklyTitleUnlock = {
  id: string;
  label: string;
  threshold: number;
  weekKey: string;
  unlockedAt: string;
};

export type OnboardingProfile = {
  displayName: string;
  focusDurationMin: number;
  breakDurationMin: number;
  mainGoal: string;
  studyStyle: string;
  starterTheme: string;
  notificationPref: boolean;
  reminderHour: number;
  reminderMinute: number;
};

export type FocusLabStats = {
  bestSessionMinutes: number;
  favouriteFocusMin: number;
  bestHour: number;
  focusStreak: number;
  lastMissionDate: string;
  missionsCompleted: number;
};

export type MiniGameStats = Record<string, { plays: number; bestScore: number; pointsEarned: number }>;

export type FlashcardStats = {
  cardsReviewed: number;
  decksMastered: number;
  sessions: number;
  examSessions?: number;
};

export type Exam = {
  id: string;
  title: string;
  subject?: string;
  examDate: string;
  targetMinutesPerDay?: number;
  linkedTaskId?: string;
  readinessRating?: 1 | 2 | 3 | 4 | 5;
  readinessAskedAt?: string;
  readinessNote?: string;
  archived?: boolean;
};

export type AccessibilityPrefs = {
  reduceMotion: boolean;
  textScale: "default" | "large" | "xl";
  highContrast: boolean;
  largeTargets: boolean;
  hapticLevel: "off" | "light" | "normal";
  /** When false, use flat classic surfaces even if liquid theme is equipped. */
  liquidUiEnabled: boolean;
};

export type SavedCustomTheme = {
  id: string;
  name: string;
  color: string;
  color2?: string;
  gradient?: boolean;
  createdAt: string;
  liquidUi?: boolean;
};

export type OwnerFlags = {
  pointsBoostOn: boolean;
  extraParticles: boolean;
  debugOpen: boolean;
};

export type Role = "owner" | "admin" | "moderator" | "vip" | "user";

export type MentorMessage = { from: string; fromName: string; text: string; pinnedAt: string } | null;

export type AuditEntry = {
  id: string;
  actor: string;
  actorRole: Role;
  action: string;
  target: string;
  detail: string;
  timestamp: string;
};

export type Announcement = { text: string; expiresAt: string; createdBy: string; createdAt: string } | null;
export type GlobalEvent = { multiplier: number; label: string; expiresAt: string; createdBy: string } | null;
export type Report = { id: string; reporter: string; reportee: string; reason: string; status: "open" | "resolved" | "dismissed"; timestamp: string };
export type CustomTheme = {
  id: string;
  name: string;
  color: string;
  color2?: string;
  gradient?: boolean;
  createdBy: string;
  createdAt: string;
};
export type ChallengeSubmission = { id: string; text: string; submittedBy: string; submittedAt: string; status: "pending" | "approved" | "rejected" };
export type ForceMode = "off" | "dark" | "light";
export type SpinReward = { text: string; points?: number; discount?: number; unlockTheme?: ThemeId };

export type UserData = {
  username: string;
  email: string;
  password: string;
  role: Role;
  vipAccess: boolean;
  honoraryAccess: boolean;
  banned: boolean;
  createdAt: string;
  focusPoints: number;
  totalStudyMinutes: number;
  sessionsCompleted: number;
  tasksCompleted: number;
  streak: number;
  lastStudyDate: string;
  tags: Record<string, number>;
  tasks: Task[];
  decks: Deck[];
  notes: Note[];
  noteFolders: NoteFolder[];
  ownedThemes: ThemeId[];
  /** Per-theme classic / liquid ownership (12.2.6). */
  themeVariantsOwned?: Partial<Record<ThemeId, { classic?: boolean; liquid?: boolean }>>;
  equippedThemeSurface?: ThemeSurface;
  equippedTheme: string;
  ownedCustomThemes: string[];
  savedCustomThemes: SavedCustomTheme[];
  darkMode: boolean;
  notifications: boolean;
  soundEffects: boolean;
  discount: number;
  focusLockOn: boolean;
  lockedTabs: Tab[];
  dailySpinDate: string;
  gamesUnlocked: string[];
  achievements: string[];
  moodBefore: string[];
  moodAfter: string[];
  vipDailyClaimDate: string;
  suspendedUntil: string;
  dailyUserBoostDate: string;
  personalGoalMinutes: number;
  inbox: string[];
  customRankName: string;
  customTitleUnlocked: boolean;
  ownedTitles: string[];
  equippedTitleId: string;
  mentorHubUnlocked: boolean;
  roleExpiresAt: string;
  vipExpiresAt: string;
  honoraryExpiresAt: string;
  muted: boolean;
  mutedUntil: string;
  streakShields: number;
  lastShieldRefill: string;
  lootBoxDate: string;
  mentorMessage: MentorMessage;
  tagline: string;
  ownerNotes: string;
  lastGiftDate: string;
  giftedAmount: number;
  friends: string[];
  tagColors: Record<string, string>;
  tempBoostMultiplier: number;
  tempBoostExpires: string;
  flagged: boolean;
  watchlistReason: string;
  weeklyHistory: Record<string, number>;
  weeklyRecords: Record<string, WeekRecord>;
  weeklyTitleInventory: WeeklyTitleUnlock[];
  weeklyThresholdsClaimed: Record<string, number[]>;
  loginStreak: number;
  lastActiveDate: string;
  ownedRotatingThemeIds: string[];
  rotatingThemeVariantsOwned?: Record<string, { classic?: boolean; liquid?: boolean }>;
  notificationPref: boolean;
  reminderHour: number;
  reminderMinute: number;
  mainGoal: string;
  studyStyle: string;
  warningCount: number;
  supabaseId: string;
  gamePointsEarnedDate: string;
  gamePointsEarnedToday: number;
  focusDurationMin: number;
  breakDurationMin: number;
  unlocks: Record<string, boolean>;
  sessionLog: SessionLogEntry[];
  focusLabStats: FocusLabStats;
  miniGameStats: MiniGameStats;
  flashcardStats: FlashcardStats;
  totalPointsEarned: number;
  ownerFlags: OwnerFlags;
  dataVersion: number;
  studyGlowEnabled?: boolean;
  dismissedRecommendations?: string[];
  dismissedNotifications?: string[];
  seenMilestones?: string[];
  recentMilestones?: MilestoneRecord[];
  /** Android haptic feedback (default true). */
  hapticsEnabled: boolean;
  /** "theme" = follow equipped theme; "auto" = time of day; otherwise an AccentPreset id. */
  accentPreset: string;
  /** Focus soundscape id ("off" | "white" | "brown" | "rain" | "cafe" | "lofi"). */
  soundscapeId: string;
  /** 0..1 */
  soundscapeVolume: number;
  /** ISO week key of the last weekly recap the user viewed. */
  lastRecapSeenWeek: string;
  /** Timer end sound id (Web Audio synthesis). */
  timerEndSoundId: string;
  /** Earned trophy ids. */
  unlockedTrophies: string[];
  trophyUnlockDates: Record<string, string>;
  /** Free shop redemptions earned from trophy unlocks. */
  trophyShopCredits: number;
  /** Saved focus presets. */
  focusProfiles: FocusProfile[];
  activeFocusProfileId: string;
  /** Daily quest state (date key + template id + claimed). */
  dailyQuestDate: string;
  dailyQuestId: string;
  dailyQuestClaimed: boolean;
  /** Pinned shop items (max 8). */
  shopWishlist: WishlistEntry[];
  exams: Exam[];
  selectedExamId: string;
  accessibility: AccessibilityPrefs;
  seenReleaseVersion: string;
  dailyDealPurchasedKey: string;
  betaProgramAccess?: boolean;
  betaShellActive?: boolean;
  studyRoutines?: StudyRoutine[];
  semesterGoals?: SemesterGoal[];
  activeRoutine?: ActiveRoutineState | null;
};

export type AppStore = {
  seenOnboarding: boolean;
  onboardingStep: number;
  onboardingDraft: OnboardingProfile;
  users: Record<string, UserData>;
  current: string;
  impersonatingFrom: string;
  ownerSwitchWarningSeen: boolean;
  auditLog: AuditEntry[];
  announcement: Announcement;
  globalEvent: GlobalEvent;
  pointMultiplierBase: number;
  pointsPerInterval: number;
  reports: Report[];
  customThemes: CustomTheme[];
  pendingChallenges: ChallengeSubmission[];
  activeChallenge: { text: string; submittedBy: string; activatedAt: string } | null;
  forceMode: ForceMode;
  quickReplies: string[];
  maintenanceMode: boolean;
  betaProgramEnabled: boolean;
};

export type Booster = {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: "shield" | "boost24" | "boost12" | "discount20" | "gameUnlock" | "lootbox" | "noteKit";
};

export type GameKind = "scramble" | "math" | "memory" | "reaction";

export type GameState =
  | { kind: "scramble"; word: string; scrambled: string; guess: string }
  | { kind: "math"; a: number; b: number; op: "+" | "-" | "×"; guess: string }
  | { kind: "memory"; sequence: number[]; userInput: number[]; showing: boolean; step: number }
  | { kind: "reaction"; waiting: boolean; startAt: number; clicks: number; falseStart?: boolean }
  | null;

export type TimerPhase = "focus" | "break";
