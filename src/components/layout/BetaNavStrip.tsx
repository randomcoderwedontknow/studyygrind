import { ListTodo, Sliders, Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { hapticSelection } from "../../lib/haptics";
import type { Tab } from "../../types";

const BETA_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "focusPresetLab", label: "Presets", icon: <Sliders size={18} /> },
  { id: "routineBuilder", label: "Routines", icon: <ListTodo size={18} /> },
  { id: "goals", label: "Goals", icon: <Target size={18} /> },
];

export function BetaNavStrip() {
  const { tab, goTab, leaveBetaShell, isBetaShell } = useStudyGrind();
  if (!isBetaShell) return null;

  return (
    <div className="beta-nav-strip" role="navigation" aria-label="Beta features">
      <span className="beta-nav-strip-label">Beta</span>
      <div className="beta-nav-strip-items">
        {BETA_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`beta-nav-strip-btn ${tab === item.id ? "active" : ""}`}
            onClick={() => {
              hapticSelection();
              goTab(item.id);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="beta-nav-strip-exit ghost" onClick={leaveBetaShell}>
        Exit
      </button>
    </div>
  );
}
