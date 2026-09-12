import { useState } from "react";
import { themes } from "../data/themes";
import { useStudyGrind } from "../context/StudyGrindContext";
import type { OnboardingProfile, ThemeId } from "../types";
import { PressableButton } from "../components/ui/PressableButton";
import { REMINDER_HOUR_OPTIONS } from "../lib/reminder-time";

const GOALS = ["Stay consistent", "Exam prep", "Deep work", "Build habits", "Finish projects"];
const STYLES = ["Balanced", "Short bursts", "Long sessions", "Night owl", "Morning focus"];
const STARTER_THEMES: ThemeId[] = ["green", "ocean", "midnight", "forest", "lavender"];

const STEPS = ["welcome", "timer", "goals", "theme", "notifications", "done"] as const;

export function OnboardingPage() {
  const { store, setStore } = useStudyGrind();
  const step = store.onboardingStep;
  const [draft, setDraft] = useState<OnboardingProfile>(store.onboardingDraft);
  const [welcomeAnim, setWelcomeAnim] = useState(false);

  const saveDraft = (patch: Partial<OnboardingProfile>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setStore((p) => ({ ...p, onboardingDraft: next }));
  };

  const next = () => setStore((p) => ({ ...p, onboardingStep: Math.min(STEPS.length - 1, p.onboardingStep + 1) }));
  const back = () => setStore((p) => ({ ...p, onboardingStep: Math.max(0, p.onboardingStep - 1) }));

  const finish = () => {
    setStore((p) => ({ ...p, onboardingDraft: draft, onboardingStep: 0 }));
    setWelcomeAnim(true);
  };

  if (welcomeAnim) {
    return (
      <div className="auth-shell">
        <div className="center-card onboarding-card welcome-burst page-enter">
          <h1>Welcome to StudyGrind</h1>
          <p>Your preferences are saved. Create an account to start your first focus session.</p>
          <PressableButton
            onClick={() =>
              setStore((p) => ({
                ...p,
                seenOnboarding: true,
                onboardingStep: 0,
                onboardingDraft: draft,
              }))
            }
          >
            Continue to sign in
          </PressableButton>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="center-card onboarding-card page-enter">
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? "dot active" : "dot"} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1>Welcome to StudyGrind</h1>
            <p>A focused study app — timer, tasks, notes, flashcards, and weekly progression.</p>
            <label className="soft">What should we call you?</label>
            <input
              value={draft.displayName}
              onChange={(e) => saveDraft({ displayName: e.target.value })}
              placeholder="Your name"
            />
          </>
        )}

        {step === 1 && (
          <>
            <h1>Focus & break</h1>
            <p>Set default session lengths (you can change these anytime).</p>
            <div className="grid2 onboarding-durations">
              <label className="field">
                <span>Focus (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={180}
                  value={draft.focusDurationMin}
                  onChange={(e) => saveDraft({ focusDurationMin: Number(e.target.value) || 25 })}
                />
              </label>
              <label className="field">
                <span>Break (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={30}
                  value={draft.breakDurationMin}
                  onChange={(e) => saveDraft({ breakDurationMin: Number(e.target.value) || 5 })}
                />
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Your study style</h1>
            <p className="soft">Main goal</p>
            <div className="chip-group">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip ${draft.mainGoal === g ? "chip-active" : ""}`}
                  onClick={() => saveDraft({ mainGoal: g })}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="soft">Study style</p>
            <div className="chip-group">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${draft.studyStyle === s ? "chip-active" : ""}`}
                  onClick={() => saveDraft({ studyStyle: s })}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Pick a theme</h1>
            <div className="onboarding-theme-grid">
              {STARTER_THEMES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`theme-pick ${draft.starterTheme === id ? "active" : ""}`}
                  style={{ background: themes[id].color }}
                  onClick={() => saveDraft({ starterTheme: id })}
                >
                  {themes[id].name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Reminders</h1>
            <p>Optional daily study reminders on the Android app — off by default.</p>
            <p className="soft">Pick an hour in London time (GMT/BST). The web version stores your preference only.</p>
            <div className="list">
              <div className="list-row">
                <span>Enable reminders on Android</span>
                <button
                  type="button"
                  className={`toggle ${draft.notificationPref ? "on" : ""}`}
                  aria-label="Toggle reminders"
                  onClick={() => saveDraft({ notificationPref: !draft.notificationPref })}
                >
                  <span />
                </button>
              </div>
              {draft.notificationPref && (
                <div className="list-row">
                  <div>
                    <span>Reminder time</span>
                    <small className="soft block">London time (GMT/BST)</small>
                  </div>
                  <select
                    className="input compact"
                    aria-label="Reminder hour"
                    value={draft.reminderHour ?? 17}
                    onChange={(e) => saveDraft({ reminderHour: Number(e.target.value), reminderMinute: 0 })}
                  >
                    {REMINDER_HOUR_OPTIONS.map(({ hour, label }) => (
                      <option key={hour} value={hour}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1>You&apos;re set</h1>
            <p>
              Weekly challenges, rotating titles, focus combos, and smart analytics await. Create an account to save
              progress.
            </p>
          </>
        )}

        <div className="onboarding-actions">
          {step > 0 ? (
            <PressableButton variant="ghost" onClick={back}>
              Back
            </PressableButton>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <PressableButton onClick={next}>Next</PressableButton>
          ) : (
            <PressableButton onClick={finish}>Get started</PressableButton>
          )}
        </div>
      </div>
    </div>
  );
}
