import { Sparkles } from "lucide-react";
import { APP_RELEASE_VERSION } from "../data/constants";
import { Modal } from "./ui/Modal";
import { PressableButton } from "./ui/PressableButton";

const BULLETS = [
  "Beta program ended for everyone on update (including owner) — no beta shell",
  "Preset Lab is in the Shop (~50k focus points, daily price) — save full timer setups",
  "Daily shop economy: prices move each day within safe floors and ceilings",
  "Sell anything you own (titles, themes, hubs, unlocks) at today's market price",
  "Shop → Owned shows your full inventory, not just themes",
  "New Exams page — countdown, study targets, timer linked to each exam (drawer / More)",
  "Recurring tasks: every day or pick dates; mark each day done before moving to Done",
  "Easier number editing — backspace and retype in timer, tasks, and shop fields",
  "Android: switching apps for ~30 minutes should not cold-refresh your session",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_RELEASE_VERSION}`}>
      <p className="soft">
        StudyGrind {APP_RELEASE_VERSION} — shop economy, sell-back, Exams, recurring tasks, Preset Lab unlock, and
        smoother Android background return.
      </p>
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
