import { useState } from "react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { studyRankFromUser, rankProgress } from "../data/ranks";
import { PURCHASABLE_TITLES, CUSTOM_NAME_TITLE_ID, titleById } from "../data/titles";
import { themeAppearance } from "../data/themes";
import { CUSTOM_TITLE_UNLOCK_PRICE } from "../data/constants";
import { shopDisplayPrice } from "../lib/pricing";
import { WeeklyChart } from "../components/charts/WeeklyChart";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { countTrophies } from "../data/trophies";
import { Trophy } from "lucide-react";
import { IdentityStatusBox } from "../components/layout/IdentityStatusBox";

export function ProfilePage() {
  const { user, updateUser, studyRankLabel, displayTitle, store, setToast, buyTitle, equipTitle, hasUnlock, goTab } = useStudyGrind();
  const [rankModal, setRankModal] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [tab, setTab] = useState<"rank" | "titles" | "weekly">("rank");

  if (!user) return null;
  const rank = studyRankFromUser(user);
  const prog = rankProgress(user);
  const xp = user.totalStudyMinutes * 2 + user.sessionsCompleted * 10 + user.tasksCompleted * 5;

  return (
    <PageTransition stagger>
      <section className={`profile-head ${user.honoraryAccess || user.role === "owner" ? "aura" : ""}`}>
        <div className="avatar">{user.username.slice(0, 2).toUpperCase()}</div>
        <div>
          <h3>{user.username}</h3>
          <p className="soft">
            <span className="rank-badge">Rank: {studyRankLabel}</span>
            {displayTitle && <span className="title-badge"> · {displayTitle}</span>}
          </p>
          {user.tagline && <p className="tagline">"{user.tagline}"</p>}
          <p className="soft">Theme: {themeAppearance(user.equippedTheme, store.customThemes, user.savedCustomThemes).name}</p>
        </div>
        <button type="button" className="xp-box xp-box-btn pressable" onClick={() => setRankModal(true)}>
          <b>{xp} XP</b>
          <small>Level {Math.max(1, Math.floor(xp / 300))}</small>
        </button>
      </section>

      <IdentityStatusBox />

      <section className="card">
        <h4>Progress</h4>
        <div className="rank-progress-bar">
          <div className="rank-progress-fill" style={{ width: `${prog.percent}%` }} />
        </div>
        <p className="soft">{prog.label}</p>
        <div className="grid3">
          <article className="metric">
            <small>Study</small>
            <b>{user.totalStudyMinutes}m</b>
          </article>
          <article className="metric">
            <small>Streak</small>
            <b>{user.streak}d</b>
          </article>
          <article className="metric">
            <small>Points</small>
            <b>{user.focusPoints}</b>
          </article>
        </div>
      </section>

      <section className="card">
        <h4>14-day trend</h4>
        <WeeklyChart history={user.weeklyHistory} />
      </section>

      {(user.exams ?? []).some((e) => e.readinessAskedAt || e.readinessRating) && (
        <section className="card">
          <h4>Exam readiness journal</h4>
          <ul className="soft" style={{ paddingLeft: 18 }}>
            {(user.exams ?? [])
              .filter((e) => e.readinessAskedAt || e.readinessRating)
              .map((e) => {
                const mins = user.sessionLog.filter((s) => s.examId === e.id).reduce((sum, s) => sum + s.minutes, 0);
                return (
                  <li key={e.id} style={{ marginBottom: 8 }}>
                    <b>{e.title}</b> ({e.examDate}) — {e.readinessRating ? `${e.readinessRating}/5 ready` : "Skipped rating"} · {mins}m studied
                    {e.readinessNote ? ` · ${e.readinessNote}` : ""}
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {user.recentMilestones && user.recentMilestones.length > 0 && (
        <section className="card">
          <h4>Recent milestones</h4>
          <div className="milestone-list">
            {user.recentMilestones.slice(0, 3).map((m) => (
              <article key={m.id} className={`milestone-list-item milestone-tier-${m.tier}`}>
                <b>{m.title}</b>
                <p className="soft">{m.subtitle}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="row">
          <div>
            <h4>
              <Trophy size={16} /> Trophies
            </h4>
            <p className="soft">
              {countTrophies(user).earned} / {countTrophies(user).total} unlocked
            </p>
          </div>
          <PressableButton variant="ghost" onClick={() => goTab("achievements")}>
            View all
          </PressableButton>
        </div>
      </section>

      <Modal open={rankModal} title="Rank & titles" onClose={() => setRankModal(false)}>
        <div className="chip-group">
          <button type="button" className={`chip ${tab === "rank" ? "chip-active" : ""}`} onClick={() => setTab("rank")}>
            Rank (earned)
          </button>
          <button type="button" className={`chip ${tab === "titles" ? "chip-active" : ""}`} onClick={() => setTab("titles")}>
            Titles (shop)
          </button>
          <button type="button" className={`chip ${tab === "weekly" ? "chip-active" : ""}`} onClick={() => setTab("weekly")}>
            Weekly earned
          </button>
        </div>
        {tab === "rank" && (
          <div>
            <p>
              Current: <b>{rank.label}</b>
            </p>
            <p className="soft">{rank.catalogHint}</p>
            <ul>
              <li>Starter — 0m</li>
              <li>Steady — 60m</li>
              <li>Building Habits — 200m</li>
              <li>Focused — 600m</li>
              <li>Deep Focus — 1200m</li>
              <li>Top Scholar — 1800m</li>
            </ul>
          </div>
        )}
        {tab === "weekly" && (
          <div>
            {(user.weeklyTitleInventory ?? []).length === 0 && (
              <p className="soft">Earn weekly titles by hitting focus minute thresholds each week.</p>
            )}
            {(user.weeklyTitleInventory ?? []).map((t) => (
              <div key={t.id} className="row item">
                <span>
                  {t.label} <small className="soft">({t.threshold}m · {t.weekKey})</small>
                </span>
                <PressableButton variant="ghost" onClick={() => equipTitle(t.id)}>
                  {user.equippedTitleId === t.id ? "Equipped" : "Equip"}
                </PressableButton>
              </div>
            ))}
          </div>
        )}
        {tab === "titles" && (
          <div>
            {PURCHASABLE_TITLES.map((t) => (
              <div key={t.id} className="row item">
                <span>{t.label}</span>
                {user.ownedTitles.includes(t.id) ? (
                  <PressableButton variant="ghost" onClick={() => equipTitle(t.id)}>
                    {user.equippedTitleId === t.id ? "Equipped" : "Equip"}
                  </PressableButton>
                ) : (
                  <PressableButton variant="ghost" onClick={() => buyTitle(t.id, t.price)}>
                    {shopDisplayPrice(t.price, user.discount).toLocaleString()} pts
                  </PressableButton>
                )}
              </div>
            ))}
            {hasUnlock(CUSTOM_NAME_TITLE_ID) || user.customTitleUnlocked ? (
              <div className="row wrap">
                <input value={titleDraft} placeholder="Custom name" onChange={(e) => setTitleDraft(e.target.value.slice(0, 32))} />
                <PressableButton
                  onClick={() => {
                    updateUser({ ...user, customRankName: titleDraft.trim(), equippedTitleId: CUSTOM_NAME_TITLE_ID });
                    setToast("Custom title saved.");
                    setRankModal(false);
                  }}
                >
                  Save custom
                </PressableButton>
              </div>
            ) : (
              <PressableButton onClick={() => setToast(`Unlock Custom Name in shop (${CUSTOM_TITLE_UNLOCK_PRICE} pts)`)}>
                Unlock custom name in shop
              </PressableButton>
            )}
            {user.equippedTitleId && titleById(user.equippedTitleId) && (
              <p className="soft">Equipped: {titleById(user.equippedTitleId)!.label}</p>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
