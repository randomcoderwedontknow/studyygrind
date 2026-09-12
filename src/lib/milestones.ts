import { studyRankFromUser } from "../data/ranks";
import type { MilestoneRecord, UserData } from "../types";

export type MilestoneEvent = Omit<MilestoneRecord, "unlockedAt">;

const STREAK_MS: { days: number; title: string; tier: MilestoneRecord["tier"] }[] = [
  { days: 3, title: "3-day study streak", tier: "bronze" },
  { days: 7, title: "Week warrior", tier: "silver" },
  { days: 14, title: "Two-week grind", tier: "gold" },
  { days: 30, title: "Monthly legend", tier: "legend" },
];

const MINUTE_MS: { min: number; title: string; tier: MilestoneRecord["tier"] }[] = [
  { min: 60, title: "First hour", tier: "bronze" },
  { min: 200, title: "Building habits", tier: "silver" },
  { min: 600, title: "Locked in", tier: "gold" },
  { min: 1200, title: "Deep focus master", tier: "legend" },
];

const POINT_MS: { pts: number; title: string; tier: MilestoneRecord["tier"] }[] = [
  { pts: 500, title: "500 focus points", tier: "bronze" },
  { pts: 2000, title: "2K focus points", tier: "silver" },
  { pts: 10000, title: "10K focus points", tier: "gold" },
];

function id(kind: string, key: string) {
  return `${kind}:${key}`;
}

export function detectMilestones(prev: UserData, next: UserData): MilestoneEvent[] {
  const seen = new Set(next.seenMilestones ?? []);
  const out: MilestoneEvent[] = [];

  for (const s of STREAK_MS) {
    const mid = id("streak", String(s.days));
    if (next.streak >= s.days && prev.streak < s.days && !seen.has(mid)) {
      out.push({ id: mid, title: s.title, subtitle: `${s.days} days in a row studying`, tier: s.tier, kind: "streak" });
    }
  }

  for (const m of MINUTE_MS) {
    const mid = id("minutes", String(m.min));
    if (next.totalStudyMinutes >= m.min && prev.totalStudyMinutes < m.min && !seen.has(mid)) {
      out.push({
        id: mid,
        title: m.title,
        subtitle: `${m.min}+ total study minutes`,
        tier: m.tier,
        kind: "minutes",
      });
    }
  }

  for (const p of POINT_MS) {
    const mid = id("points", String(p.pts));
    if (next.focusPoints >= p.pts && prev.focusPoints < p.pts && !seen.has(mid)) {
      out.push({ id: mid, title: p.title, subtitle: `${p.pts.toLocaleString()} focus points`, tier: p.tier, kind: "points" });
    }
  }

  const prevRank = studyRankFromUser(prev).id;
  const nextRank = studyRankFromUser(next).id;
  if (prevRank !== nextRank) {
    const mid = id("rank", nextRank);
    if (!seen.has(mid)) {
      out.push({
        id: mid,
        title: "Rank up!",
        subtitle: studyRankFromUser(next).label,
        tier: "gold",
        kind: "rank",
      });
    }
  }

  for (const a of next.achievements) {
    if (!prev.achievements.includes(a)) {
      const mid = id("achievement", a);
      if (!seen.has(mid)) {
        out.push({ id: mid, title: "Achievement unlocked", subtitle: a, tier: "silver", kind: "achievement" });
      }
    }
  }

  return out;
}

export function applyMilestones(user: UserData, events: MilestoneEvent[]): UserData {
  if (!events.length) return user;
  const now = new Date().toISOString();
  const seen = new Set(user.seenMilestones ?? []);
  const recent = [...(user.recentMilestones ?? [])];
  for (const e of events) {
    seen.add(e.id);
    recent.unshift({ ...e, unlockedAt: now });
  }
  return {
    ...user,
    seenMilestones: Array.from(seen),
    recentMilestones: recent.slice(0, 12),
  };
}
