import { BookOpen, CheckSquare, Clock3, Flame } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { todayKey } from "../../lib/dates";
import { countDueCards } from "../../lib/flashcard-due";
import { PressableButton } from "../ui/PressableButton";

export function TodaySection() {
  const { user, goTab } = useStudyGrind();
  if (!user) return null;

  const today = todayKey();
  const todayMins = user.weeklyHistory[today] ?? 0;
  const openTasks = user.tasks.filter((t) => t.status !== "done");
  const dueCards = countDueCards(user.decks);
  const dueToday = openTasks
    .filter((t) => t.dueDate && t.dueDate <= today)
    .slice(0, 2);

  return (
    <section className="card today-section">
      <div className="today-section-head">
        <h4>Today</h4>
        <span className="pill">{today}</span>
      </div>
      <div className="today-grid">
        <article className="today-stat">
          <Clock3 size={16} />
          <div>
            <small>Focus today</small>
            <b>{todayMins}m</b>
          </div>
        </article>
        <article className="today-stat">
          <Flame size={16} />
          <div>
            <small>Study streak</small>
            <b>{user.streak}d</b>
          </div>
        </article>
        <article className="today-stat">
          <CheckSquare size={16} />
          <div>
            <small>Open tasks</small>
            <b>{openTasks.length}</b>
          </div>
        </article>
        <article className="today-stat">
          <BookOpen size={16} />
          <div>
            <small>Due cards</small>
            <b>{dueCards}</b>
          </div>
        </article>
      </div>
      {dueToday.length > 0 && (
        <ul className="today-task-list soft">
          {dueToday.map((t) => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ul>
      )}
      <div className="row wrap today-actions">
        <PressableButton onClick={() => goTab("timer")}>Start focus</PressableButton>
        {dueCards > 0 && (
          <PressableButton variant="ghost" onClick={() => goTab("cards")}>
            Review flashcards
          </PressableButton>
        )}
        {openTasks.length > 0 && (
          <PressableButton variant="ghost" onClick={() => goTab("tasks")}>
            View tasks
          </PressableButton>
        )}
      </div>
    </section>
  );
}
