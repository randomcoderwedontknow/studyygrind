import { ListTodo, Target } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { BETA_FEATURE_TABS } from "../../lib/beta-shell";
import { hapticSelection } from "../../lib/haptics";
import type { Tab } from "../../types";

const BETA_ICONS: Partial<Record<Tab, React.ReactNode>> = {
  routineBuilder: <ListTodo size={18} />,
  goals: <Target size={18} />,
};

export function BetaNavStrip() {
  const { tab, goTab, leaveBetaShell, isBetaShell, TAB_META } = useStudyGrind();
  const items = BETA_FEATURE_TABS.filter((t) => t !== "betaHome");
  if (!isBetaShell || items.length === 0) return null;

  return (
    <div className="beta-nav-strip" role="navigation" aria-label="Beta features">
      <span className="beta-nav-strip-label">Beta</span>
      <div className="beta-nav-strip-items">
        {items.map((id) => (
          <button
            key={id}
            type="button"
            className={`beta-nav-strip-btn ${tab === id ? "active" : ""}`}
            onClick={() => {
              hapticSelection();
              goTab(id);
            }}
          >
            {BETA_ICONS[id]}
            <span>{TAB_META[id].label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="beta-nav-strip-exit ghost" onClick={leaveBetaShell}>
        Exit
      </button>
    </div>
  );
}
