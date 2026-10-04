import { Sparkles } from "lucide-react";
import { APP_RELEASE_VERSION } from "../data/constants";
import { Modal } from "./ui/Modal";
import { PressableButton } from "./ui/PressableButton";

const BULLETS = [
  "Beta access cleared on update; Preset Lab unlocks in the shop (~50k focus points)",
  "Daily shop economy — prices shift each day; sell owned items back at today's market price",
  "Owned tab lists hubs, titles, themes, and unlocks with sell refunds",
  "New Exams page for countdowns and study targets",
  "Recurring tasks: every day or pick specific dates, then mark each day done",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_RELEASE_VERSION}`}>
      <p className="soft">StudyGrind {APP_RELEASE_VERSION} — economy, exams, and recurring tasks.</p>
      <ul className="soft" style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
        {BULLETS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <PressableButton onClick={onClose}>
        <Sparkles size={16} /> Let's go
      </PressableButton>
    </Modal>
  );
}
