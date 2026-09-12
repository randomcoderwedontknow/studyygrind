import { useState } from "react";
import {
  BookOpen,
  CalendarRange,
  CheckSquare,
  ChevronRight,
  Clock3,
  Crown,
  Gift,
  Lock,
  MoreHorizontal,
  NotebookPen,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { pointsEventStatus } from "../lib/point-multiplier";
import { isToday } from "../lib/migrations";
import { RECAP_OPEN_FLAG, recapNoticeWeekKey, shouldShowRecapNotice } from "../lib/recap";
import { hapticSelection } from "../lib/haptics";
import { OWNER_EMAIL } from "../data/constants";
import { WeeklyChallengeCard } from "../components/weekly/WeeklyChallengeCard";
import { TodaySection } from "../components/home/TodaySection";
import { RecommendationsStrip } from "../components/home/RecommendationsStrip";
import { DailyQuestCard } from "../components/home/DailyQuestCard";
import { WishlistStrip } from "../components/shop/WishlistCard";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { studyRankFromUser } from "../data/ranks";
import type { Tab } from "../types";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night grind";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Winding down";
}

export function HomePage() {
  const { user, goTab, updateUser, setToast, store, pushToUserInbox, applyFocusProfile, studyRankLabel, displayTitle } =
    useStudyGrind();
  const [focusLockModal, setFocusLockModal] = useState(false);
  const [lockDraft, setLockDraft] = useState<Tab[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [honourableMsg, setHonourableMsg] = useState("");

  if (!user) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMins = user.weeklyHistory[todayKey] ?? 0;
  const pendingTasks = user.tasks.filter((t) => t.status !== "done").length;
  const goalPct = Math.min(100, Math.round((todayMins / Math.max(1, user.personalGoalMinutes)) * 100));
  const rank = studyRankFromUser(user);
  const trophyCount = user.unlockedTrophies?.length ?? 0;
  const pointsEvent = pointsEventStatus(store);

  const openTaskModal = () => goTab("tasks");

  return (
    <PageTransition stagger>
      <section className="hero-panel home-hero dashboard-header">
        <div className="hero-main">
          <span className="eyebrow">{greeting()}</span>
          <h4>{user.username}</h4>
          <p className="identity-line">
            {studyRankLabel} · {displayTitle} · {user.focusPoints.toLocaleString()} pts
          </p>
          <p>
            {todayMins} / {user.personalGoalMinutes} min today · Level{" "}
            {Math.max(1, Math.floor((user.totalStudyMinutes * 2 + user.sessionsCompleted * 10) / 300))}
          </p>
          <div className="rank-progress-bar" aria-label={`Daily goal ${goalPct}%`}>
            <div className="rank-progress-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="row wrap" style={{ marginTop: 12 }}>
            <PressableButton onClick={() => goTab("timer")}>
              <Clock3 size={16} /> Start focus
            </PressableButton>
            <PressableButton variant="ghost" onClick={() => goTab("achievements")}>
              <Sparkles size={16} /> {trophyCount} trophies
            </PressableButton>
          </div>
        </div>
        <div className="hero-side">
          <div className="row wrap">
            {user.streakShields > 0 && (
              <span className="pill shield">
                <Shield size={12} /> {user.streakShields}
              </span>
            )}
            <span className="pill">{rank.label}</span>
          </div>
        </div>
      </section>

      {user.focusProfiles.length > 0 && (
        <section className="card focus-profiles-row">
          <span className="eyebrow">Focus profiles</span>
          <div className="chip-group">
            {user.focusProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${user.activeFocusProfileId === p.id ? "chip-active" : ""}`}
                onClick={() => {
                  hapticSelection();
                  applyFocusProfile(p.id);
                  goTab("timer");
                }}
              >
                {p.name} · {p.focusDurationMin}m
              </button>
            ))}
          </div>
        </section>
      )}

      <DailyQuestCard />
      <WishlistStrip compact />

      {shouldShowRecapNotice(user) && (
        <button
          type="button"
          className="notice recap-notice pressable"
          onClick={() => {
            hapticSelection();
            updateUser({ ...user, lastRecapSeenWeek: recapNoticeWeekKey() });
            sessionStorage.setItem(RECAP_OPEN_FLAG, "1");
            goTab("analytics");
          }}
        >
          <CalendarRange size={16} />
          <span>
            <b>Your week is ready.</b> See last week's focus, best day and top tag.
          </span>
          <ChevronRight size={16} className="recap-notice-arrow" />
        </button>
      )}

      {(store.announcement || pointsEvent.multiplier > 1) && (
        <div className="notice-stack">
          {store.announcement && (
            <div className="notice">
              <Sparkles size={16} />
              <span>{store.announcement.text}</span>
            </div>
          )}
          {pointsEvent.multiplier > 1 && (
            <div className="notice event">
              <Zap size={16} />
              <span>
                {pointsEvent.label} · {pointsEvent.multiplier}× points
              </span>
            </div>
          )}
        </div>
      )}

      <section className="grid4 metrics-grid">
        <article className="metric">
          <small>Study today</small>
          <b>{todayMins}m</b>
        </article>
        <article className="metric">
          <small>Total study</small>
          <b>{user.totalStudyMinutes}m</b>
        </article>
        <article className="metric">
          <small>Study streak</small>
          <b>{user.streak}d</b>
        </article>
        <article className="metric">
          <small>Tasks left</small>
          <b>{pendingTasks}</b>
        </article>
      </section>

      <TodaySection />
      <RecommendationsStrip />

      <section className="quick-actions" aria-label="Quick actions">
        <article className="card quick pressable" onClick={openTaskModal}>
          <CheckSquare size={20} />
          <b>Add task</b>
          <small>{pendingTasks} open</small>
        </article>
        <article className="card quick pressable" onClick={() => goTab("cards")}>
          <BookOpen size={20} />
          <b>Flashcards</b>
          <small>{user.decks.length} decks</small>
        </article>
        <article className="card quick pressable" onClick={() => goTab("notes")}>
          <NotebookPen size={20} />
          <b>Notes</b>
          <small>{user.notes.length} saved</small>
        </article>
        <article className="card quick pressable" onClick={() => goTab("shop")}>
          <Gift size={20} />
          <b>Shop</b>
          <small>Unlock extras</small>
        </article>
        <article className="card quick pressable" onClick={() => goTab("analytics")}>
          <Sparkles size={20} />
          <b>Analytics</b>
          <small>Track progress</small>
        </article>
        <article className="card quick pressable" onClick={() => setMoreOpen(true)}>
          <MoreHorizontal size={20} />
          <b>More</b>
          <small>Extras</small>
        </article>
      </section>

      {user.recentMilestones && user.recentMilestones[0] && (
        <section className="card latest-milestone-chip">
          <span className="eyebrow">Latest milestone</span>
          <b>{user.recentMilestones[0].title}</b>
          <p className="soft">{user.recentMilestones[0].subtitle}</p>
        </section>
      )}

      <WeeklyChallengeCard />

      {store.activeChallenge && (
        <section className="card">
          <h4>Community challenge</h4>
          <p className="break">{store.activeChallenge.text}</p>
        </section>
      )}

      <Modal open={moreOpen} title="More" onClose={() => setMoreOpen(false)}>
        {!isToday(user.dailyUserBoostDate) && (
          <div className="grouped-list-row">
            <div>
              <b>Daily boost</b>
              <p className="soft">Free +120 focus points once per day.</p>
            </div>
            <PressableButton
              onClick={() => {
                updateUser({
                  ...user,
                  dailyUserBoostDate: new Date().toDateString(),
                  focusPoints: user.focusPoints + 120,
                });
                setToast("+120 focus points");
              }}
            >
              Claim
            </PressableButton>
          </div>
        )}
        <div className="grouped-list-row">
          <div>
            <b>
              <Lock size={14} /> Focus lock
            </b>
            <p className="soft">{user.focusLockOn ? "On" : "Off"} · block tabs during sessions</p>
          </div>
          <button
            type="button"
            className={`toggle ${user.focusLockOn ? "on" : ""}`}
            aria-label="Toggle focus lock"
            onClick={() => (user.focusLockOn ? updateUser({ ...user, focusLockOn: false }) : setFocusLockModal(true))}
          >
            <span />
          </button>
        </div>
        <div className="grouped-list-row">
          <label className="soft">Daily goal (min)</label>
          <input
            type="number"
            min={15}
            max={480}
            value={user.personalGoalMinutes}
            onChange={(e) => updateUser({ ...user, personalGoalMinutes: Math.max(15, Number(e.target.value) || 60) })}
            style={{ width: 96 }}
          />
        </div>
        {(user.vipAccess || user.role === "owner") && (
          <div className="grouped-list-row">
            <b>
              <Crown size={14} /> VIP perks
            </b>
            <div className="row wrap">
              <PressableButton
                disabled={isToday(user.vipDailyClaimDate)}
                onClick={() => {
                  updateUser({
                    ...user,
                    vipDailyClaimDate: new Date().toDateString(),
                    focusPoints: user.focusPoints + 120,
                  });
                  setToast("+120 VIP points");
                }}
              >
                Daily +120
              </PressableButton>
            </div>
          </div>
        )}
        {user.honoraryAccess && (
          <>
            <textarea value={honourableMsg} onChange={(e) => setHonourableMsg(e.target.value)} placeholder="Message to owner..." />
            <PressableButton
              onClick={() => {
                if (!honourableMsg.trim()) return;
                const ok = pushToUserInbox(OWNER_EMAIL, `Honour note from ${user.username}: ${honourableMsg.trim()}`);
                setToast(ok ? "Sent." : "Unavailable.");
                setHonourableMsg("");
              }}
            >
              Send honour note
            </PressableButton>
          </>
        )}
        <div className="card tint">
          <h4>Top study tags</h4>
          {Object.entries(user.tags).length === 0 ? (
            <p className="soft">Start a session with a task tag to see breakdown.</p>
          ) : (
            Object.entries(user.tags)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([tag, mins]) => (
                <p key={tag}>
                  #{tag}: {mins}m
                </p>
              ))
          )}
        </div>
      </Modal>

      <Modal
        open={focusLockModal}
        title="Focus lock tabs"
        onClose={() => setFocusLockModal(false)}
        footer={
          <PressableButton
            onClick={() => {
              updateUser({ ...user, lockedTabs: lockDraft, focusLockOn: true });
              setFocusLockModal(false);
              setToast("Focus lock enabled.");
            }}
          >
            Apply lock
          </PressableButton>
        }
      >
        <p className="soft">Choose tabs to block during an active session:</p>
        <div className="chip-group">
          {(["shop", "cards", "games", "notes", "mentor", "analytics"] as Tab[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`chip ${lockDraft.includes(p) ? "chip-active" : ""}`}
              onClick={() => setLockDraft((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))}
            >
              {p}
            </button>
          ))}
        </div>
      </Modal>
    </PageTransition>
  );
}
