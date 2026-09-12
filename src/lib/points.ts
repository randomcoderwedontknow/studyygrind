import { POINTS_PER_FOCUS_SECOND } from "../data/constants";

/** Timer session points: 2 per focus second, always 1x multiplier. */
export function pendingPointsFromFocusSeconds(elapsedFocusSeconds: number): number {
  return Math.floor(Math.max(0, elapsedFocusSeconds) * POINTS_PER_FOCUS_SECOND);
}

export type SessionRewardBreakdown = {
  basePoints: number;
  comboMult: number;
  eventMult: number;
  ownerMult: number;
  finalPoints: number;
};

/** Final payout on End Timer: base × combo × event × owner. */
export function computeSessionReward(
  focusSeconds: number,
  comboMult: number,
  ownerMult = 1,
  eventMult = 1,
): SessionRewardBreakdown {
  const basePoints = pendingPointsFromFocusSeconds(focusSeconds);
  const afterCombo = Math.floor(basePoints * comboMult);
  const afterEvent = Math.floor(afterCombo * eventMult);
  const finalPoints = Math.floor(afterEvent * ownerMult);
  return { basePoints, comboMult, eventMult, ownerMult, finalPoints };
}

export function formatPointsPreview(focusMin: number, breakMin: number, comboMult = 1): string {
  const est = Math.floor(focusMin * 60 * POINTS_PER_FOCUS_SECOND * comboMult);
  return `Focus: ${focusMin} min · Break: ${breakMin} min · ~${est} pts at end`;
}
