import { buildWeeklyInsights } from "./session-intelligence";
import { countDueCards } from "./flashcard-due";
import { getWeekKey } from "./week";
import type { UserData } from "../types";

export type Recommendation = { id: string; title: string; body: string };

export function buildRecommendations(user: UserData, dismissed: string[] = []): Recommendation[] {
  const dismiss = new Set(dismissed);
  const recs: Recommendation[] = [];

  const insights = buildWeeklyInsights(user);
  for (const ins of insights.slice(0, 2)) {
    const rid = `insight:${ins.title}`;
    if (!dismiss.has(rid)) recs.push({ id: rid, title: ins.title, body: ins.body });
  }

  const weekKey = getWeekKey();
  const rated = user.sessionLog.filter(
    (s) => s.focusRating && getWeekKey(new Date(s.at)) === weekKey,
  );
  if (rated.length >= 3) {
    const avg = rated.reduce((a, s) => a + (s.focusRating ?? 0), 0) / rated.length;
    const rid = "rating:avg";
    if (!dismiss.has(rid)) {
      recs.push({
        id: rid,
        title: "Focus quality",
        body:
          avg >= 4
            ? "Your self-rated focus is strong this week — keep your current session length."
            : avg <= 2.5
              ? "Sessions feel harder lately — try shorter blocks or fewer distractions."
              : "Your focus ratings are steady — one more session today would help.",
      });
    }
  }

  const sessions = user.sessionLog.filter((s) => getWeekKey(new Date(s.at)) === weekKey);
  if (sessions.length >= 2) {
    const avgLen = sessions.reduce((a, s) => a + s.minutes, 0) / sessions.length;
    const rid = "session:length";
    if (!dismiss.has(rid)) {
      recs.push({
        id: rid,
        title: "Session length",
        body:
          avgLen < 20
            ? "You focus best in shorter sessions — stack a few 15–20 min blocks."
            : "Longer sessions are working — schedule one deep block when you have energy.",
      });
    }
  }

  const due = countDueCards(user.decks);
  if (due > 0) {
    const rid = "flashcards:due";
    if (!dismiss.has(rid)) {
      recs.push({
        id: rid,
        title: "Flashcards due",
        body: `${due} card${due === 1 ? "" : "s"} ready to review — a quick pass keeps memory sharp.`,
      });
    }
  }

  const openTasks = user.tasks.filter((t) => t.status !== "done").length;
  if (openTasks > 0) {
    const rid = "tasks:open";
    if (!dismiss.has(rid)) {
      recs.push({
        id: rid,
        title: "Tasks waiting",
        body: `${openTasks} open task${openTasks === 1 ? "" : "s"} — link one to your next focus session.`,
      });
    }
  }

  if (user.streak >= 2) {
    const rid = "streak:keep";
    if (!dismiss.has(rid)) {
      recs.push({
        id: rid,
        title: "Streak active",
        body: `${user.streak}-day study streak — one session today keeps it alive.`,
      });
    }
  }

  return recs.slice(0, 4);
}
