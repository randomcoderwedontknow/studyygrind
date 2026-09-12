import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Clock3,
  Crown,
  FlaskConical,
  Home,
  LogOut,
  Lock,
  Menu,
  NotebookPen,
  Palette,
  Settings,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { pointsEventStatus } from "../../lib/point-multiplier";
import { UNLOCK_IDS } from "../../data/constants";
import { isAndroid } from "../../lib/native";
import { hapticSelection } from "../../lib/haptics";
import type { Tab } from "../../types";
import { RewardPopup } from "../ui/RewardPopup";
import { TitleHubModal } from "../titles/TitleHubModal";
import { FloatingMiniTimer } from "../timer/FloatingMiniTimer";
import { CelebrationModal } from "../rewards/CelebrationModal";
import { NotificationsModal } from "./NotificationsModal";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

const TAB_ICONS: Partial<Record<Tab, React.ReactNode>> = {
  home: <Home size={18} />,
  tasks: <CheckSquare size={18} />,
  timer: <Clock3 size={18} />,
  cards: <BookOpen size={18} />,
  notes: <NotebookPen size={18} />,
  shop: <ShoppingBag size={18} />,
  games: <Sparkles size={18} />,
  honour: <Crown size={18} />,
  mentor: <Crown size={18} />,
  analytics: <BarChart3 size={18} />,
  profile: <User size={18} />,
  achievements: <Trophy size={18} />,
  settings: <Settings size={18} />,
  focusLab: <FlaskConical size={18} />,
  themeStudio: <Palette size={18} />,
};

const MAIN_TABS: Tab[] = [
  "home",
  "tasks",
  "timer",
  "cards",
  "notes",
  "shop",
  "games",
  "focusLab",
  "honour",
  "mentor",
  "analytics",
  "achievements",
  "profile",
  "settings",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    tab,
    goTab,
    menuOpen,
    setMenuOpen,
    toast,
    studyRankLabel,
    displayTitle,
    setStore,
    rewardPopup,
    closeReward,
    hasUnlock,
    timerRunning,
    TAB_META,
    titleHubOpen,
    setTitleHubOpen,
    celebrationEvent,
    closeCelebration,
    store,
    stopImpersonating,
  } = useStudyGrind();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    document.body.dataset.drawer = menuOpen ? "open" : "closed";
    return () => {
      document.body.dataset.drawer = "closed";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isAndroid) return;
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpen]);

  if (!user) return null;

  const hasNotificationBadge =
    user.inbox.length > 0 ||
    Boolean(store.announcement) ||
    pointsEventStatus(store).multiplier > 1 ||
    (user.recentMilestones?.length ?? 0) > 0;

  const isTabLocked = (t: Tab) => {
    if (t === "focusLab") return !hasUnlock(UNLOCK_IDS.focusLab);
    if (t === "themeStudio") return !hasUnlock(UNLOCK_IDS.colourMaker);
    if (t === "mentor") return !hasUnlock(UNLOCK_IDS.mentorHub) && !user.honoraryAccess && user.role !== "owner";
    return false;
  };

  const pageTitle = TAB_META[tab]?.label ?? "StudyGrind";

  return (
    <div className={`app ${user.ownerFlags.extraParticles ? "particle-trail" : ""}`}>
      <div className="app-body">
        <Sidebar tabs={MAIN_TABS} icons={TAB_ICONS} isTabLocked={isTabLocked} />

        <div className="app-main">
          <header className="topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="menu-btn icon-btn pressable"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="topbar-title">
                <b>{pageTitle}</b>
                <small>
                  {studyRankLabel}
                  {displayTitle ? ` · ${displayTitle}` : ""}
                </small>
              </div>
            </div>
            <div className="topbar-actions">
              {!isAndroid && <span className="pill points-pill">{user.focusPoints.toLocaleString()} pts</span>}
              <button
                type="button"
                className="icon-btn pressable inbox-btn"
                onClick={() => setNotificationsOpen(true)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {hasNotificationBadge && <span className="inbox-dot" />}
              </button>
            </div>
          </header>

          {timerRunning && user.focusLockOn && <div className="lock-banner">Focus lock active</div>}
          {store.impersonatingFrom && (
            <div className="lock-banner impersonation-banner">
              Viewing as {user.username}
              <button type="button" className="ghost pressable" onClick={stopImpersonating}>
                Back to owner
              </button>
            </div>
          )}

          <main className="content">{children}</main>
        </div>
      </div>

      {isAndroid && <BottomNav />}

      {toast && <div className="toast">{toast}</div>}

      <RewardPopup
        open={rewardPopup.open}
        title={rewardPopup.title}
        subtitle={rewardPopup.subtitle}
        points={rewardPopup.points}
        onClose={closeReward}
      />

      <TitleHubModal open={titleHubOpen} onClose={() => setTitleHubOpen(false)} />

      <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <CelebrationModal
        open={Boolean(celebrationEvent)}
        event={celebrationEvent}
        onClose={closeCelebration}
        soundEffectsEnabled={user.soundEffects}
        timerEndSoundId={user.timerEndSoundId}
      />

      <FloatingMiniTimer />

      {menuOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)} />
      )}
      <nav className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="drawer-head">
          <h4>Navigate</h4>
          <button type="button" className="ghost icon-btn pressable" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-stats">
          <div>
            <b>{user.streak}</b>
            <small>Study streak</small>
          </div>
          <div>
            <b>{user.totalStudyMinutes}</b>
            <small>Minutes</small>
          </div>
          <div>
            <b>{user.sessionsCompleted}</b>
            <small>Sessions</small>
          </div>
        </div>
        <div className="drawer-list">
          {MAIN_TABS.map((t) => {
            const meta = TAB_META[t];
            const locked = isTabLocked(t);
            return (
              <button
                key={t}
                type="button"
                className={`drawer-item ${tab === t ? "active" : ""} ${locked ? "locked-hint" : ""}`}
                onClick={() => {
                  hapticSelection();
                  goTab(t, { closeMenu: true });
                }}
              >
                <span className="drawer-icon">{TAB_ICONS[t]}</span>
                <span className="drawer-label">
                  {meta.label}
                  {locked && <Lock size={12} className="drawer-lock" />}
                </span>
                <span className="drawer-desc">{locked ? "Buy in Focus Shop" : meta.description}</span>
                <ChevronRight className="drawer-arrow" size={16} />
              </button>
            );
          })}
          <button
            type="button"
            className={`drawer-item ${tab === "themeStudio" ? "active" : ""} ${isTabLocked("themeStudio") ? "locked-hint" : ""}`}
            onClick={() => {
              hapticSelection();
              goTab("themeStudio", { closeMenu: true });
            }}
          >
            <span className="drawer-icon">
              <Palette size={18} />
            </span>
            <span className="drawer-label">
              Theme Studio
              {isTabLocked("themeStudio") && <Lock size={12} className="drawer-lock" />}
            </span>
            <span className="drawer-desc">{isTabLocked("themeStudio") ? "Buy in Focus Shop" : "Custom colours & gradients"}</span>
            <ChevronRight className="drawer-arrow" size={16} />
          </button>
        </div>
        <div className="drawer-foot">
          <button type="button" className="ghost pressable" onClick={() => goTab("settings", { closeMenu: true })}>
            <Settings size={16} /> Settings
          </button>
          <button type="button" className="ghost pressable" onClick={() => setStore((p) => ({ ...p, current: "" }))}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </nav>
    </div>
  );
}
