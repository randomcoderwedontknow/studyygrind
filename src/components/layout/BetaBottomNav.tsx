import { Clock3, Home, ListTodo, Settings, Sliders, Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { hapticSelection } from "../../lib/haptics";
import type { Tab } from "../../types";
import { isAndroid } from "../../lib/native";

type NavItem = { id: Tab; label: string; icon: React.ReactNode };

const ITEMS: NavItem[] = [
  { id: "betaHome", label: "Beta", icon: <Home size={22} /> },
  { id: "timer", label: "Timer", icon: <Clock3 size={24} /> },
  { id: "focusPresetLab", label: "Presets", icon: <Sliders size={22} /> },
  { id: "routineBuilder", label: "Routines", icon: <ListTodo size={22} /> },
  { id: "goals", label: "Goals", icon: <Target size={22} /> },
  { id: "settings", label: "Settings", icon: <Settings size={22} /> },
];

export function BetaBottomNav() {
  const { tab, goTab, timerRunning, user } = useStudyGrind();
  if (!isAndroid) return null;

  return (
    <nav className="bottom-nav liquid-nav beta-bottom-nav" aria-label="Beta navigation">
      {ITEMS.map((item) => {
        const isCenter = item.id === "timer";
        const active = tab === item.id;
        const navLocked =
          timerRunning && user?.focusLockOn && (user.lockedTabs ?? []).includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${active ? "active" : ""} ${isCenter ? "center" : ""} ${navLocked ? "nav-locked" : ""}`}
            aria-disabled={navLocked || undefined}
            onClick={() => {
              hapticSelection();
              goTab(item.id);
            }}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {!isCenter && <span className="nav-pill" aria-hidden="true" />}
            {isCenter ? <span className="nav-fab">{item.icon}</span> : item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
