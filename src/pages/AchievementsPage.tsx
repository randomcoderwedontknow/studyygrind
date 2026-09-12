import { useMemo, useState } from "react";
import { Lock, Trophy } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { TROPHY_CATALOG, countTrophies, type TrophyCategory } from "../data/trophies";
import { isTrophyUnlocked } from "../lib/trophies";
import { trophyRewardLabel } from "../lib/trophy-rewards";
import { PageTransition } from "../components/ui/PageTransition";
import { HorizontalTabBar } from "../components/ui/HorizontalTabBar";

const CATEGORIES: { id: "all" | TrophyCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "focusPoints", label: "Points" },
  { id: "studyMinutes", label: "Minutes" },
  { id: "streak", label: "Streaks" },
  { id: "sessions", label: "Sessions" },
  { id: "tasks", label: "Tasks" },
  { id: "flashcards", label: "Cards" },
  { id: "games", label: "Games" },
  { id: "weekly", label: "Weekly" },
  { id: "rank", label: "Rank" },
  { id: "shop", label: "Shop" },
  { id: "unique", label: "Unique" },
];

type Filter = "all" | "unlocked" | "locked";

export function AchievementsPage() {
  const { user } = useStudyGrind();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<"all" | TrophyCategory>("all");

  const stats = useMemo(() => (user ? countTrophies(user) : { earned: 0, total: 0 }), [user]);
  const list = useMemo(() => {
    if (!user) return [];
    return TROPHY_CATALOG.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      const unlocked = isTrophyUnlocked(user, t.id);
      if (filter === "unlocked" && !unlocked) return false;
      if (filter === "locked" && unlocked) return false;
      if (t.hidden && !unlocked) return false;
      return true;
    });
  }, [user, filter, category]);

  if (!user) return null;

  return (
    <PageTransition>
      <section className="hero-panel achievements-hero">
        <div className="hero-main">
          <span className="eyebrow">Trophy room</span>
          <h4>
            {stats.earned} / {stats.total} unlocked
          </h4>
          <p className="soft">Earn trophies by studying, completing tasks, and exploring the app. Many trophies include bonus rewards.</p>
        </div>
        <div className="hero-side">
          <span className="pill points-pill">
            <Trophy size={14} /> {Math.round((stats.earned / Math.max(1, stats.total)) * 100)}%
          </span>
        </div>
      </section>

      <HorizontalTabBar
        tabs={[
          { id: "all", label: "All" },
          { id: "unlocked", label: "Unlocked" },
          { id: "locked", label: "Locked" },
        ]}
        active={filter}
        onChange={(id) => setFilter(id as Filter)}
      />

      <div className="chip-group trophy-categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${category === c.id ? "chip-active" : ""}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="trophy-grid">
        {list.map((t) => {
          const unlocked = isTrophyUnlocked(user, t.id);
          const prog = !unlocked && t.progress ? t.progress(user) : null;
          const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 100;
          return (
            <article
              key={t.id}
              className={`trophy-card ${unlocked ? "unlocked" : "locked"} trophy-tier-${t.tier}`}
            >
              <div className="trophy-icon">{unlocked ? <Trophy size={22} /> : <Lock size={20} />}</div>
              <b>{unlocked || !t.hidden ? t.name : "???"}</b>
              <small className="soft">{unlocked || !t.hidden ? t.description : "Secret trophy"}</small>
              {t.reward && (
                <span className="pill trophy-reward-pill">{trophyRewardLabel(t.reward)}</span>
              )}
              {!unlocked && prog && (
                <>
                  <div className="rank-progress-bar">
                    <div className="rank-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <small className="soft">
                    {prog.current} / {prog.target}
                  </small>
                </>
              )}
              {unlocked && user.trophyUnlockDates[t.id] && (
                <small className="soft">Earned {new Date(user.trophyUnlockDates[t.id]).toLocaleDateString()}</small>
              )}
            </article>
          );
        })}
      </div>
    </PageTransition>
  );
}
