import { Sparkles } from "lucide-react";
import { APP_RELEASE_VERSION } from "../data/constants";
import { Modal } from "./ui/Modal";
import { PressableButton } from "./ui/PressableButton";

const BULLETS = [
  "Preset Lab is in the main app — save and apply full timer setups from the menu or timer",
  "Revamped preset editor: soundscapes, volume, end sounds, and focus-lock tabs",
  "Number fields let you clear and retype (timer durations, goals, tasks, onboarding)",
  "Beta program paused in this release while we polish Preset Lab",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_RELEASE_VERSION}`}>
      <p className="soft">StudyGrind {APP_RELEASE_VERSION} — Preset Lab and input fixes.</p>
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
