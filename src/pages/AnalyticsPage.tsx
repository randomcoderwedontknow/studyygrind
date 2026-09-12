import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarRange, Zap } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { WeeklyChart } from "../components/charts/WeeklyChart";
import { SessionHistory } from "../components/analytics/SessionHistory";
import { WeeklyRecapModal } from "../components/analytics/WeeklyRecapModal";
import { PressableButton } from "../components/ui/PressableButton";
import { RECAP_OPEN_FLAG, buildWeeklyRecap, recapNoticeWeekKey } from "../lib/recap";
import { buildWeeklyInsights } from "../lib/session-intelligence";
import { getWeekKey, priorWeekKey, classifyWeek } from "../lib/week";
import { comboLabel, comboMultiplier } from "../lib/combo";
import { PageTransition } from "../components/ui/PageTransition";
import { RecommendationsStrip } from "../components/home/RecommendationsStrip";

export function AnalyticsPage() {
  const { user, hasUnlock, updateUser } = useStudyGrind();
  const weekKey = getWeekKey();
  const weekMins = user?.weeklyRecords?.[weekKey]?.focusMinutes ?? 0;
  const priorMins = user?.weeklyRecords?.[priorWeekKey(weekKey)]?.focusMinutes ?? 0;

  const insights = useMemo(() => (user ? buildWeeklyInsights(user) : []), [user]);
  const recap = useMemo(() => (user ? buildWeeklyRecap(user) : null), [user]);
  const [recapOpen, setRecapOpen] = useState(false);

  // Home's "Your week is ready" notice sets this flag before switching tabs.
  useEffect(() => {
    if (sessionStorage.getItem(RECAP_OPEN_FLAG) === "1") {
      sessionStorage.removeItem(RECAP_OPEN_FLAG);
      setRecapOpen(true);
    }
  }, []);

  const openRecap = () => {
    setRecapOpen(true);
    const wk = recapNoticeWeekKey();
    if (user && user.lastRecapSeenWeek !== wk) updateUser({ ...user, lastRecapSeenWeek: wk });
  };

  if (!user) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMins = user.weeklyHistory[todayKey] ?? 0;
  const bestSession = user.focusLabStats.bestSessionMinutes;
  const gamePlays = Object.values(user.miniGameStats).reduce((a, s) => a + (s?.plays ?? 0), 0);
  const extended = hasUnlock("analytics-extended");
  const chartDays = extended ? 30 : 14;
  const rated = user.sessionLog.filter(
    (s) => s.focusRating && getWeekKey(new Date(s.at)) === weekKey,
  );
  const avgRating =
    rated.length > 0 ? (rated.reduce((a, s) => a + (s.focusRating ?? 0), 0) / rated.length).toFixed(1) : "—";

  return (
    <PageTransition stagger>
      <section className="hero-panel">
        <h4>
          <BarChart3 size={16} /> Analytics
        </h4>
        <p>Weekly intelligence, session history, and study trends.</p>
      </section>

      <section className="card recap-card">
        <div className="row">
          <div>
            <h4>
              <CalendarRange size={16} /> Weekly recap
            </h4>
            <p className="soft">
              {recap && recap.totalMinutes > 0
                ? `Last week: ${recap.totalMinutes}m across ${recap.sessions} session${recap.sessions === 1 ? "" : "s"}${
                    recap.deltaPct !== null ? ` · ${recap.deltaPct >= 0 ? "+" : ""}${recap.deltaPct}%` : ""
                  }`
                : "Your previous week, summarised in one sheet."}
            </p>
          </div>
          <PressableButton onClick={openRecap}>View recap</PressableButton>
        </div>
      </section>

      <section className="card combo-analytics-card">
        <h4>
          <Zap size={14} /> Focus combo
        </h4>
        <p>
          {comboLabel(comboMultiplier(user))} · {user.loginStreak} active days
        </p>
        <p className="soft">Combo multiplies timer points when you press End Timer (not live ticking).</p>
      </section>

      <section className="analytics-stats-grid">
        {[
          { label: "Focus today", value: `${todayMins}m` },
          { label: "Focus this week", value: `${weekMins}m` },
          { label: "Last week", value: `${priorMins}m` },
          { label: "Week tone", value: classifyWeek(weekMins) },
          { label: "Best session", value: `${bestSession}m` },
          { label: "Total points earned", value: user.totalPointsEarned.toLocaleString() },
          { label: "Cards reviewed", value: String(user.flashcardStats.cardsReviewed) },
          { label: "Study streak", value: `${user.streak}d` },
          { label: "Avg focus (week)", value: avgRating === "—" ? "—" : `${avgRating}/5` },
          { label: "Mini-game plays", value: String(gamePlays) },
        ].map((s) => (
          <article key={s.label} className="metric analytics-stat">
            <small>{s.label}</small>
            <b>{s.value}</b>
          </article>
        ))}
      </section>

      <RecommendationsStrip compact />

      <section className="card weekly-insights">
        <h4>Weekly intelligence</h4>
        {insights.map((ins) => (
          <article key={ins.title} className="insight-row">
            <b>{ins.title}</b>
            <p className="soft">{ins.body}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h4>{chartDays}-day focus</h4>
        <WeeklyChart history={user.weeklyHistory} days={chartDays} />
      </section>

      <SessionHistory />

      <section className="grid2">
        <article className="card">
          <h4>Top tags</h4>
          {Object.entries(user.tags).length === 0 && <p className="soft">Tag tasks during focus sessions.</p>}
          {Object.entries(user.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, mins]) => {
              const max = Math.max(1, ...Object.values(user.tags));
              return (
                <div className="tag-row" key={tag}>
                  <span>{tag}</span>
                  <div className="tag-bar">
                    <div className="tag-fill" style={{ width: `${(mins / max) * 100}%` }} />
                  </div>
                  <small>{mins}m</small>
                </div>
              );
            })}
        </article>
        <article className="card">
          <h4>Flashcard decks</h4>
          {user.decks.length === 0 && <p className="soft">No decks yet.</p>}
          {user.decks.map((d) => {
            const mastered = d.cards.filter((c) => c.status === "known" || c.known).length;
            return (
              <p key={d.id}>
                {d.name}: {mastered}/{d.cards.length} mastered
              </p>
            );
          })}
        </article>
      </section>

      {hasUnlock("analytics-heatmap") && (
        <section className="card">
          <h4>Focus heatmap</h4>
          <p className="soft">Peak hour: {user.focusLabStats.bestHour}:00 — schedule deep work then.</p>
        </section>
      )}

      <WeeklyRecapModal open={recapOpen} user={user} onClose={() => setRecapOpen(false)} />
    </PageTransition>
  );
}
