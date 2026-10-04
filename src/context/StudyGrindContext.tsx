import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ensureSupabaseUser, OWNER_SUPA_EMAIL, OWNER_SUPA_PASSWORD, supabase, upsertProfile } from "../lib/supabase";
import {
  DEFAULT_APP_CONFIG,
  fetchAppConfig,
  setRemoteMaintenanceMode,
  subscribeAppConfig,
  type MaintenanceConfig,
} from "../lib/app-config";
import { applyStatusBarStyle, isAndroid, isNative, minimizeApp, onBackButton } from "../lib/native";
import { applyThemeToDocument } from "../lib/theme-engine";
import { hapticSuccess, setHapticsEnabled } from "../lib/haptics";
import { syncWidgetData } from "../lib/widget";
import { applyAccessibilityToBody, applyThemeSurfaceToBody } from "../lib/accessibility-body";
import { applyDiscount, scalePrice, themePurchasePrice, shopDisplayPrice } from "../lib/pricing";
import { economyMarketPrice, economyMarketPriceScaled, economyShopPrice, economyShopPriceScaled } from "../lib/economy-pricing";
import {
  canEquipThemeSurface,
  effectiveLiquidSurface,
  grantRotatingSurface,
  grantThemeSurface,
  ownsRotatingClassic,
  ownsRotatingLiquid,
  ownsThemeClassic,
  ownsThemeLiquid,
  revokeRotatingSurface,
  revokeThemeSurface,
} from "../lib/theme-variants";
import { ALL_SHOP_ITEMS } from "../data/shop-catalog";
import { PURCHASABLE_TITLES } from "../data/titles";
import { App as CapApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  STORE_KEY,
  OWNER_EMAIL,
  OWNER_PASS,
  APP_RELEASE_VERSION,
  GAME_POINTS_DAILY_CAP,
  MEMORY_SPRINT_ID,
  UNLOCK_IDS,
} from "../data/constants";
import { themes, vipThemes, honoraryThemes } from "../data/themes";
import { studyRankFromUser } from "../data/ranks";
import { titleById, CUSTOM_NAME_TITLE_ID, STARTER_TITLE } from "../data/titles";
import { migrateStore, defaultUser, isToday, TAB_META, resetUserAccount } from "../lib/migrations";
import { canEnterBetaProgram, isBetaFeatureTab, isBetaShell as userInBetaShell } from "../lib/beta-shell";
import { applyMilestones, detectMilestones } from "../lib/milestones";
import { applyTrophyUnlocks, detectNewTrophies } from "../lib/trophies";
import {
  canRedeemTrophyCredit,
  canRedeemTrophyCreditForTheme,
  canRedeemTrophyCreditForTitle,
} from "../lib/trophy-rewards";
import { pickDailyQuest, questById, isDailyQuestComplete } from "../data/daily-quests";
import { todayKey } from "../lib/dates";
import type { CelebrationEvent } from "../components/rewards/CelebrationModal";
import {
  FOCUS_LAB_PRICE,
  COLOUR_MAKER_PRICE,
  PRESET_LAB_PRICE,
} from "../data/constants";
import { ensureCurrentWeek, getWeekKey } from "../lib/week";
import { recordDailyActive } from "../lib/combo";
import { scaleRewardPoints } from "../lib/point-multiplier";
import { checkWeeklyTitleUnlocks } from "../lib/weekly-rotation";
import { rotatingThemeById } from "../data/pools/rotating-themes";
import { getNotificationService, syncNotificationSchedule } from "../lib/notifications";
import type {
  AppStore,
  Booster,
  GameState,
  Role,
  SpinReward,
  Tab,
  ThemeId,
  FocusProfile,
  SemesterGoal,
  StudyRoutine,
  WishlistEntry,
  TimerSnapshot,
  UserData,
} from "../types";

export type OwnerStorePatch = Partial<
  Pick<
    AppStore,
    | "announcement"
    | "globalEvent"
    | "customThemes"
    | "reports"
    | "pendingChallenges"
    | "activeChallenge"
    | "quickReplies"
    | "forceMode"
    | "maintenanceMode"
    | "ownerSwitchWarningSeen"
    | "betaProgramEnabled"
  >
>;

type Ctx = {
  store: AppStore;
  setStore: React.Dispatch<React.SetStateAction<AppStore>>;
  user: UserData | undefined;
  tab: Tab;
  setTab: (t: Tab) => void;
  goTab: (next: Tab, opts?: { closeMenu?: boolean }) => void;
  toast: string;
  setToast: (s: string) => void;
  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;
  updateUser: (next: UserData) => void;
  logAction: (action: string, target: string, detail?: string) => void;
  studyRankLabel: string;
  displayTitle: string;
  equippedThemeId: string;
  previewTheme: string | null;
  setPreviewTheme: (id: string | null) => void;
  rewardPopup: { open: boolean; title: string; subtitle?: string; points?: number };
  showReward: (title: string, subtitle?: string, points?: number) => void;
  closeReward: () => void;
  grantMiniGamePoints: (u: UserData, wish: number) => UserData;
  spin: () => void;
  spinResult: string;
  buyTheme: (id: ThemeId, surface: import("../types").ThemeSurface) => void;
  buyBooster: (b: Booster) => void;
  purchaseShopItem: (unlockKey: string, price: number, name: string) => boolean;
  buyTitle: (titleId: string, price: number) => void;
  buyRotatingTheme: (themeId: string, surface: import("../types").ThemeSurface) => void;
  sellShopItem: (unlockKey: string) => boolean;
  sellTitle: (titleId: string) => boolean;
  sellCustomName: () => boolean;
  sellThemeSurface: (themeId: string, surface: import("../types").ThemeSurface, rotating?: boolean) => boolean;
  equipTitle: (titleId: string) => void;
  hasUnlock: (key: string) => boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  auth: { username: string; email: string; password: string };
  setAuth: React.Dispatch<React.SetStateAction<{ username: string; email: string; password: string }>>;
  authMode: "signin" | "signup";
  setAuthMode: React.Dispatch<React.SetStateAction<"signin" | "signup">>;
  timerRunning: boolean;
  setTimerRunning: (r: boolean) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  gameScore: number;
  setGameScore: React.Dispatch<React.SetStateAction<number>>;
  gameRound: number;
  setGameRound: React.Dispatch<React.SetStateAction<number>>;
  gameMessage: string;
  setGameMessage: React.Dispatch<React.SetStateAction<string>>;
  selectedTaskId: string;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string>>;
  TAB_META: typeof TAB_META;
  titleHubOpen: boolean;
  setTitleHubOpen: (open: boolean) => void;
  timerSnapshot: TimerSnapshot | null;
  setTimerSnapshot: (patch: Partial<TimerSnapshot>) => void;
  celebrationEvent: CelebrationEvent | null;
  closeCelebration: () => void;
  enqueueCelebration: (event: CelebrationEvent) => void;
  /** @deprecated use celebrationEvent */
  milestoneCelebration: import("../types").MilestoneRecord | null;
  /** @deprecated use closeCelebration */
  closeMilestoneCelebration: () => void;
  equipTheme: (id: string, surface?: import("../types").ThemeSurface) => void;
  applyFocusProfile: (profileId: string) => void;
  saveFocusProfile: (name?: string) => boolean;
  deleteFocusProfile: (id: string) => void;
  maxFocusProfiles: () => number;
  claimDailyQuest: () => boolean;
  getDailyQuest: () => ReturnType<typeof pickDailyQuest> | null;
  addToWishlist: (id: string, kind: WishlistEntry["kind"], targetPrice: number) => void;
  removeFromWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  updateOtherUser: (email: string, patch: Partial<UserData>) => boolean;
  createUserAsOwner: (input: {
    email: string;
    username: string;
    password: string;
    role?: Role;
    vip?: boolean;
    honour?: boolean;
  }) => boolean;
  resetUserAsOwner: (email: string) => boolean;
  patchStore: (patch: OwnerStorePatch) => boolean;
  impersonateUser: (email: string) => boolean;
  stopImpersonating: () => void;
  pushToUserInbox: (email: string, message: string) => boolean;
  massBroadcastInbox: (message: string) => boolean;
  exportStoreBackup: () => void;
  importStoreBackup: (raw: string) => boolean;
  maintenance: MaintenanceConfig & { remoteOk: boolean; checking: boolean };
  setMaintenanceMode: (on: boolean, message?: string) => Promise<boolean>;
  refreshMaintenance: () => Promise<void>;
  whatsNewOpen: boolean;
  closeWhatsNew: () => void;
  isBetaShell: boolean;
  enterBetaShell: () => void;
  leaveBetaShell: () => void;
  upsertFocusProfile: (profile: FocusProfile) => boolean;
  addRoutine: (name: string) => string | null;
  updateRoutine: (id: string, patch: Partial<Pick<StudyRoutine, "name" | "steps">>) => void;
  deleteRoutine: (id: string) => void;
  startRoutine: (routineId: string) => void;
  advanceRoutineStep: () => void;
  cancelActiveRoutine: () => void;
  addGoal: (title: string) => string | null;
  updateGoal: (id: string, patch: Partial<Pick<SemesterGoal, "title" | "notes" | "targetDate" | "milestones">>) => void;
  deleteGoal: (id: string) => void;
};

