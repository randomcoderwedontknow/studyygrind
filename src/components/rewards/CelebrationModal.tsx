import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Crown, Sparkles, Trophy } from "lucide-react";
import { hapticSuccess } from "../../lib/haptics";
import { playTimerEndSound } from "../../lib/timer-audio";
import type { MilestoneRecord } from "../../types";
import type { TrophyUnlockEvent } from "../../lib/trophies";

export type CelebrationEvent =
  | { kind: "milestone"; record: MilestoneRecord }
  | { kind: "session"; title: string; subtitle?: string; points?: number }
  | { kind: "weeklyTitle"; label: string; threshold: number }
  | { kind: "trophy"; trophy: TrophyUnlockEvent }
  | { kind: "points"; title: string; subtitle?: string; points?: number };

function iconFor(event: CelebrationEvent) {
  if (event.kind === "weeklyTitle") return <Crown size={36} />;
  if (event.kind === "session" || event.kind === "points") return <Sparkles size={36} />;
  if (event.kind === "trophy") return <Trophy size={36} />;
  return <Trophy size={36} />;
}

function titleFor(event: CelebrationEvent): string {
  switch (event.kind) {
    case "milestone":
      return event.record.title;
    case "session":
    case "points":
      return event.title;
    case "weeklyTitle":
      return "Weekly title unlocked!";
    case "trophy":
      return event.trophy.name;
  }
}

function subtitleFor(event: CelebrationEvent): string {
  switch (event.kind) {
    case "milestone":
      return event.record.subtitle;
    case "session":
    case "points":
      return event.subtitle ?? (event.points ? `+${event.points.toLocaleString()} focus points` : "");
    case "weeklyTitle":
      return `${event.label} · ${event.threshold} min this week`;
    case "trophy": {
      const parts = [event.trophy.description];
      const reward = event.trophy.rewardGranted ?? event.trophy.rewardLabel;
      if (reward) parts.push(`Reward: ${reward}`);
      return parts.join(" · ");
    }
  }
}

function tierClass(event: CelebrationEvent): string {
  if (event.kind === "milestone") return `milestone-tier-${event.record.tier}`;
  if (event.kind === "trophy") return `milestone-tier-${event.trophy.tier}`;
  if (event.kind === "weeklyTitle") return "milestone-tier-gold";
  return "milestone-tier-silver";
}

export function CelebrationModal({
  open,
  event,
  onClose,
  soundEffectsEnabled,
  timerEndSoundId,
}: {
  open: boolean;
  event: CelebrationEvent | null;
  onClose: () => void;
  soundEffectsEnabled?: boolean;
  timerEndSoundId?: string;
}) {
  useEffect(() => {
    if (!open || !event) return;
    hapticSuccess();
    playTimerEndSound(timerEndSoundId, soundEffectsEnabled ?? true);
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [open, event, onClose, soundEffectsEnabled, timerEndSoundId]);

  if (!open || !event) return null;

  return createPortal(
    <div className="milestone-celebration-wrap celebration-modal-wrap" role="dialog" aria-label="Celebration">
      <div className={`milestone-celebration ${tierClass(event)} confetti-lite`}>
        <div className="milestone-glow-ring" />
        {iconFor(event)}
        <b>{titleFor(event)}</b>
        <p className="soft">{subtitleFor(event)}</p>
        <button type="button" className="milestone-dismiss" onClick={onClose}>
          Nice!
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** @deprecated use CelebrationModal */
export function MilestoneCelebration({
  open,
  milestone,
  onClose,
}: {
  open: boolean;
  milestone: MilestoneRecord | null;
  onClose: () => void;
}) {
  const event: CelebrationEvent | null = milestone ? { kind: "milestone", record: milestone } : null;
  return <CelebrationModal open={open} event={event} onClose={onClose} />;
}
