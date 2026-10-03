import { FlaskConical } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { isAndroid } from "../../lib/native";
import { BetaBottomNav } from "./BetaBottomNav";
import { FloatingMiniTimer } from "../timer/FloatingMiniTimer";
import { PressableButton } from "../ui/PressableButton";

const BETA_NAV_DESKTOP: { id: import("../../types").Tab; label: string }[] = [
  { id: "betaHome", label: "Hub" },
  { id: "timer", label: "Timer" },
  { id: "focusPresetLab", label: "Preset Lab" },
  { id: "routineBuilder", label: "Routines" },
  { id: "goals", label: "Goals" },
  { id: "settings", label: "Settings" },
];

export function BetaAppShell({ children }: { children: React.ReactNode }) {
  const { user, tab, goTab, toast, leaveBetaShell, TAB_META: meta } = useStudyGrind();
  if (!user) return null;

  const pageTitle = meta[tab]?.label ?? "Beta";

  return (
    <div className="app liquid-app beta-app">
      <div className="app-body beta-app-body">
        {!isAndroid && (
          <aside className="beta-sidebar">
            <div className="beta-sidebar-head">
              <FlaskConical size={18} />
              <b>Beta area</b>
            </div>
            <nav className="beta-sidebar-nav">
              {BETA_NAV_DESKTOP.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`beta-nav-item ${tab === item.id ? "active" : ""}`}
                  onClick={() => goTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <PressableButton variant="ghost" className="beta-leave-btn" onClick={leaveBetaShell}>
              Leave beta
            </PressableButton>
          </aside>
        )}

        <div className="app-main">
          <header className="topbar liquid-topbar beta-topbar">
            <div className="topbar-left">
              <div className="topbar-title">
                <b>{pageTitle}</b>
                <small>Beta program · {user.username}</small>
              </div>
            </div>
            <div className="topbar-actions">
              {isAndroid && (
                <PressableButton variant="ghost" onClick={leaveBetaShell}>
                  Exit beta
                </PressableButton>
              )}
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>

      {isAndroid && <BetaBottomNav />}
      {toast && <div className="toast">{toast}</div>}
      <FloatingMiniTimer />
    </div>
  );
}
