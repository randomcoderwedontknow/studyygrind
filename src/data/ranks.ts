import type { UserData } from "../types";

export type StudyRankTier = {
  id: string;
  label: string;
  minMinutes: number;
  catalogHint: string;
};

export const STUDY_RANKS: StudyRankTier[] = [
  { id: "legend", label: "Legendary Studier", minMinutes: 2500, catalogHint: "2500+ total study minutes." },
  { id: "scholar", label: "Top Scholar", minMinutes: 1800, catalogHint: "1800+ total study minutes." },
  { id: "master", label: "Deep Focus", minMinutes: 1200, catalogHint: "1200+ total study minutes." },
  { id: "warrior", label: "Locked In", minMinutes: 600, catalogHint: "600+ total study minutes." },
  { id: "rookie", label: "Building Habits", minMinutes: 200, catalogHint: "200+ total study minutes." },
  { id: "grinder", label: "Steady Learner", minMinutes: 60, catalogHint: "60+ total study minutes." },
  { id: "starter", label: "Starter", minMinutes: 0, catalogHint: "Everyone starts here." },
];

export function studyRankFromUser(u: UserData): StudyRankTier {
  const sorted = [...STUDY_RANKS].sort((a, b) => b.minMinutes - a.minMinutes);
  return sorted.find((r) => u.totalStudyMinutes >= r.minMinutes) ?? STUDY_RANKS[STUDY_RANKS.length - 1];
}

/** Next tier above current (higher minMinutes). Null if already at max. */
export function nextRank(u: UserData): StudyRankTier | null {
  const current = studyRankFromUser(u);
  const asc = [...STUDY_RANKS].sort((a, b) => a.minMinutes - b.minMinutes);
  const idx = asc.findIndex((r) => r.id === current.id);
  if (idx < 0 || idx >= asc.length - 1) return null;
  return asc[idx + 1];
}

export function rankProgress(u: UserData): { percent: number; label: string; atMax: boolean } {
  const current = studyRankFromUser(u);
  const nxt = nextRank(u);
  if (!nxt) {
    return { percent: 100, label: "Max rank reached", atMax: true };
  }
  const span = nxt.minMinutes - current.minMinutes;
  const done = Math.max(0, u.totalStudyMinutes - current.minMinutes);
  const percent = span <= 0 ? 0 : Math.min(100, Math.round((done / span) * 100));
  return {
    percent,
    label: `${u.totalStudyMinutes} / ${nxt.minMinutes} min to ${nxt.label}`,
    atMax: false,
  };
}
