import { Check } from "lucide-react";
import { PressableButton } from "../ui/PressableButton";

type Props = {
  equipped: boolean;
  onEquip: () => void;
  label?: string;
  equippedLabel?: string;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

export function EquipButton({
  equipped,
  onEquip,
  label = "Equip",
  equippedLabel = "Equipped",
  variant = "ghost",
  disabled,
}: Props) {
  if (equipped) {
    return (
      <PressableButton variant="ghost" disabled aria-pressed="true" className="equipped-btn">
        <Check size={14} /> {equippedLabel}
      </PressableButton>
    );
  }
  return (
    <PressableButton variant={variant === "ghost" ? "ghost" : "primary"} onClick={onEquip} disabled={disabled} aria-pressed="false">
      {label}
    </PressableButton>
  );
}
