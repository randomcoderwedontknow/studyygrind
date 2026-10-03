import { useState } from "react";
import { Lock } from "lucide-react";
import type { Tab, UserData } from "../../types";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

export const FOCUS_LOCK_TAB_OPTIONS: Tab[] = ["shop", "cards", "games", "notes", "analytics", "profile"];

export const DEFAULT_LOCKED_TABS: Tab[] = ["shop", "games", "cards"];

export function focusLockSummary(lockedTabs: Tab[]): string {
  if (!lockedTabs.length) return "No tabs selected";
  return lockedTabs.join(", ");
}

type RowProps = {
  user: UserData;
  onChange: (next: UserData) => void;
  onOpenPicker: () => void;
};

export function FocusLockRow({ user, onChange, onOpenPicker }: RowProps) {
  return (
    <div className="grouped-list-row">
      <div>
        <b>
          <Lock size={14} /> Focus lock
        </b>
        <p className="soft">
          {user.focusLockOn ? "On" : "Off"}
          {user.focusLockOn ? ` · ${focusLockSummary(user.lockedTabs)}` : " · block tabs during sessions"}
        </p>
      </div>
      <button
        type="button"
        className={`toggle ${user.focusLockOn ? "on" : ""}`}
        aria-label="Toggle focus lock"
        onClick={() => {
          if (user.focusLockOn) onChange({ ...user, focusLockOn: false });
          else onOpenPicker();
        }}
      >
        <span />
      </button>
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  user: UserData;
  onApply: (lockedTabs: Tab[]) => void;
};

export function FocusLockModal({ open, onClose, user, onApply }: ModalProps) {
  const [draft, setDraft] = useState<Tab[]>(user.lockedTabs.length ? user.lockedTabs : DEFAULT_LOCKED_TABS);

  const toggle = (tab: Tab) => {
    setDraft((prev) => (prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab]));
  };

  return (
    <Modal
      open={open}
      title="Focus lock tabs"
      onClose={onClose}
      footer={
        <PressableButton
          onClick={() => {
            const tabs = draft.length ? draft : DEFAULT_LOCKED_TABS;
            onApply(tabs);
            onClose();
          }}
        >
          Apply lock
        </PressableButton>
      }
    >
      <p className="soft">Choose tabs to block while a focus session is running:</p>
      <div className="chip-group">
        {FOCUS_LOCK_TAB_OPTIONS.map((p) => (
          <button key={p} type="button" className={`chip ${draft.includes(p) ? "chip-active" : ""}`} onClick={() => toggle(p)}>
            {p}
          </button>
        ))}
      </div>
    </Modal>
  );
}
