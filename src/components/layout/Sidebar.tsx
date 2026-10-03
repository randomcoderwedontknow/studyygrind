import { Lock, LogOut, Settings } from "lucide-react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { BETA_FEATURE_TABS } from "../../lib/beta-shell";
import type { Tab } from "../../types";

export function Sidebar({
  tabs,
  icons,
  isTabLocked,
}: {
  tabs: Tab[];
  icons: Partial<Record<Tab, React.ReactNode>>;
  isTabLocked: (t: Tab) => boolean;
}) {
  const { user, tab, goTab, TAB_META, setStore, studyRankLabel, isBetaShell, leaveBetaShell } = useStudyGrind();
  if (!user) return null;

  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <div className="sidebar-brand">
        <span className="logo">SG</span>
        <div>
          <b>StudyGrind</b>
          <small>{studyRankLabel}</small>
        </div>
      </div>
      <div className="drawer-list">
        {tabs.map((t) => {
          const meta = TAB_META[t];
          const locked = isTabLocked(t);
          return (
            <button
              key={t}
              type="button"
              className={`drawer-item ${tab === t ? "active" : ""} ${locked ? "locked-hint" : ""}`}
              onClick={() => goTab(t)}
            >
              <span className="drawer-icon">{icons[t]}</span>
              <span className="drawer-label">
                {meta.label}
                {locked && <Lock size={12} className="drawer-lock" />}
              </span>
            </button>
          );
        })}
        {isBetaShell && (
          <>
            <div className="drawer-beta-divider">
              <span>Beta</span>
            </div>
            {BETA_FEATURE_TABS.filter((t) => t !== "betaHome").map((t) => (
              <button
                key={t}
                type="button"
                className={`drawer-item drawer-item-beta ${tab === t ? "active" : ""}`}
                onClick={() => goTab(t)}
              >
                <span className="drawer-icon">{icons[t]}</span>
                <span className="drawer-label">{TAB_META[t].label}</span>
              </button>
            ))}
          </>
        )}
      </div>
      <div className="sidebar-foot">
        {isBetaShell && (
          <button type="button" className="ghost pressable" onClick={() => leaveBetaShell()}>
            Exit beta
          </button>
        )}
        <button type="button" className="ghost pressable" onClick={() => goTab("settings")}>
          <Settings size={16} /> Settings
        </button>
        <button type="button" className="ghost pressable" onClick={() => setStore((p) => ({ ...p, current: "" }))}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
