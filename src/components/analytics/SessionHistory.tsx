import { useMemo, useState } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { filterSessions } from "../../lib/session-intelligence";
import { SESSION_LOG_CAP_EXTENDED } from "../../data/constants";

type Filter = "today" | "week" | "month" | "all";

export function SessionHistory() {
  const { user, hasUnlock } = useStudyGrind();
  const [filter, setFilter] = useState<Filter>("week");
  const [taskFilter, setTaskFilter] = useState("");
  const extended = hasUnlock("analytics-extended");

  const sessions = useMemo(() => {
    if (!user) return [];
    const cap = extended ? SESSION_LOG_CAP_EXTENDED : 200;
    return filterSessions(user.sessionLog.slice(-cap), filter, taskFilter || undefined).slice(0, extended ? 100 : 50);
  }, [user, filter, taskFilter, extended]);

  if (!user) return null;

  return (
    <section className="card session-history">
      <h4>Session history</h4>
      <div className="chip-group">
        {(["today", "week", "month", "all"] as Filter[]).map((f) => (
          <button key={f} type="button" className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} aria-label="Filter by task">
        <option value="">All tasks</option>
        {user.tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <div className="session-list">
        {sessions.length === 0 && <p className="soft">No sessions in this range.</p>}
        {sessions.map((s, i) => {
          const task = s.taskId ? user.tasks.find((t) => t.id === s.taskId) : null;
          const when = new Date(s.at).toLocaleString();
          return (
            <article key={`${s.at}-${i}`} className="session-row">
              <div className="row">
                <b>{s.minutes}m focus</b>
                <small className="soft">{when}</small>
              </div>
              <p className="soft">
                {task ? task.title : "General"} · +{s.pointsEarned} pts
                {s.basePoints != null && s.comboMult != null && s.comboMult > 1
                  ? ` (${s.basePoints} × ${s.comboMult} combo)`
                  : ""}
                {s.breakMinutes ? ` · ${s.breakMinutes}m break` : ""}
              </p>
              {s.focusRating != null && (
                <small className="session-rating">Focus: {"★".repeat(s.focusRating)}{"☆".repeat(5 - s.focusRating)}</small>
              )}
              {s.reflection?.note && <small className="soft">"{s.reflection.note}"</small>}
              {s.reflection?.distractedBy && <small className="soft">Distracted by: {s.reflection.distractedBy}</small>}
              {(s.moodBefore || s.moodAfter) && (
                <small>
                  Mood: {s.moodBefore} → {s.moodAfter}
                </small>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
