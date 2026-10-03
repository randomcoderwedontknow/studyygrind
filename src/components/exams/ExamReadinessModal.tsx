import { useState } from "react";
import { Star } from "lucide-react";
import type { Exam } from "../../types";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

export function ExamReadinessModal({
  exam,
  open,
  onSubmit,
  onSkip,
}: {
  exam: Exam | null;
  open: boolean;
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, note: string) => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");

  if (!open || !exam) return null;

  return (
    <Modal open={open} onClose={onSkip} title={`${exam.title} — how ready are you?`}>
      <p className="soft">Your exam date has passed. Rate how prepared you felt (helps your readiness journal).</p>
      <div className="reflection-stars" role="group" aria-label="Readiness rating">
        <span className="soft">Readiness</span>
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
      <textarea placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      <div className="row wrap modal-actions">
        <PressableButton variant="ghost" onClick={onSkip}>
          Skip
        </PressableButton>
        <PressableButton onClick={() => onSubmit(rating, note.trim())}>Save</PressableButton>
      </div>
    </Modal>
  );
}
