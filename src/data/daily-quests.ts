import { todayKey } from "../lib/dates";
import type { UserData } from "../types";

export type DailyQuestKind = "minutes" | "tasks" | "flashcards" | "sessions";

export type DailyQuestTemplate = {
  id: string;
  text: string;
  kind: DailyQuestKind;
  target: number;
  reward: number;
  progress: (user: UserData, day: string) => number;
};

const POOL: DailyQuestTemplate[] = [
  {
    id: "min-20",
    text: "Study 20 minutes today",
    kind: "minutes",
    target: 20,
    reward: 150,
    progress: (u, d) => u.weeklyHistory[d] ?? 0,
  },
  {
    id: "min-25",
    text: "Complete a 25-minute focus block",
    kind: "minutes",
    target: 25,
    reward: 180,
    progress: (u, d) => u.weeklyHistory[d] ?? 0,
  },
  {
    id: "min-45",
    text: "Study 45 minutes today",
    kind: "minutes",
    target: 45,
    reward: 250,
    progress: (u, d) => u.weeklyHistory[d] ?? 0,
  },
  {
    id: "tasks-1",
    text: "Complete 1 task today",
    kind: "tasks",
    target: 1,
    reward: 120,
    progress: (u) => u.tasks.filter((t) => t.status === "done").length,
  },
  {
    id: "tasks-2",
    text: "Complete 2 tasks today",
    kind: "tasks",
    target: 2,
    reward: 200,
    progress: (u) => u.tasks.filter((t) => t.status === "done").length,
  },
  {
    id: "cards-5",
    text: "Review 5 flashcards",
    kind: "flashcards",
    target: 5,
    reward: 160,
    progress: (u) => u.flashcardStats.cardsReviewed,
  },
  {
    id: "cards-10",
    text: "Review 10 flashcards",
    kind: "flashcards",
    target: 10,
    reward: 220,
    progress: (u) => u.flashcardStats.cardsReviewed,
  },
  {
    id: "session-1",
    text: "Finish 1 focus session",
    kind: "sessions",
    target: 1,
    reward: 140,
    progress: (u, d) =>
      u.sessionLog.filter((s) => s.at.slice(0, 10) === d && s.phase === "focus" && s.minutes > 0).length,
  },
  {
    id: "session-2",
    text: "Finish 2 focus sessions",
    kind: "sessions",
    target: 2,
    reward: 280,
    progress: (u, d) =>
      u.sessionLog.filter((s) => s.at.slice(0, 10) === d && s.phase === "focus" && s.minutes > 0).length,
  },
  {
    id: "min-15",
    text: "Study 15 minutes today",
    kind: "minutes",
    target: 15,
    reward: 120,
    progress: (u, d) => u.weeklyHistory[d] ?? 0,
  },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function questById(id: string): DailyQuestTemplate | undefined {
  return POOL.find((q) => q.id === id);
}

export function pickDailyQuest(userEmail: string, date = todayKey()): DailyQuestTemplate {
  const idx = hashStr(`${userEmail}:${date}`) % POOL.length;
  return POOL[idx];
}

export function getDailyQuestProgress(user: UserData, template: DailyQuestTemplate): number {
  const day = user.dailyQuestDate || todayKey();
  return Math.min(template.target, template.progress(user, day));
}

export function isDailyQuestComplete(user: UserData, template: DailyQuestTemplate): boolean {
  return getDailyQuestProgress(user, template) >= template.target;
}
