import { useState } from "react";
import { RefreshCw, Wrench } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { PressableButton } from "../components/ui/PressableButton";

export function MaintenancePage() {
  const { maintenance, refreshMaintenance, user, setStore } = useStudyGrind();
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    await refreshMaintenance();
    setBusy(false);
  };

  return (
    <div className="maintenance-shell">
      <div className="card maintenance-card page-enter">
        <div className="maintenance-icon">
          <Wrench size={32} />
        </div>
        <h2>We&apos;ll be right back</h2>
        <p>{maintenance.message?.trim() || "StudyGrind is undergoing maintenance. Your progress is safe — check back in a little while."}</p>
        {maintenance.updatedAt && (
          <small className="soft">Since {new Date(maintenance.updatedAt).toLocaleString()}</small>
        )}
        <PressableButton onClick={() => void retry()} disabled={busy}>
          <RefreshCw size={16} className={busy ? "spin-icon" : ""} /> {busy ? "Checking..." : "Check again"}
        </PressableButton>
        {user && (
          <PressableButton variant="ghost" onClick={() => setStore((p) => ({ ...p, current: "" }))}>
            Sign out
          </PressableButton>
        )}
      </div>
    </div>
  );
}
