import { TROPHY_CATALOG, trophyById, type TrophyDef } from "../data/trophies";
import { applyTrophyReward, trophyRewardLabel } from "./trophy-rewards";
import type { UserData } from "../types";

export type TrophyUnlockEvent = {
  id: string;
  name: string;
  tier: TrophyDef["tier"];
  category: TrophyDef["category"];
  description: string;
  rewardLabel?: string;
  rewardGranted?: string;
};

export function isTrophyUnlocked(user: UserData, id: string): boolean {
  return (user.unlockedTrophies ?? []).includes(id);
}

export function detectNewTrophies(prev: UserData, next: UserData): TrophyUnlockEvent[] {
  const unlocked = new Set(next.unlockedTrophies ?? []);
  const out: TrophyUnlockEvent[] = [];
  for (const t of TROPHY_CATALOG) {
    if (unlocked.has(t.id)) continue;
    const was = t.check(prev);
    const now = t.check(next);
    if (!was && now) {
      out.push({
        id: t.id,
        name: t.name,
        tier: t.tier,
        category: t.category,
        description: t.description,
        rewardLabel: t.reward ? trophyRewardLabel(t.reward) : undefined,
      });
    }
  }
  return out;
}

export function applyTrophyUnlocks(user: UserData, events: TrophyUnlockEvent[]): UserData {
  if (!events.length) return user;
  const ids = new Set(user.unlockedTrophies ?? []);
  const dates = { ...(user.trophyUnlockDates ?? {}) };
  const now = new Date().toISOString();
  let u = user;
  const grantedLabels: Record<string, string> = {};

  for (const e of events) {
    ids.add(e.id);
    dates[e.id] = now;
    const def = trophyById(e.id);
    if (def?.reward) {
      const result = applyTrophyReward(u, def.reward);
      u = result.user;
      grantedLabels[e.id] = result.granted;
    }
  }

  for (const e of events) {
    if (grantedLabels[e.id]) e.rewardGranted = grantedLabels[e.id];
  }

  return { ...u, unlockedTrophies: Array.from(ids), trophyUnlockDates: dates };
}

/** Silent backfill for migration — no popups. */
export function backfillTrophies(user: UserData): UserData {
  const ids = new Set(user.unlockedTrophies ?? []);
  const dates = { ...(user.trophyUnlockDates ?? {}) };
  let changed = false;
  for (const t of TROPHY_CATALOG) {
    if (ids.has(t.id)) continue;
    if (t.check(user)) {
      ids.add(t.id);
      dates[t.id] = dates[t.id] ?? user.createdAt ?? new Date().toISOString();
      changed = true;
    }
  }
  if (!changed) return user;
  return { ...user, unlockedTrophies: Array.from(ids), trophyUnlockDates: dates };
}

export { TROPHY_CATALOG, trophyById };
