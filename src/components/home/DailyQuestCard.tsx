import { Gift, Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { getDailyQuestProgress, isDailyQuestComplete } from "../../data/daily-quests";
import { PressableButton } from "../ui/PressableButton";

export function DailyQuestCard() {
  const { user, getDailyQuest, claimDailyQuest } = useStudyGrind();
  if (!user) return null;
  const template = getDailyQuest();
  if (!template) return null;
  const progress = getDailyQuestProgress(user, template);
  const done = isDailyQuestComplete(user, template);
  const pct = Math.min(100, Math.round((progress / template.target) * 100));

  return (
    <section className="card daily-quest-card">
      <div className="row">
        <h4>
          <Target size={16} /> Daily study quest
        </h4>
        <span className="pill">{template.reward} pts</span>
      </div>
      <p>{template.text}</p>
      <div className="rank-progress-bar" aria-label={`Quest progress ${pct}%`}>
        <div className="rank-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <small className="soft">
        {progress} / {template.target}
        {user.dailyQuestClaimed ? " · Claimed" : done ? " · Ready to claim" : ""}
      </small>
      <div className="row" style={{ marginTop: 12 }}>
        <PressableButton disabled={!done || user.dailyQuestClaimed} onClick={() => claimDailyQuest()}>
          <Gift size={14} /> {user.dailyQuestClaimed ? "Claimed" : "Claim reward"}
        </PressableButton>
      </div>
    </section>
  );
}
