import { useStudyGrind } from "../../context/StudyGrindContext";
import { PressableButton } from "../ui/PressableButton";

export function BetaShellGate({ children }: { children: React.ReactNode }) {
  const { isBetaShell, enterBetaShell, goTab } = useStudyGrind();

  if (isBetaShell) return <>{children}</>;

  return (
    <section className="card">
      <h4>Beta feature</h4>
      <p className="soft">Enter the beta area from Settings to use this feature.</p>
      <div className="row wrap">
        <PressableButton onClick={enterBetaShell}>Enter beta area</PressableButton>
        <PressableButton variant="ghost" onClick={() => goTab("settings")}>
          Settings
        </PressableButton>
      </div>
    </section>
  );
}
