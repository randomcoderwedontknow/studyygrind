import { Lightbulb, X } from "lucide-react";
import { useMemo } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { buildRecommendations } from "../../lib/recommendations";

export function RecommendationsStrip({ compact }: { compact?: boolean }) {
  const { user, updateUser } = useStudyGrind();
  const recs = useMemo(
    () => (user ? buildRecommendations(user, user.dismissedRecommendations ?? []) : []),
    [user],
  );

  if (!user || recs.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...(user.dismissedRecommendations ?? []), id].slice(-20);
    updateUser({ ...user, dismissedRecommendations: next });
  };

  return (
    <section className={`card recommendations-strip ${compact ? "compact" : ""}`}>
      <h4>
        <Lightbulb size={16} /> {compact ? "For you" : "Smart tips"}
      </h4>
      <div className="recommendation-list">
        {recs.map((r) => (
          <article key={r.id} className="recommendation-card">
            <div>
              <b>{r.title}</b>
              <p className="soft">{r.body}</p>
            </div>
            <button type="button" className="rec-dismiss" onClick={() => dismiss(r.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
