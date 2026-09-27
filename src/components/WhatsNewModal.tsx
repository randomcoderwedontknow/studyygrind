import { Sparkles } from "lucide-react";
import { APP_RELEASE_VERSION } from "../data/constants";
import { Modal } from "./ui/Modal";
import { PressableButton } from "./ui/PressableButton";

const BULLETS = [
  "Liquid redesign across the app",
  "Sick liquid focus timer with smooth ring & blobs",
  "Backup & restore your progress",
  "4 home-screen widgets (3 sizes each)",
  "New soundscapes + daily shop deal",
  "Study calendar fires in Analytics",
  "Exam countdown on Tasks",
  "Timer controls from notification shade",
  "Voice-to-text notes",
  "Purple Exam mode for flashcards",
  "Liquid themes + Theme Studio refresh",
  "Dedicated Accessibility page",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_RELEASE_VERSION}`}>
      <p className="soft">Thanks for updating StudyGrind — here is what landed in this release.</p>
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
