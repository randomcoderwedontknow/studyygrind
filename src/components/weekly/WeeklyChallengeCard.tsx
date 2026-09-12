import { Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { getWeekKey, classifyWeek } from "../../lib/week";
import { weeklyTitleOffers, currentWeeklyChallenge } from "../../lib/weekly-rotation";
import { WEEKLY_TITLE_THRESHOLDS } from "../../data/constants";

export function WeeklyChallengeCard() {
  const { user } = useStudyGrind();
  if (!user) return null;
  const weekKey = getWeekKey();
  const rec = user.weeklyRecords?.[weekKey];
  const minutes = rec?.focusMinutes ?? 0;
  const challenge = currentWeeklyChallenge(weekKey);
  const offers = weeklyTitleOffers(weekKey);
  const claimed = user.weeklyThresholdsClaimed?.[weekKey] ?? [];
  const intensity = classifyWeek(minutes);

  return (
    <section className="card weekly-challenge-card">
      <div className="row">
        <h4>
          <Target size={14} /> This week · {weekKey}
        </h4>
        <span className={`pill week-intensity-${intensity}`}>{intensity} week</span>
      </div>
      <p className="break">{challenge.text}</p>
      <p className="soft">
        {minutes} focus minutes this week · {intensity === "heavy" ? "Strong grind!" : intensity === "moderate" ? "Building momentum" : "Room to grow"}
      </p>
      <div className="rank-progress-bar">
        <div
          className="rank-progress-fill"
          style={{ width: `${Math.min(100, Math.round((minutes / WEEKLY_TITLE_THRESHOLDS[WEEKLY_TITLE_THRESHOLDS.length - 1]) * 100))}%` }}
        />
      </div>
      <ul className="weekly-title-offers">
        {offers.map((o) => (
          <li key={o.id} className={claimed.includes(o.threshold) ? "claimed" : minutes >= o.threshold ? "ready" : ""}>
            <span>{o.threshold}m</span>
            <b>{o.label}</b>
            {claimed.includes(o.threshold) && <small>Owned</small>}
          </li>
        ))}
      </ul>
    </section>
  );
}
