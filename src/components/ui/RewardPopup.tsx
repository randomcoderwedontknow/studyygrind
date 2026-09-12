import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export function RewardPopup({
  open,
  title,
  subtitle,
  points,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  points?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="reward-popup-wrap">
      <div className="reward-popup reward-pop confetti-lite">
        <Sparkles size={28} />
        <b>{title}</b>
        {subtitle && <p className="soft">{subtitle}</p>}
        {points !== undefined && points > 0 && (
          <p className="break points-ticker">+{points.toLocaleString()} focus points</p>
        )}
      </div>
    </div>
  );
}
