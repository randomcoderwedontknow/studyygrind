import { buildChallengePool, seededPick } from "./generators";

export const CHALLENGE_POOL = buildChallengePool(520);

export function pickWeeklyChallenges(weekKey: string, count = 3): { id: string; text: string }[] {
  return seededPick(CHALLENGE_POOL, `challenges-${weekKey}`, count).map((text, i) => ({
    id: `weekly-challenge-${weekKey}-${i}`,
    text,
  }));
}

export function primaryWeeklyChallenge(weekKey: string): { id: string; text: string } {
  return pickWeeklyChallenges(weekKey, 1)[0];
}
