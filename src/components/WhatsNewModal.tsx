import { Sparkles } from "lucide-react";
import { APP_RELEASE_VERSION } from "../data/constants";
import { Modal } from "./ui/Modal";
import { PressableButton } from "./ui/PressableButton";

const BULLETS = [
  "Shop labels now match scaled prices (titles, unlocks, daily colours)",
  "Today's focus colours: buy Normal or Liquid; upgrade pays only the difference",
  "Owned colours: separate Normal / Liquid equip; no cross-equip without buying",
  "Daily rotating themes track classic vs liquid ownership (save migration)",
  "Spin & loot box theme rewards grant Normal variant only",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`What's new in ${APP_RELEASE_VERSION}`}>
      <p className="soft">StudyGrind 12.2.7 — shop prices and theme variants line up with what you pay.</p>
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
