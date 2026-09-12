import type { ReactNode } from "react";
import { PressableButton } from "./PressableButton";

export function EmptyState({
  icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-float empty-icon">{icon}</div>
      <b>{title}</b>
      <p className="soft">{hint}</p>
      {actionLabel && onAction && <PressableButton onClick={onAction}>{actionLabel}</PressableButton>}
    </div>
  );
}
