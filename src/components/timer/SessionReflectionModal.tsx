import { useState } from "react";
import { Star } from "lucide-react";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";
import type { SessionMeta } from "../../context/FocusTimerContext";

const DISTRACTIONS = ["Phone", "Noise", "Fatigue", "Hunger", "Social", "Other"];

export function SessionReflectionModal({
  open,
  minutesStudied,
  onSubmit,
  onSkip,
}: {
  open: boolean;
  minutesStudied: number;
  onSubmit: (meta: SessionMeta) => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [distractedBy, setDistractedBy] = useState("");
  const [goalMet, setGoalMet] = useState<boolean | null>(null);
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <Modal open={open} onClose={onSkip} title="Session complete">
      <p className="soft">You finished a full {minutesStudied} min focus block. How did it go?</p>

      <div className="reflection-stars" role="group" aria-label="Focus rating">
        <span className="soft">How focused were you?</span>
        <div className="row">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              className={`star-btn ${rating >= n ? "active" : ""}`}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
            >
              <Star size={22} fill={rating >= n ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>

      <div className="chip-group">
        <span className="soft">What distracted you?</span>
        {DISTRACTIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={`chip ${distractedBy === d ? "chip-active" : ""}`}
            onClick={() => setDistractedBy(distractedBy === d ? "" : d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="row wrap">
        <span className="soft">Did you complete your goal?</span>
        <PressableButton variant={goalMet === true ? "primary" : "ghost"} onClick={() => setGoalMet(true)}>
          Yes
        </PressableButton>
        <PressableButton variant={goalMet === false ? "primary" : "ghost"} onClick={() => setGoalMet(false)}>
          Not quite
        </PressableButton>
      </div>

      <textarea
        className="reflection-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional one-line reflection…"
        rows={2}
      />

      <div className="row wrap modal-actions">
        <PressableButton
          onClick={() =>
            onSubmit({
              focusRating: rating,
              reflection: {
                distractedBy: distractedBy || undefined,
                goalMet: goalMet ?? undefined,
                note: note.trim() || undefined,
              },
            })
          }
        >
          Save & finish
        </PressableButton>
        <PressableButton variant="ghost" onClick={onSkip}>
          Skip
        </PressableButton>
      </div>
    </Modal>
  );
}