const StudyGrindContext = createContext<Ctx | null>(null);

export function useStudyGrind() {
  const c = useContext(StudyGrindContext);
  if (!c) throw new Error("useStudyGrind outside provider");
  return c;
}

const defaultStore = (): AppStore => migrateStore({});

export function StudyGrindProvider({ children }: { children: ReactNode }) {
  const loadErrorRef = useRef(false);
  const [store, setStore] = useState<AppStore>(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? migrateStore(JSON.parse(raw)) : defaultStore();
    } catch {
      loadErrorRef.current = true;
      return defaultStore();
    }
  });
  const [tab, setTab] = useState<Tab>("home");
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [auth, setAuth] = useState({ username: "", email: "", password: "" });
  const [spinResult, setSpinResult] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [gameState, setGameState] = useState<GameState>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameRound, setGameRound] = useState(0);
  const [gameMessage, setGameMessage] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [titleHubOpen, setTitleHubOpen] = useState(false);
  const [timerSnapshot, setTimerSnapshotState] = useState<TimerSnapshot | null>(null);
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEvent | null>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const celebrationQueueRef = useRef<CelebrationEvent[]>([]);
  const celebrationShowingRef = useRef(false);
  const [maintenance, setMaintenanceState] = useState<MaintenanceConfig & { remoteOk: boolean; checking: boolean }>(() => ({
    ...DEFAULT_APP_CONFIG.maintenance,
    remoteOk: false,
    checking: true,
  }));
  const userRef = useRef<UserData | undefined>(undefined);
  const [rewardPopup, setRewardPopup] = useState({
    open: false,
    title: "",
    subtitle: "",
    points: 0,
  });

  useEffect(() => {
    if (loadErrorRef.current) setToast("Save data corrupted — starting fresh local store.");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORE_KEY || !e.newValue) return;
      try {
        setStore(migrateStore(JSON.parse(e.newValue)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const user = store.users[store.current];
  userRef.current = user;

  const setTimerSnapshot = useCallback((patch: Partial<TimerSnapshot>) => {
    setTimerSnapshotState((prev) => ({
      running: false,
      phase: "focus",
      secondsLeft: 0,
      focusMin: 25,
      collapsed: false,
      ...prev,
      ...patch,
    }));
  }, []);

  const enqueueCelebration = useCallback((event: CelebrationEvent) => {
    const wasIdle = !celebrationShowingRef.current;
    celebrationQueueRef.current.push(event);
    if (wasIdle) {
      const first = celebrationQueueRef.current.shift();
      if (first) {
        celebrationShowingRef.current = true;
        setCelebrationEvent(first);
      }
    }
  }, []);

  const closeCelebration = useCallback(() => {
    const next = celebrationQueueRef.current.shift();
    if (next) {
      setCelebrationEvent(next);
    } else {
      celebrationShowingRef.current = false;
      setCelebrationEvent(null);
    }
  }, []);

  const showReward = (title: string, subtitle?: string, points?: number) => {
    hapticSuccess();
    setRewardPopup({ open: true, title, subtitle: subtitle ?? "", points: points ?? 0 });
  };

  const updateUser = useCallback(
    (next: UserData) => {
      const prev = userRef.current ?? next;
      let u = ensureCurrentWeek(next);
      const questDay = todayKey();
      if (u.dailyQuestDate !== questDay) {
        const q = pickDailyQuest(u.email, questDay);
        u = { ...u, dailyQuestDate: questDay, dailyQuestId: q.id, dailyQuestClaimed: false };
      }
      u = checkWeeklyTitleUnlocks(u, (unlock) => {
        enqueueCelebration({ kind: "weeklyTitle", label: unlock.label, threshold: unlock.threshold });
        setToast(`Unlocked title: ${unlock.label} (${unlock.threshold} min this week)`);
      });
      const trophyEvents = detectNewTrophies(prev, u);
      u = applyTrophyUnlocks(u, trophyEvents);
      for (const t of trophyEvents) {
        enqueueCelebration({ kind: "trophy", trophy: t });
        if (t.rewardGranted) setToast(`Trophy reward: ${t.rewardGranted}`);
      }
      const events = detectMilestones(prev, u);
      u = applyMilestones(u, events);
      if (events.length) {
        const now = new Date().toISOString();
        for (const e of events) {
          enqueueCelebration({ kind: "milestone", record: { ...e, unlockedAt: now } });
        }
      }
      setStore((p) => ({ ...p, users: { ...p.users, [u.email]: u } }));
    },
    [enqueueCelebration],
  );

  const logAction = useCallback(
    (action: string, target: string, detail = "") => {
      if (!user) return;
      setStore((p) => ({
        ...p,
        auditLog: [
          {
            id: crypto.randomUUID(),
            actor: user.email,
            actorRole: user.role,
            action,
            target,
            detail,
            timestamp: new Date().toISOString(),
          },
          ...(p.auditLog || []),
        ].slice(0, 200),
      }));
    },
    [user],
  );

  // ----- Owner admin helpers -----
  const requireOwner = useCallback((): boolean => {
    if (user?.role === "owner") return true;
    setToast("Owner only.");
    return false;
  }, [user?.role]);

  const updateOtherUser = useCallback(
    (email: string, patch: Partial<UserData>): boolean => {
      if (!requireOwner()) return false;
      let ok = false;
      setStore((p) => {
        const existing = p.users[email];
        if (!existing) return p;
        ok = true;
        const next: UserData = { ...existing, ...patch, email: existing.email };
        // Owner account can never be demoted or restricted.
        if (email === OWNER_EMAIL) {
          next.role = "owner";
          next.banned = false;
          next.muted = false;
          next.suspendedUntil = "";
        }
        return { ...p, users: { ...p.users, [email]: next } };
      });
      logAction("owner-edit-user", email, Object.keys(patch).join(","));
      return ok;
    },
    [requireOwner, logAction],
  );

  const createUserAsOwner = useCallback(
    (input: { email: string; username: string; password: string; role?: Role; vip?: boolean; honour?: boolean }): boolean => {
      if (!requireOwner()) return false;
      const email = input.email.trim().toLowerCase();
      if (!email || !input.username.trim() || !input.password) {
        setToast("Fill email, username and password.");
        return false;
      }
      if (email === OWNER_EMAIL || store.users[email]) {
        setToast("That email already exists.");
        return false;
      }
      const created: UserData = {
        ...defaultUser(email, input.password, input.username.trim()),
        role: input.role ?? "user",
        vipAccess: Boolean(input.vip) || input.role === "vip",
        honoraryAccess: Boolean(input.honour),
      };
      setStore((p) => ({ ...p, users: { ...p.users, [email]: created } }));
      logAction("owner-create-user", email, created.role);
      setToast(`Created ${created.username}.`);
      void ensureSupabaseUser(email, input.password, { username: created.username, role: created.role });
      return true;
    },
    [requireOwner, store.users, logAction],
  );

  const resetUserAsOwner = useCallback(
    (email: string): boolean => {
      if (!requireOwner()) return false;
      let ok = false;
      setStore((p) => {
        const existing = p.users[email];
        if (!existing) return p;
        ok = true;
        const preserveOwnerRole = email === OWNER_EMAIL;
        const reset = resetUserAccount(existing, { preserveOwnerRole });
        return { ...p, users: { ...p.users, [email]: reset } };
      });
      if (ok) {
        logAction("owner-reset-user", email);
        setToast(
          email === user?.email
            ? "Your account was reset — fresh start (owner role kept)."
            : `Account reset: ${email}`,
        );
      }
      return ok;
    },
    [requireOwner, logAction, user?.email],
  );

  const patchStore = useCallback(
    (patch: OwnerStorePatch): boolean => {
      if (!requireOwner()) return false;
      setStore((p) => ({ ...p, ...patch }));
      logAction("owner-patch-store", Object.keys(patch).join(","));
      return true;
    },
    [requireOwner, logAction],
  );

  // ---- Remote maintenance mode (Supabase app_config) ----
  useEffect(() => {
    const unsub = subscribeAppConfig((cfg, fromRemote) => {
      setMaintenanceState((prev) => ({
        ...cfg.maintenance,
        remoteOk: fromRemote || prev.remoteOk,
        checking: false,
      }));
      // Mirror into the local store so offline devices keep the last known state.
      setStore((p) => (p.maintenanceMode === cfg.maintenance.on ? p : { ...p, maintenanceMode: cfg.maintenance.on }));
    });
    // If Supabase never answers, stop showing the "checking" state after 4s and use local cache.
    const t = window.setTimeout(() => setMaintenanceState((prev) => (prev.checking ? { ...prev, checking: false } : prev)), 4000);
    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);

  const refreshMaintenance = useCallback(async () => {
    const res = await fetchAppConfig();
    setMaintenanceState((prev) => ({ ...res.config.maintenance, remoteOk: res.ok || prev.remoteOk, checking: false }));
    if (res.ok) setStore((p) => (p.maintenanceMode === res.config.maintenance.on ? p : { ...p, maintenanceMode: res.config.maintenance.on }));
  }, []);

  const setMaintenanceMode = useCallback(
    async (on: boolean, message = ""): Promise<boolean> => {
      if (!requireOwner()) return false;
      const res = await setRemoteMaintenanceMode(on, message);
      // Always update local so the owner's own device reflects the change immediately.
      setStore((p) => ({ ...p, maintenanceMode: on }));
      setMaintenanceState((prev) => ({ ...prev, on, message, updatedAt: new Date().toISOString(), remoteOk: res.ok || prev.remoteOk, checking: false }));
      logAction("owner-maintenance", `${on ? "on" : "off"}${res.ok ? "" : " (local only: " + res.message + ")"}`);
      if (!res.ok) setToast(`Saved locally only — Supabase: ${res.message}`);
      return res.ok;
    },
    [requireOwner, logAction],
  );

  const impersonateUser = useCallback(
    (email: string): boolean => {
      if (!requireOwner()) return false;
      if (!store.users[email] || email === store.current) return false;
      const from = store.impersonatingFrom || store.current;
      setStore((p) => ({ ...p, current: email, impersonatingFrom: from }));
      logAction("owner-impersonate", email);
      setTab("home");
      setToast(`Viewing as ${store.users[email].username}.`);
      return true;
    },
    [requireOwner, store.users, store.current, store.impersonatingFrom, logAction],
  );

  const stopImpersonating = useCallback(() => {
    setStore((p) => {
      if (!p.impersonatingFrom || !p.users[p.impersonatingFrom]) return p;
      return { ...p, current: p.impersonatingFrom, impersonatingFrom: "" };
    });
    setTab("ownerSettings");
    setToast("Back to owner account.");
  }, []);

  const pushToUserInbox = useCallback(
    (email: string, message: string): boolean => {
      const text = message.trim();
      if (!text) return false;
      let ok = false;
      setStore((p) => {
        const target = p.users[email];
        if (!target) return p;
        ok = true;
        return { ...p, users: { ...p.users, [email]: { ...target, inbox: [text, ...target.inbox].slice(0, 50) } } };
      });
      return ok;
    },
    [],
  );

  const massBroadcastInbox = useCallback(
    (message: string): boolean => {
      if (!requireOwner()) return false;
      const text = message.trim();
      if (!text) return false;
      setStore((p) => {
        const users: Record<string, UserData> = {};
        for (const [k, u] of Object.entries(p.users)) {
          users[k] = k === OWNER_EMAIL ? u : { ...u, inbox: [text, ...u.inbox].slice(0, 50) };
        }
        return { ...p, users };
      });
      logAction("owner-broadcast-inbox", "all", text.slice(0, 60));
      setToast("Broadcast sent to every inbox.");
      return true;
    },
    [requireOwner, logAction],
  );

  const exportStoreBackup = useCallback(() => {
    if (!requireOwner()) return;
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studygrind-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logAction("owner-export-backup", "store");
    setToast("Backup downloaded.");
  }, [requireOwner, store, logAction]);

  const importStoreBackup = useCallback(
    (raw: string): boolean => {
      if (!requireOwner()) return false;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !parsed.users) {
          setToast("Not a StudyGrind backup.");
          return false;
        }
        const migrated = migrateStore(parsed);
        setStore({ ...migrated, current: OWNER_EMAIL, impersonatingFrom: "" });
        setToast("Backup restored.");
        return true;
      } catch {
        setToast("Backup file is not valid JSON.");
        return false;
      }
    },
    [requireOwner],
  );

  const hasUnlock = useCallback(
    (key: string) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      if (user.honoraryAccess && key === UNLOCK_IDS.mentorHub) return true;
      return Boolean(user.unlocks[key]);
    },
    [user],
  );

  const betaShellActive = userInBetaShell(user, store);

  const goTab = useCallback(
    (next: Tab, opts?: { closeMenu?: boolean }) => {
      const u = store.users[store.current];
      const inBeta = userInBetaShell(u, store);
      if (!inBeta && isBetaFeatureTab(next)) {
        setToast("Enter beta area from Settings.");
        setTab("settings");
        if (opts?.closeMenu) setMenuOpen(false);
        return;
      }
      if (u?.focusLockOn && timerRunning && u.lockedTabs.includes(next)) {
        setToast("Locked — turn off Focus Lock or end your session.");
        return;
      }
      if (next === "focusLab" && !hasUnlock(UNLOCK_IDS.focusLab)) {
        setToast(`Unlock Focus Lab in the shop (${shopDisplayPrice(FOCUS_LAB_PRICE).toLocaleString()} pts).`);
        setTab("shop");
        if (opts?.closeMenu) setMenuOpen(false);
        return;
      }
      if (next === "themeStudio" && !hasUnlock(UNLOCK_IDS.colourMaker)) {
        setToast(`Unlock Colour Studio in the shop (${shopDisplayPrice(COLOUR_MAKER_PRICE).toLocaleString()} pts).`);
        setTab("shop");
        if (opts?.closeMenu) setMenuOpen(false);
        return;
      }
      if (next === "focusPresetLab" && !hasUnlock(UNLOCK_IDS.presetLab)) {
        setToast(`Unlock Preset Lab in the shop (${economyShopPrice(PRESET_LAB_PRICE, UNLOCK_IDS.presetLab).toLocaleString()} pts).`);
        setTab("shop");
        if (opts?.closeMenu) setMenuOpen(false);
        return;
      }
      if (next === "ownerSettings" && user?.role !== "owner") {
        setToast("Owner only.");
        if (opts?.closeMenu) setMenuOpen(false);
        return;
      }
      setTab(next);
      if (opts?.closeMenu) setMenuOpen(false);
    },
    [store.current, store.users, store.betaProgramEnabled, timerRunning, hasUnlock, user?.role],
  );

  const enterBetaShell = useCallback(() => {
    setStore((p) => {
      const u = p.users[p.current];
      if (!u) return p;
      if (!canEnterBetaProgram(u, p)) {
        setToast(
          u.role === "owner"
            ? "Could not enter beta — sign in again."
            : "No beta access yet. Ask the owner to enable Beta program access for your account.",
        );
        return p;
      }
      const next = { ...u, betaShellActive: true };
      setTab("home");
      setMenuOpen(false);
      setToast("Beta area on — new pages at the bottom of the app.");
      return { ...p, users: { ...p.users, [u.email]: next } };
    });
  }, [setStore, setTab, setMenuOpen, setToast]);

  const leaveBetaShell = useCallback(() => {
    if (!user) return;
    updateUser({ ...user, betaShellActive: false, activeRoutine: null });
    setTab("home");
    setMenuOpen(false);
    setToast("Back to the full app.");
  }, [user, updateUser]);

  useEffect(() => {
    if (!user?.betaShellActive) return;
    if (!canEnterBetaProgram(user, store)) {
      updateUser({ ...user, betaShellActive: false, activeRoutine: null });
      setTab("home");
      setToast("Beta access ended — returned to main app.");
    }
  }, [user, store, updateUser, setTab, setToast]);

  useEffect(() => {
    document.body.dataset.appMode = betaShellActive ? "beta" : "main";
    return () => {
      document.body.dataset.appMode = "main";
    };
  }, [betaShellActive]);

  const equippedThemeId = user?.equippedTheme ?? "green";
  const activeThemeId = previewTheme ?? equippedThemeId;
  useEffect(() => {
    const userDark = user?.darkMode ?? true;
    const dark = store.forceMode === "dark" ? true : store.forceMode === "light" ? false : userDark;
    document.body.dataset.mode = dark ? "dark" : "light";
    const surface = user ? effectiveLiquidSurface(user) : "classic";
    const applied = applyThemeToDocument(activeThemeId, store.customThemes, user?.savedCustomThemes, "theme", surface);
    applyThemeSurfaceToBody(surface);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0c1411" : applied.color);
    void applyStatusBarStyle(dark, dark ? "#0c1411" : applied.color);
  }, [
    user?.darkMode,
    activeThemeId,
    store.forceMode,
    store.customThemes,
    user?.savedCustomThemes,
    user?.equippedThemeSurface,
    user?.accessibility?.liquidUiEnabled,
    user?.equippedTheme,
  ]);

  // Mirror the haptics preference into the stateless helper module.
  useEffect(() => {
    const level = user?.accessibility?.hapticLevel;
    const enabled = level !== "off" && (user?.hapticsEnabled ?? true);
    setHapticsEnabled(enabled);
  }, [user?.hapticsEnabled, user?.accessibility?.hapticLevel]);

  useEffect(() => {
    if (user?.accessibility) applyAccessibilityToBody(user.accessibility);
  }, [user?.accessibility]);

  useEffect(() => {
    if (!user) return;
    if (user.seenReleaseVersion !== APP_RELEASE_VERSION) {
      setWhatsNewOpen(true);
    }
  }, [user?.email, user?.seenReleaseVersion]);

  // Android home-screen widget: debounce-write today's stats whenever they change.
  const widgetTodayKey = todayKey();
  const widgetTodayMins = user?.weeklyHistory?.[widgetTodayKey] ?? 0;
  useEffect(() => {
    if (!isAndroid || !user) return;
    const t = window.setTimeout(() => {
      const u = userRef.current;
      const snap = timerSnapshot;
      if (u)
        void syncWidgetData(
          u,
          snap?.running ? { running: true, secondsLeft: snap.secondsLeft ?? 0 } : null,
        );
    }, 2000);
    return () => window.clearTimeout(t);
  }, [user?.email, user?.focusPoints, user?.streak, user?.username, widgetTodayMins, user?.tasks, timerSnapshot?.running, timerSnapshot?.secondsLeft]);

  const studyRankLabel = user ? studyRankFromUser(user).label : "Starter";
  const displayTitle = useMemo(() => {
    if (!user) return "";
    if (user.equippedTitleId === CUSTOM_NAME_TITLE_ID && user.customRankName.trim()) {
      return user.customRankName.trim();
    }
    const weekly = user.weeklyTitleInventory?.find((t) => t.id === user.equippedTitleId);
    if (weekly) return weekly.label;
    const t = titleById(user.equippedTitleId);
    return t?.label ?? STARTER_TITLE.label;
  }, [user]);

  const closeReward = () => setRewardPopup((p) => ({ ...p, open: false }));

  useEffect(() => {
    if (!user) return;
    const active = recordDailyActive(user);
    const weekKey = getWeekKey();
    const needsWeek = !user.weeklyRecords?.[weekKey];
    if (
      active.lastActiveDate !== user.lastActiveDate ||
      active.loginStreak !== user.loginStreak ||
      needsWeek
    ) {
      setStore((p) => ({
        ...p,
        users: { ...p.users, [active.email]: ensureCurrentWeek(active) },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on account switch only
  }, [store.current]);

  const grantMiniGamePoints = useCallback(
    (u: UserData, wish: number): UserData => {
      const today = new Date().toDateString();
      let earnedToday = u.gamePointsEarnedToday;
      if (u.gamePointsEarnedDate !== today) earnedToday = 0;
      const scaledWish = scaleRewardPoints(wish, store);
      const room = Math.max(0, GAME_POINTS_DAILY_CAP - earnedToday);
      const grant = Math.min(scaledWish, room);
      if (scaledWish > 0 && grant === 0) setToast(`Mini-game daily cap (${GAME_POINTS_DAILY_CAP} pts) reached.`);
      const stats = { ...u.miniGameStats };
      return {
        ...u,
        focusPoints: u.focusPoints + grant,
        totalPointsEarned: u.totalPointsEarned + grant,
        gamePointsEarnedDate: today,
        gamePointsEarnedToday: earnedToday + grant,
        miniGameStats: stats,
      };
    },
    [store],
  );

  const purchaseShopItem = useCallback(
    (unlockKey: string, price: number, name: string): boolean => {
      if (!user) return false;
      if (hasUnlock(unlockKey) && unlockKey !== UNLOCK_IDS.customName) {
        setToast("Already unlocked.");
        return false;
      }
      const final = economyShopPrice(price, unlockKey, user.discount);
      const useCredit = (user.trophyShopCredits ?? 0) > 0 && canRedeemTrophyCredit({ price, unlockKey });
      if (!useCredit && user.focusPoints < final) {
        setToast("Not enough focus points.");
        return false;
      }
      const unlocks = { ...user.unlocks, [unlockKey]: true };
      let next: UserData = {
        ...user,
        focusPoints: useCredit ? user.focusPoints : user.focusPoints - final,
        discount: useCredit ? user.discount : 0,
        trophyShopCredits: useCredit ? user.trophyShopCredits - 1 : user.trophyShopCredits,
        unlocks,
      };
      if (unlockKey === UNLOCK_IDS.mentorHub) next.mentorHubUnlocked = true;
      if (unlockKey === UNLOCK_IDS.customName) {
        next.customTitleUnlocked = true;
        next.ownedTitles = Array.from(new Set([...next.ownedTitles, CUSTOM_NAME_TITLE_ID]));
      }
      if (unlockKey.startsWith("game-") || unlockKey === MEMORY_SPRINT_ID) {
        const gid = unlockKey.startsWith("game-") ? unlockKey.replace("game-", "") : unlockKey;
        next.gamesUnlocked = Array.from(new Set([...next.gamesUnlocked, gid]));
      }
      updateUser(next);
      logAction("shop-purchase", unlockKey, useCredit ? "trophy-credit" : String(final));
      showReward(`${name} unlocked!`, useCredit ? "Used trophy reward credit" : undefined, undefined);
      if (unlockKey === UNLOCK_IDS.focusLab) setToast("Focus Lab unlocked — open it from the menu.");
      else if (unlockKey === UNLOCK_IDS.colourMaker) setToast("Theme Studio unlocked — open it from the menu.");
      else if (unlockKey === UNLOCK_IDS.presetLab) setToast("Preset Lab unlocked — open it from the menu.");
      else if (useCredit) setToast(`${name} unlocked with a free trophy credit!`);
      else setToast(`${name} unlocked for ${final} pts.`);
      return true;
    },
    [user, hasUnlock, updateUser, logAction],
  );

  const buyTheme = (id: ThemeId, surface: import("../types").ThemeSurface) => {
    if (!user) return;
    const base = themes[id].price;
    const hasClassic = ownsThemeClassic(user, id);
    const hasLiquid = ownsThemeLiquid(user, id);
    const rawPrice = themePurchasePrice(base, surface, hasClassic, hasLiquid);
    const final = economyShopPriceScaled(rawPrice, `theme-${id}-${surface}`, user.discount);
    const useCredit =
      surface === "classic" && (user.trophyShopCredits ?? 0) > 0 && canRedeemTrophyCreditForTheme(id);
    if (surface === "classic" && ownsThemeClassic(user, id)) return setToast("You already own the normal version.");
    if (surface === "liquid" && ownsThemeLiquid(user, id)) return setToast("You already own the Liquid UI version.");
    if (!useCredit && user.focusPoints < final) return setToast("Not enough focus points.");
    let themeVariantsOwned = grantThemeSurface(user.themeVariantsOwned ?? {}, id, surface);
    const ownedThemes = user.ownedThemes.includes(id) ? user.ownedThemes : [...user.ownedThemes, id];
    updateUser({
      ...user,
      focusPoints: useCredit ? user.focusPoints : user.focusPoints - final,
      ownedThemes,
      themeVariantsOwned,
      equippedTheme: id,
      equippedThemeSurface: surface,
      discount: useCredit ? user.discount : 0,
      trophyShopCredits: useCredit ? user.trophyShopCredits - 1 : user.trophyShopCredits,
    });
    enqueueCelebration({
      kind: "points",
      title: `${themes[id].name} purchased!`,
      subtitle: useCredit ? "Unlocked with trophy credit" : `${surface === "liquid" ? "Liquid UI" : "Normal"} equipped`,
    });
    setToast(
      useCredit
        ? `${themes[id].name} unlocked with a free trophy credit!`
        : `${themes[id].name} (${surface === "liquid" ? "Liquid UI" : "Normal"}) for ${final.toLocaleString()} points.`,
    );
  };

  const buyBooster = (b: Booster) => {
    if (!user) return;
    const final = applyDiscount(scalePrice(b.price), user.discount);
    if (user.focusPoints < final) return setToast("Not enough focus points.");
    let next: UserData = { ...user, focusPoints: user.focusPoints - final, discount: 0 };
    let resultText = "";
    switch (b.effect) {
      case "shield":
        next.streakShields = user.streakShields + 1;
        resultText = "+1 Streak Shield added.";
        break;
      case "boost12":
        next.tempBoostMultiplier = 1.5;
        next.tempBoostExpires = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        resultText = "1.5x boost active (shop/games only).";
        break;
      case "boost24":
        next.tempBoostMultiplier = 2;
        next.tempBoostExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        resultText = "2x boost active (shop/games only).";
        break;
      case "discount20":
        next.discount = 20;
        resultText = "20% discount queued.";
        break;
      case "gameUnlock": {
        const all = [MEMORY_SPRINT_ID];
        const locked = all.filter((g) => !user.gamesUnlocked.includes(g));
        if (!locked.length) return setToast("All mini-games unlocked.");
        const pick = locked[Math.floor(Math.random() * locked.length)];
        next.gamesUnlocked = [...user.gamesUnlocked, pick];
        resultText = `Unlocked: ${pick}.`;
        break;
      }
      case "lootbox": {
        const rolls = [
          () => ({ ...next, focusPoints: next.focusPoints + 1500 }),
          () => ({ ...next, discount: 25 }),
          () => ({ ...next, streakShields: next.streakShields + 1 }),
          () => {
            const tid = "forest" as ThemeId;
            const variants = grantThemeSurface(next.themeVariantsOwned ?? {}, tid, "classic");
            return {
              ...next,
              ownedThemes: Array.from(new Set([...next.ownedThemes, tid])),
              themeVariantsOwned: variants,
            };
          },
        ];
        next = rolls[Math.floor(Math.random() * rolls.length)]();
        resultText = "Mystery Box opened!";
        break;
      }
      case "noteKit": {
        const now = new Date().toISOString();
        const starters = [
          "Spaced repetition: review at 1d, 3d, 7d.",
          "Tag every task to track subjects.",
          "End sessions with a one-line reflection.",
        ].map((body, i) => ({
          id: crypto.randomUUID(),
          title: `Starter ${i + 1}`,
          body,
          folderId: user.noteFolders[0]?.id ?? "general",
          tags: ["starter"],
          pinned: false,
          createdAt: now,
          updatedAt: now,
        }));
        next.notes = [...starters, ...user.notes];
        resultText = "+3 starter notes added.";
        break;
      }
    }
    updateUser(next);
    showReward(resultText);
    setToast(resultText);
  };

  const buyRotatingTheme = (themeId: string, surface: import("../types").ThemeSurface) => {
    if (!user) return;
    const meta = rotatingThemeById(themeId);
    if (!meta) return setToast("Theme not found.");
    const hasClassic = ownsRotatingClassic(user, themeId);
    const hasLiquid = ownsRotatingLiquid(user, themeId);
    if (surface === "classic" && hasClassic) return setToast("You already own the normal version.");
    if (surface === "liquid" && hasLiquid) return setToast("You already own the liquid version.");
    const rawPrice = themePurchasePrice(meta.price, surface, hasClassic, hasLiquid);
    const final = economyShopPriceScaled(rawPrice, `rot-theme-${themeId}-${surface}`, user.discount);
    if (user.focusPoints < final) return setToast("Not enough focus points.");
    let rotatingThemeVariantsOwned = grantRotatingSurface(user.rotatingThemeVariantsOwned ?? {}, themeId, surface);
    const ownedRotatingThemeIds = user.ownedRotatingThemeIds.includes(themeId)
      ? user.ownedRotatingThemeIds
      : [...user.ownedRotatingThemeIds, themeId];
    updateUser({
      ...user,
      focusPoints: user.focusPoints - final,
      ownedRotatingThemeIds,
      rotatingThemeVariantsOwned,
      equippedTheme: themeId,
      equippedThemeSurface: surface,
      discount: 0,
    });
    showReward(`${meta.name} is yours forever!`);
    setToast(`${meta.name} (${surface === "liquid" ? "Liquid" : "Normal"}) for ${final.toLocaleString()} pts.`);
  };

  const buyTitle = (titleId: string, price: number) => {
    const key = titleId.startsWith("title-") ? titleId : `title-${titleId}`;
    if (!user) return;
    if (user.ownedTitles.includes(titleId) || user.ownedTitles.includes(key)) {
      setToast("Already owned.");
      return;
    }
    const final = economyShopPrice(price, `title-${titleId}`, user.discount);
    const useCredit = (user.trophyShopCredits ?? 0) > 0 && canRedeemTrophyCreditForTitle(titleId, price);
    if (!useCredit && user.focusPoints < final) return setToast("Not enough points.");
    updateUser({
      ...user,
      focusPoints: useCredit ? user.focusPoints : user.focusPoints - final,
      ownedTitles: [...user.ownedTitles, titleId],
      equippedTitleId: titleId,
      discount: useCredit ? user.discount : 0,
      trophyShopCredits: useCredit ? user.trophyShopCredits - 1 : user.trophyShopCredits,
      unlocks: { ...user.unlocks, [key]: true },
    });
    showReward("Title unlocked & equipped!", useCredit ? "Used trophy reward credit" : undefined);
  };

  const sellShopItem = useCallback(
    (unlockKey: string): boolean => {
      if (!user) return false;
      const item = ALL_SHOP_ITEMS.find((i) => i.unlockKey === unlockKey || i.id === unlockKey);
      if (!item || item.free || item.ownerOnly) {
        setToast("Cannot sell this item.");
        return false;
      }
      if (!hasUnlock(unlockKey)) {
        setToast("You do not own this.");
        return false;
      }
      const refund = economyMarketPrice(item.price, unlockKey);
      const unlocks = { ...user.unlocks };
      delete unlocks[unlockKey];
      let next: UserData = {
        ...user,
        focusPoints: user.focusPoints + refund,
        unlocks,
      };
      if (unlockKey === UNLOCK_IDS.customName) {
        next.customTitleUnlocked = false;
        next.ownedTitles = next.ownedTitles.filter((t) => t !== CUSTOM_NAME_TITLE_ID);
        if (next.equippedTitleId === CUSTOM_NAME_TITLE_ID) next.equippedTitleId = STARTER_TITLE.id;
      }
      if (unlockKey === UNLOCK_IDS.mentorHub) next.mentorHubUnlocked = false;
      if (unlockKey.startsWith("game-") || unlockKey === MEMORY_SPRINT_ID) {
        const gid = unlockKey.startsWith("game-") ? unlockKey.replace("game-", "") : unlockKey;
        next.gamesUnlocked = next.gamesUnlocked.filter((g) => g !== gid);
      }
      const sound = next.timerEndSoundId;
      if (unlockKey.startsWith("sound-") && sound.includes(unlockKey.replace("sound-", ""))) {
        next.timerEndSoundId = "default";
      }
      updateUser(next);
      logAction("shop-sell", unlockKey, String(refund));
      setToast(`Sold for ${refund.toLocaleString()} pts (today's market).`);
      return true;
    },
    [user, hasUnlock, updateUser, logAction, setToast],
  );

  const sellTitle = useCallback(
    (titleId: string): boolean => {
      if (!user) return false;
      const meta = PURCHASABLE_TITLES.find((t) => t.id === titleId);
      if (!meta) {
        setToast("Cannot sell this title.");
        return false;
      }
      const key = `title-${titleId}`;
      if (!user.ownedTitles.includes(titleId) && !hasUnlock(key)) {
        setToast("You do not own this title.");
        return false;
      }
      const refund = economyMarketPrice(meta.price, key);
      const unlocks = { ...user.unlocks };
      delete unlocks[key];
      let next: UserData = {
        ...user,
        focusPoints: user.focusPoints + refund,
        ownedTitles: user.ownedTitles.filter((t) => t !== titleId),
        unlocks,
      };
      if (next.equippedTitleId === titleId) next.equippedTitleId = STARTER_TITLE.id;
      updateUser(next);
      logAction("shop-sell", key, String(refund));
      setToast(`Sold "${meta.label}" for ${refund.toLocaleString()} pts.`);
      return true;
    },
    [user, hasUnlock, updateUser, logAction, setToast],
  );

  const sellCustomName = useCallback((): boolean => {
    if (!user) return false;
    if (!hasUnlock(UNLOCK_IDS.customName) && !user.customTitleUnlocked) {
      setToast("You do not own Custom Name.");
      return false;
    }
    return sellShopItem(UNLOCK_IDS.customName);
  }, [user, hasUnlock, sellShopItem, setToast]);

  const sellThemeSurface = useCallback(
    (themeId: string, surface: import("../types").ThemeSurface, rotating = false): boolean => {
      if (!user) return false;
      if (themeId === "green") {
        setToast("Cannot sell the default theme.");
        return false;
      }
      const base = rotating ? rotatingThemeById(themeId)?.price ?? 0 : themes[themeId as ThemeId]?.price ?? 0;
      if (base <= 0) {
        setToast("Cannot sell this theme.");
        return false;
      }
      const hasClassic = rotating ? ownsRotatingClassic(user, themeId) : ownsThemeClassic(user, themeId as ThemeId);
      const hasLiquid = rotating ? ownsRotatingLiquid(user, themeId) : ownsThemeLiquid(user, themeId as ThemeId);
      if (surface === "classic" && !hasClassic) {
        setToast("You do not own this variant.");
        return false;
      }
      if (surface === "liquid" && !hasLiquid) {
        setToast("You do not own this variant.");
        return false;
      }
      const rawPrice = themePurchasePrice(base, surface, hasClassic, hasLiquid);
      const itemKey = rotating ? `rot-theme-${themeId}-${surface}` : `theme-${themeId}-${surface}`;
      const refund = economyMarketPriceScaled(rawPrice, itemKey);
      let next: UserData = { ...user, focusPoints: user.focusPoints + refund };
      if (rotating) {
        next.rotatingThemeVariantsOwned = revokeRotatingSurface(user.rotatingThemeVariantsOwned ?? {}, themeId, surface);
        const v = next.rotatingThemeVariantsOwned[themeId];
        if (!v?.classic && !v?.liquid) {
          next.ownedRotatingThemeIds = next.ownedRotatingThemeIds.filter((id) => id !== themeId);
        }
      } else {
        const tid = themeId as ThemeId;
        next.themeVariantsOwned = revokeThemeSurface(user.themeVariantsOwned ?? {}, tid, surface);
        const v = next.themeVariantsOwned[tid];
        if (!v?.classic && !v?.liquid) {
          next.ownedThemes = next.ownedThemes.filter((id) => id !== tid);
        }
      }
      if (next.equippedTheme === themeId) {
        const stillClassic = rotating ? ownsRotatingClassic(next, themeId) : ownsThemeClassic(next, themeId as ThemeId);
        const stillLiquid = rotating ? ownsRotatingLiquid(next, themeId) : ownsThemeLiquid(next, themeId as ThemeId);
        if (!stillClassic && !stillLiquid) {
          next.equippedTheme = "green";
          next.equippedThemeSurface = "classic";
        } else if (next.equippedThemeSurface === "liquid" && !stillLiquid) {
          next.equippedThemeSurface = "classic";
        } else if (next.equippedThemeSurface !== "liquid" && !stillClassic && stillLiquid) {
          next.equippedThemeSurface = "liquid";
        }
      }
      updateUser(next);
      logAction("shop-sell", itemKey, String(refund));
      setToast(`Sold for ${refund.toLocaleString()} pts (today's market).`);
      return true;
    },
    [user, updateUser, logAction, setToast],
  );

  const equipTitle = (titleId: string) => {
    if (!user) return;
    updateUser({ ...user, equippedTitleId: titleId });
    setToast("Title equipped.");
  };

  const equipTheme = (id: string, surface?: import("../types").ThemeSurface) => {
    if (!user) return;
    const nextSurface = surface ?? (user.equippedTheme === id ? user.equippedThemeSurface ?? "classic" : "classic");
    if (!canEquipThemeSurface(user, id, nextSurface)) {
      return setToast(`Buy the ${nextSurface === "liquid" ? "liquid" : "normal"} version first.`);
    }
    updateUser({ ...user, equippedTheme: id, equippedThemeSurface: nextSurface });
    setToast(`Theme equipped (${nextSurface === "liquid" ? "Liquid" : "Normal"}).`);
  };

  const maxFocusProfiles = () => {
    if (!hasUnlock(UNLOCK_IDS.presetLab)) return 1;
    return hasUnlock("qol-extra-preset") ? 5 : 4;
  };

  const applyFocusProfile = (profileId: string) => {
    if (!user) return;
    const profile = user.focusProfiles.find((p) => p.id === profileId);
    if (!profile) return;
    updateUser({
      ...user,
      activeFocusProfileId: profileId,
      focusDurationMin: profile.focusDurationMin,
      breakDurationMin: profile.breakDurationMin,
      soundscapeId: profile.soundscapeId,
      soundscapeVolume: profile.soundscapeVolume,
      timerEndSoundId: profile.timerEndSoundId,
      focusLockOn: profile.focusLockOn,
      lockedTabs: profile.lockedTabs,
      focusProfiles: user.focusProfiles.map((p) => (p.id === profileId ? profile : p)),
    });
    setToast(`Loaded profile: ${profile.name}`);
  };

  const saveFocusProfile = (name?: string): boolean => {
    if (!user) return false;
    if (!hasUnlock(UNLOCK_IDS.presetLab)) {
      setToast("Unlock Preset Lab in the shop first.");
      return false;
    }
    const cap = maxFocusProfiles();
    const profileName = (name || `Preset ${user.focusProfiles.length + 1}`).trim().slice(0, 24);
    const snapshot: FocusProfile = {
      id: crypto.randomUUID(),
      name: profileName,
      focusDurationMin: user.focusDurationMin,
      breakDurationMin: user.breakDurationMin,
      soundscapeId: user.soundscapeId,
      soundscapeVolume: user.soundscapeVolume,
      timerEndSoundId: user.timerEndSoundId,
      focusLockOn: user.focusLockOn,
      lockedTabs: user.lockedTabs,
    };
    const existing = user.focusProfiles.find((p) => p.id === user.activeFocusProfileId);
    let profiles = user.focusProfiles;
    if (existing && name === undefined) {
      profiles = profiles.map((p) => (p.id === existing.id ? { ...snapshot, id: existing.id, name: existing.name } : p));
    } else if (profiles.length >= cap) {
      setToast(`Profile limit (${cap}). Delete one or unlock an extra slot in the shop.`);
      return false;
    } else {
      profiles = [...profiles, snapshot];
    }
    updateUser({ ...user, focusProfiles: profiles, activeFocusProfileId: existing && name === undefined ? existing.id : snapshot.id });
    setToast(name === undefined && existing ? "Profile updated." : "Profile saved.");
    return true;
  };

  const deleteFocusProfile = (id: string) => {
    if (!user || id === "default") return;
    const profiles = user.focusProfiles.filter((p) => p.id !== id);
    if (profiles.length === user.focusProfiles.length) return;
    updateUser({
      ...user,
      focusProfiles: profiles.length ? profiles : user.focusProfiles,
      activeFocusProfileId: user.activeFocusProfileId === id ? profiles[0]?.id ?? "default" : user.activeFocusProfileId,
    });
    setToast("Profile deleted.");
  };

  const upsertFocusProfile = (profile: FocusProfile): boolean => {
    if (!user) return false;
    if (!hasUnlock(UNLOCK_IDS.presetLab)) {
      setToast("Unlock Preset Lab in the shop first.");
      return false;
    }
    const cap = maxFocusProfiles();
    const exists = user.focusProfiles.some((p) => p.id === profile.id);
    let profiles = user.focusProfiles;
    if (exists) {
      profiles = profiles.map((p) => (p.id === profile.id ? profile : p));
    } else if (profiles.length >= cap) {
      setToast(`Profile limit (${cap}). Delete one first.`);
      return false;
    } else {
      profiles = [...profiles, profile];
    }
    updateUser({ ...user, focusProfiles: profiles, activeFocusProfileId: profile.id });
    setToast(exists ? "Preset updated." : "Preset saved.");
    return true;
  };

  const addRoutine = (name: string): string | null => {
    if (!user) return null;
    const trimmed = name.trim().slice(0, 48);
    if (!trimmed) return null;
    const now = new Date().toISOString();
    const routine: StudyRoutine = {
      id: crypto.randomUUID(),
      name: trimmed,
      steps: [{ id: crypto.randomUUID(), kind: "focus", focusMin: 25, breakMin: 5 }],
      createdAt: now,
      updatedAt: now,
    };
    updateUser({ ...user, studyRoutines: [...(user.studyRoutines ?? []), routine] });
    setToast("Routine created.");
    return routine.id;
  };

  const updateRoutine = (id: string, patch: Partial<Pick<StudyRoutine, "name" | "steps">>) => {
    if (!user) return;
    const routines = (user.studyRoutines ?? []).map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
    );
    updateUser({ ...user, studyRoutines: routines });
  };

  const deleteRoutine = (id: string) => {
    if (!user) return;
    const routines = (user.studyRoutines ?? []).filter((r) => r.id !== id);
    updateUser({
      ...user,
      studyRoutines: routines,
      activeRoutine: user.activeRoutine?.routineId === id ? null : user.activeRoutine,
    });
    setToast("Routine deleted.");
  };

  const startRoutine = (routineId: string) => {
    if (!user) return;
    const routine = (user.studyRoutines ?? []).find((r) => r.id === routineId);
    if (!routine?.steps.length) return setToast("Add at least one step.");
    const step = routine.steps[0];
    const durationPatch =
      step.kind === "focus"
        ? { focusDurationMin: step.focusMin, breakDurationMin: step.breakMin }
        : step.kind === "break"
          ? { breakDurationMin: step.breakMin }
          : {};
    updateUser({
      ...user,
      ...durationPatch,
      activeRoutine: { routineId, stepIndex: 0, startedAt: new Date().toISOString() },
    });
    setTab("timer");
    setToast(`Routine started: ${routine.name}`);
  };

  const advanceRoutineStep = () => {
    if (!user?.activeRoutine) return;
    const routine = (user.studyRoutines ?? []).find((r) => r.id === user.activeRoutine?.routineId);
    if (!routine) {
      updateUser({ ...user, activeRoutine: null });
      return;
    }
    const nextIndex = user.activeRoutine.stepIndex + 1;
    if (nextIndex >= routine.steps.length) {
      updateUser({ ...user, activeRoutine: null });
      setToast("Routine complete!");
      return;
    }
    const step = routine.steps[nextIndex];
    const durationPatch =
      step.kind === "focus"
        ? { focusDurationMin: step.focusMin, breakDurationMin: step.breakMin }
        : step.kind === "break"
          ? { breakDurationMin: step.breakMin }
          : {};
    updateUser({
      ...user,
      ...durationPatch,
      activeRoutine: { ...user.activeRoutine, stepIndex: nextIndex },
    });
    if (step.kind === "prompt") setToast(step.text);
  };

  const cancelActiveRoutine = () => {
    if (!user) return;
    updateUser({ ...user, activeRoutine: null });
    setToast("Routine cancelled.");
  };

  const addGoal = (title: string): string | null => {
    if (!user) return null;
    const trimmed = title.trim().slice(0, 80);
    if (!trimmed) return null;
    const now = new Date().toISOString();
    const goal: SemesterGoal = {
      id: crypto.randomUUID(),
      title: trimmed,
      milestones: [],
      createdAt: now,
      updatedAt: now,
    };
    updateUser({ ...user, semesterGoals: [...(user.semesterGoals ?? []), goal] });
    setToast("Goal added.");
    return goal.id;
  };

  const updateGoal = (id: string, patch: Partial<Pick<SemesterGoal, "title" | "notes" | "targetDate" | "milestones">>) => {
    if (!user) return;
    const goals = (user.semesterGoals ?? []).map((g) =>
      g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g,
    );
    updateUser({ ...user, semesterGoals: goals });
  };

  const deleteGoal = (id: string) => {
    if (!user) return;
    updateUser({ ...user, semesterGoals: (user.semesterGoals ?? []).filter((g) => g.id !== id) });
    setToast("Goal removed.");
  };

  const getDailyQuest = () => {
    if (!user) return null;
    return questById(user.dailyQuestId) ?? pickDailyQuest(user.email, user.dailyQuestDate || todayKey());
  };

  const claimDailyQuest = (): boolean => {
    if (!user) return false;
    const template = getDailyQuest();
    if (!template) return false;
    if (user.dailyQuestClaimed) {
      setToast("Already claimed today.");
      return false;
    }
    if (!isDailyQuestComplete(user, template)) {
      setToast("Quest not complete yet.");
      return false;
    }
    const reward = scaleRewardPoints(template.reward, store);
    updateUser({
      ...user,
      dailyQuestClaimed: true,
      focusPoints: user.focusPoints + reward,
      totalPointsEarned: user.totalPointsEarned + reward,
    });
    enqueueCelebration({ kind: "points", title: "Daily quest complete!", subtitle: template.text, points: reward });
    setToast(`+${reward} focus points`);
    return true;
  };

  const addToWishlist = (id: string, kind: WishlistEntry["kind"], targetPrice: number) => {
    if (!user) return;
    if (user.shopWishlist.some((w) => w.id === id)) {
      setToast("Already on wishlist.");
      return;
    }
    if (user.shopWishlist.length >= 8) {
      setToast("Wishlist full (8 items). Remove one first.");
      return;
    }
    updateUser({
      ...user,
      shopWishlist: [...user.shopWishlist, { id, kind, addedAt: new Date().toISOString(), targetPrice }],
    });
    setToast("Pinned to wishlist.");
  };

  const removeFromWishlist = (id: string) => {
    if (!user) return;
    updateUser({ ...user, shopWishlist: user.shopWishlist.filter((w) => w.id !== id) });
    setToast("Removed from wishlist.");
  };

  const isWishlisted = (id: string) => Boolean(user?.shopWishlist.some((w) => w.id === id));

  const spin = () => {
    if (!user) return;
    if (isToday(user.dailySpinDate)) return setToast("You already used today's spin.");
    const rewards: SpinReward[] = [
      { text: "+200 Focus Points", points: 200 },
      { text: "15% Shop Discount", discount: 15 },
      { text: "Unlock Ocean Blue Theme", unlockTheme: "ocean" },
      { text: "+400 Focus Points", points: 400 },
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    let ownedThemes = user.ownedThemes;
    let themeVariantsOwned = { ...(user.themeVariantsOwned ?? {}) };
    if (reward.unlockTheme) {
      const tid = reward.unlockTheme as ThemeId;
      if (!ownsThemeClassic(user, tid)) {
        ownedThemes = [...user.ownedThemes, tid];
        themeVariantsOwned = grantThemeSurface(themeVariantsOwned, tid, "classic");
      }
    }
    updateUser({
      ...user,
      dailySpinDate: new Date().toDateString(),
      focusPoints: user.focusPoints + (reward.points || 0),
      discount: reward.discount || user.discount,
      ownedThemes,
      themeVariantsOwned,
    });
    setSpinResult(reward.text);
    if (reward.points) showReward("Daily spin!", reward.text, reward.points);
  };

  const attachSupabaseId = (localEmail: string, supabaseId: string) => {
    setStore((p) => {
      const existing = p.users[localEmail];
      if (!existing || existing.supabaseId === supabaseId) return p;
      return { ...p, users: { ...p.users, [localEmail]: { ...existing, supabaseId } } };
    });
  };

  const login = async () => {
    if (auth.email === OWNER_EMAIL && auth.password === OWNER_PASS) {
      const existingOwner = store.users[OWNER_EMAIL];
      const owner = {
        ...defaultUser(OWNER_EMAIL, OWNER_PASS, "Abdullah Ahmed"),
        ...existingOwner,
        role: "owner" as const,
        banned: false,
        muted: false,
        suspendedUntil: "",
      };
      setStore((p) => ({ ...p, current: OWNER_EMAIL, users: { ...p.users, [OWNER_EMAIL]: owner } }));
      setToast("Owner access granted.");
      try {
        await ensureSupabaseUser(OWNER_SUPA_EMAIL, OWNER_SUPA_PASSWORD, { role: "owner", username: "Abdullah Ahmed" });
        const { data } = await supabase.auth.signInWithPassword({ email: OWNER_SUPA_EMAIL, password: OWNER_SUPA_PASSWORD });
        if (data.session?.user.id) attachSupabaseId(OWNER_EMAIL, data.session.user.id);
      } catch {
        /* ignore */
      }
      return;
    }
    const existing = store.users[auth.email];
    if (!existing || existing.password !== auth.password) return setToast("Invalid credentials.");
    if ((maintenance.on || store.maintenanceMode) && existing.role !== "owner") return setToast("StudyGrind is under maintenance. Try again later.");
    if (existing.banned) return setToast("Account banned.");
    if (existing.suspendedUntil && new Date(existing.suspendedUntil).getTime() > Date.now()) {
      return setToast(`Account suspended until ${new Date(existing.suspendedUntil).toLocaleDateString()}.`);
    }
    setStore((p) => ({ ...p, current: auth.email, impersonatingFrom: "" }));
    setToast("Welcome back.");
    try {
      const { data } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password });
      if (data.session?.user.id) attachSupabaseId(auth.email, data.session.user.id);
    } catch {
      /* ignore */
    }
  };

  const signup = async () => {
    if (!auth.email || !auth.password || !auth.username) return setToast("Fill all fields.");
    if (auth.email === OWNER_EMAIL) return setToast("Reserved.");
    if (maintenance.on || store.maintenanceMode) return setToast("StudyGrind is under maintenance. Sign-ups reopen soon.");
    if (store.users[auth.email]) return setToast("Email exists.");
    const draft = store.onboardingDraft;
    const created = {
      ...defaultUser(auth.email, auth.password, draft.displayName || auth.username),
      username: draft.displayName || auth.username,
      focusDurationMin: draft.focusDurationMin,
      breakDurationMin: draft.breakDurationMin,
      mainGoal: draft.mainGoal,
      studyStyle: draft.studyStyle,
      equippedTheme: draft.starterTheme,
      ownedThemes: Array.from(new Set(["green", draft.starterTheme])) as ThemeId[],
      notifications: draft.notificationPref,
      notificationPref: draft.notificationPref,
      reminderHour: draft.reminderHour ?? 17,
      reminderMinute: draft.reminderMinute ?? 0,
    };
    setStore((p) => ({ ...p, current: auth.email, users: { ...p.users, [auth.email]: created } }));
    setToast("Account created.");
    await ensureSupabaseUser(auth.email, auth.password, { username: auth.username });
  };

  const goTabRef = useRef(goTab);
  goTabRef.current = goTab;

  // Deep links (studygrind://timer etc.) — from the home-screen widget or external intents.
  useEffect(() => {
    if (!isNative) return;
    const TAB_IDS = new Set<string>(Object.keys(TAB_META));
    const routeUrl = (url: string | undefined | null) => {
      if (!url) return;
      const m = /^studygrind:\/\/([a-zA-Z]+)/.exec(url);
      const target = m?.[1];
      if (target && TAB_IDS.has(target)) goTabRef.current(target as Tab);
    };
    let removed = false;
    let remove: (() => Promise<void>) | undefined;
    void CapApp.getLaunchUrl()
      .then((res) => routeUrl(res?.url))
      .catch(() => {});
    void CapApp.addListener("appUrlOpen", (ev) => {
      if (!removed) routeUrl(ev.url);
    }).then((h) => {
      remove = () => h.remove();
      if (removed) void h.remove();
    });
    return () => {
      removed = true;
      if (remove) void remove();
    };
  }, []);

  useEffect(() => {
    if (!isNative) return;
    return onBackButton(() => {
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (tab !== "home") goTabRef.current("home");
      else void minimizeApp();
    });
  }, [menuOpen, tab]);

  useEffect(() => {
    if (!isNative || !user) return;
    void (async () => {
      const svc = await getNotificationService();
      if (!svc.isSupported()) return;
      const key = "studygrind_notif_prompted";
      const prompted = localStorage.getItem(key);
      if (!prompted && user.notifications) {
        await svc.requestPermission();
        localStorage.setItem(key, "1");
      }
      await syncNotificationSchedule(
        user.notifications,
        user.reminderHour ?? 17,
        user.reminderMinute ?? 0,
      );
    })();
    const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
      const u = userRef.current;
      if (isActive && u?.notifications) {
        void syncNotificationSchedule(true, u.reminderHour ?? 17, u.reminderMinute ?? 0);
      }
    });
    return () => {
      void sub.then((h) => h.remove());
    };
  }, [user?.email, user?.notifications, user?.reminderHour, user?.reminderMinute]);

  // Tap daily reminder → open focus timer (Capacitor + native backup notifications).
  useEffect(() => {
    if (!isNative) return;
    let removed = false;
    let remove: (() => Promise<void>) | undefined;
    void LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      const extra = action.notification.extra as { route?: string; url?: string } | undefined;
      if (extra?.route === "timer" || extra?.url === "studygrind://timer") {
        goTabRef.current("timer");
      }
    }).then((handle) => {
      remove = () => handle.remove();
      if (removed) void handle.remove();
    });
    return () => {
      removed = true;
      if (remove) void remove();
    };
  }, []);

  useEffect(() => {
    if (!user?.supabaseId) return;
    const t = setTimeout(() => {
      void upsertProfile(user.supabaseId, user as unknown as Parameters<typeof upsertProfile>[1]);
    }, 1500);
    return () => clearTimeout(t);
  }, [user]);

  // Owner edits to other accounts: debounce-sync any changed user with a Supabase id.
  const syncedUsersRef = useRef<Record<string, UserData>>({});
  useEffect(() => {
    if (user?.role !== "owner") return;
    const changed = Object.values(store.users).filter(
      (u) => u.email !== user.email && u.supabaseId && syncedUsersRef.current[u.email] !== u,
    );
    if (changed.length === 0) return;
    const t = setTimeout(() => {
      changed.forEach((u) => {
        syncedUsersRef.current[u.email] = u;
        void upsertProfile(u.supabaseId, u as unknown as Parameters<typeof upsertProfile>[1]);
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [store.users, user?.email, user?.role]);

  const value: Ctx = {
    store,
    setStore,
    user,
    tab,
    setTab,
    goTab,
    toast,
    setToast,
    menuOpen,
    setMenuOpen,
    updateUser,
    logAction,
    studyRankLabel,
    displayTitle,
    equippedThemeId,
    previewTheme,
    setPreviewTheme,
    rewardPopup,
    showReward,
    closeReward,
    grantMiniGamePoints,
    spin,
    spinResult,
    buyTheme,
    buyBooster,
    purchaseShopItem,
    buyTitle,
    buyRotatingTheme,
    sellShopItem,
    sellTitle,
    sellCustomName,
    sellThemeSurface,
    equipTitle,
    equipTheme,
    hasUnlock,
    login,
    signup,
    auth,
    setAuth,
    authMode,
    setAuthMode,
    timerRunning,
    setTimerRunning,
    gameState,
    setGameState,
    gameScore,
    setGameScore,
    gameRound,
    setGameRound,
    gameMessage,
    setGameMessage,
    selectedTaskId,
    setSelectedTaskId,
    TAB_META,
    titleHubOpen,
    setTitleHubOpen,
    timerSnapshot,
    setTimerSnapshot,
    celebrationEvent,
    closeCelebration,
    enqueueCelebration,
    milestoneCelebration:
      celebrationEvent?.kind === "milestone" ? celebrationEvent.record : null,
    closeMilestoneCelebration: closeCelebration,
    applyFocusProfile,
    saveFocusProfile,
    deleteFocusProfile,
    maxFocusProfiles,
    claimDailyQuest,
    getDailyQuest,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    updateOtherUser,
    createUserAsOwner,
    resetUserAsOwner,
    patchStore,
    impersonateUser,
    stopImpersonating,
    pushToUserInbox,
    massBroadcastInbox,
    exportStoreBackup,
    importStoreBackup,
    maintenance,
    setMaintenanceMode,
    refreshMaintenance,
    whatsNewOpen,
    closeWhatsNew: () => {
      setWhatsNewOpen(false);
      const u = userRef.current;
      if (u && u.seenReleaseVersion !== APP_RELEASE_VERSION) {
        updateUser({ ...u, seenReleaseVersion: APP_RELEASE_VERSION });
      }
    },
    isBetaShell: betaShellActive,
    enterBetaShell,
    leaveBetaShell,
    upsertFocusProfile,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    startRoutine,
    advanceRoutineStep,
    cancelActiveRoutine,
    addGoal,
    updateGoal,
    deleteGoal,
  };

  return <StudyGrindContext.Provider value={value}>{children}</StudyGrindContext.Provider>;
}

export { vipThemes, honoraryThemes, themes };
