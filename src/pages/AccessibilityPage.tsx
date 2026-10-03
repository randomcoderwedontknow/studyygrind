import { Accessibility } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { applyAccessibilityToBody } from "../lib/accessibility-body";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import type { AccessibilityPrefs } from "../types";

export function AccessibilityPage() {
  const { user, updateUser, goTab } = useStudyGrind();
  if (!user) return null;

  const a = user.accessibility;

  const patch = (next: Partial<AccessibilityPrefs>) => {
    const accessibility = { ...a, ...next };
    applyAccessibilityToBody(accessibility);
    updateUser({ ...user, accessibility });
  };

  return (
    <PageTransition stagger>
      <section className="hero-panel liquid-surface">
        <h4>
          <Accessibility size={16} /> Accessibility
        </h4>
        <p>Motion, reading comfort, contrast, touch targets, and haptics.</p>
      </section>

      <section className="card liquid-surface">
        <div className="list-row">
          <span>Use Liquid UI surfaces</span>
          <button
            type="button"
            className={`toggle ${a.liquidUiEnabled !== false ? "on" : ""}`}
            aria-pressed={a.liquidUiEnabled !== false}
            onClick={() => patch({ liquidUiEnabled: a.liquidUiEnabled === false ? true : false })}
          >
            <span />
          </button>
        </div>
        <div className="list-row">
          <span>Reduce motion</span>
          <button type="button" className={`toggle ${a.reduceMotion ? "on" : ""}`} aria-pressed={a.reduceMotion} onClick={() => patch({ reduceMotion: !a.reduceMotion })}>
            <span />
          </button>
        </div>
        <div className="list-row">
          <span>High contrast liquid</span>
          <button type="button" className={`toggle ${a.highContrast ? "on" : ""}`} aria-pressed={a.highContrast} onClick={() => patch({ highContrast: !a.highContrast })}>
            <span />
          </button>
        </div>
        <div className="list-row">
          <span>Larger touch targets</span>
          <button type="button" className={`toggle ${a.largeTargets ? "on" : ""}`} aria-pressed={a.largeTargets} onClick={() => patch({ largeTargets: !a.largeTargets })}>
            <span />
          </button>
        </div>
        <label className="soft">Text size</label>
        <div className="chip-group">
          {(["default", "large", "xl"] as const).map((scale) => (
            <button key={scale} type="button" className={`chip ${a.textScale === scale ? "chip-active" : ""}`} onClick={() => patch({ textScale: scale })}>
              {scale === "default" ? "Default" : scale === "large" ? "Large" : "Extra large"}
            </button>
          ))}
        </div>
        <label className="soft">Haptic feedback</label>
        <div className="chip-group">
          {(["off", "light", "normal"] as const).map((level) => (
            <button key={level} type="button" className={`chip ${a.hapticLevel === level ? "chip-active" : ""}`} onClick={() => patch({ hapticLevel: level })}>
              {level}
            </button>
          ))}
        </div>
      </section>

      <PressableButton variant="ghost" onClick={() => goTab("settings")}>
        Back to settings
      </PressableButton>
    </PageTransition>
  );
}
