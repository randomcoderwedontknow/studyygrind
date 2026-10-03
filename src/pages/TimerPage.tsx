import { useEffect, useState } from "react";
import { Minus, Music2, Pause, Play, Plus, Settings2, Sparkles, Square, StickyNote } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { useFocusTimer } from "../context/FocusTimerContext";
import type { SessionMeta } from "../context/FocusTimerContext";
import { formatPointsPreview } from "../lib/points";
import { comboLabel } from "../lib/combo";
import { hapticLight, hapticMedium } from "../lib/haptics";
import { SOUNDSCAPES, previewSoundscape, setSoundscapeVolume, type SoundscapeId } from "../lib/soundscapes";
import { TIMER_END_SOUNDS, previewTimerEndSound, isTimerSoundOwned } from "../lib/timer-audio";
import { SessionReflectionModal } from "../components/timer/SessionReflectionModal";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

export function TimerPage() {
  const { user, updateUser, hasUnlock, selectedTaskId, setSelectedTaskId, applyFocusProfile, saveFocusProfile } = useStudyGrind();
  const timer = useFocusTimer();
  const {
    moodBefore,
    moodAfter,
    setMoodBefore,
    setMoodAfter,
    setRunning,
    finishSession,
    completedFullFocus,
    focusSecondsThisSession,
  } = timer;

  const [showNote, setShowNote] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [draftFocus, setDraftFocus] = useState(user?.focusDurationMin ?? 25);
  const [draftBreak, setDraftBreak] = useState(user?.breakDurationMin ?? 5);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [pendingMinutes, setPendingMinutes] = useState(0);

  const clampFocus = (n: number) => Math.min(180, Math.max(5, Math.round(n) || 25));
  const clampBreak = (n: number) => Math.min(30, Math.max(1, Math.round(n) || 5));

  const [linkMode, setLinkMode] = useState<"general" | "task" | "exam">(() => {
    if (selectedTaskId) return "task";
    if (user?.selectedExamId) return "exam";
    return "general";
  });

  const selectedTask = user?.tasks.find((t) => t.id === selectedTaskId);
  const selectedExam = user?.exams.find((e) => e.id === user.selectedExamId && !e.archived);

  const glowOn = user?.studyGlowEnabled ?? false;
  const particles = hasUnlock("effect-particles");
  const soundscapeId = (user?.soundscapeId ?? "off") as SoundscapeId;
  const soundscapeVolume = user?.soundscapeVolume ?? 0.5;

  useEffect(() => {
    const active = timer.running && glowOn;
    document.body.classList.toggle("study-glow", active);
    document.body.classList.toggle("study-glow-particles", active && particles);
    return () => {
      document.body.classList.remove("study-glow");
      document.body.classList.remove("study-glow-particles");
    };
  }, [timer.running, glowOn, particles]);

  const completeWithMeta = (early: boolean, meta?: SessionMeta) => {
    finishSession(early, meta);
    setReflectionOpen(false);
  };

  const handleEndTimer = () => {
    const studied = Math.floor(focusSecondsThisSession / 60);
    if (studied === 0) {
      completeWithMeta(true);
      return;
    }
    if (completedFullFocus) {
      setPendingMinutes(studied);
      setReflectionOpen(true);
      return;
    }
    completeWithMeta(true);
  };

  if (!user) return null;

  const ringRadius = 120;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - timer.progressRatio);
  const gradId = "timer-ring-gradient";

  const applyPreset = (f: number, b: number) => {
    setDraftFocus(f);
    setDraftBreak(b);
    timer.applyDurations(f, b);
  };

  const stepper = (
    id: string,
    label: string,
    value: number,
    set: (n: number) => void,
    clamp: (n: number) => number,
    step: number,
  ) => (
    <div className="timer-picker-panel">
      <label className="timer-picker-label" htmlFor={id}>
        {label}
      </label>
      <div className="timer-stepper">
        <button type="button" className="ghost icon-btn" aria-label={`Decrease ${label}`} onClick={() => set(clamp(value - step))}>
          <Minus size={16} />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          onBlur={() => set(clamp(value))}
          className="timer-duration-input"
          aria-label={`${label} in minutes`}
        />
        <button type="button" className="ghost icon-btn" aria-label={`Increase ${label}`} onClick={() => set(clamp(value + step))}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <PageTransition stagger>
      <section className={`card timer-card liquid-timer timer-phase-${timer.phase} ${glowOn ? "timer-glow-ready" : ""}`}>
        <div className="timer-liquid-backdrop" aria-hidden="true">
          <div className="timer-blob b1" />
          <div className="timer-blob b2" />
        </div>
        <div className="row timer-head">
          <span className="pill">{timer.phase === "focus" ? "Focus" : "Break"} · {timer.running ? "Running" : "Paused"}</span>
          <span className="pill points-pill">+{timer.pendingPoints} pts pending</span>
        </div>

        <div
          className={`timer-ring-wrap liquid-ring ${timer.running ? "pulse" : ""} ${timer.phase === "focus" && timer.secondsLeft <= 60 && timer.running ? "pulse-last-minute" : ""}`}
          role="timer"
          aria-live="polite"
          aria-label={`${timer.phase} timer ${Math.floor(timer.secondsLeft / 60)} minutes ${timer.secondsLeft % 60} seconds remaining`}
        >
          <svg className="timer-ring" viewBox="0 0 280 280" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="45%" stopColor="var(--primary-2, var(--primary))" />
                <stop offset="100%" stopColor="color-mix(in srgb, var(--primary) 70%, white)" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="140" cy="140" r={ringRadius} />
            <circle
              className="ring-progress"
              cx="140"
              cy="140"
              r={ringRadius}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              stroke={`url(#${gradId})`}
            />
          </svg>
          <div className="clock">
            <small className="timer-phase-label">{timer.phase === "focus" ? "Focus" : "Break"}</small>
            <span className="tabular">
              {String(Math.floor(timer.secondsLeft / 60)).padStart(2, "0")}:{String(timer.secondsLeft % 60).padStart(2, "0")}
            </span>
            <small>
              {linkMode === "task" && selectedTask
                ? selectedTask.title
                : linkMode === "exam" && selectedExam
                  ? selectedExam.title
                  : "General focus"}
            </small>
            {timer.focusBlockCompleted && <small className="break">Full focus block done</small>}
          </div>
        </div>

        {timer.breakMessage && <p className="break timer-break-msg">{timer.breakMessage}</p>}

        <div className="timer-controls liquid-controls">
          <PressableButton variant="ghost" className="icon-btn timer-side-btn" onClick={() => setShowNote((p) => !p)} aria-label="Quick note">
            <StickyNote size={18} />
          </PressableButton>
          <PressableButton
            className="timer-main-btn"
            onClick={() => {
              hapticMedium();
              setRunning(!timer.running);
            }}
          >
            {timer.running ? <Pause size={22} /> : <Play size={22} />}
            {timer.running ? "Pause" : "Start"}
          </PressableButton>
          <PressableButton variant="ghost" className="icon-btn timer-side-btn" onClick={handleEndTimer} aria-label="End timer">
            <Square size={18} />
          </PressableButton>
        </div>

        <div className="timer-mood">
          <span className="eyebrow">{timer.running ? "How do you feel after?" : "How do you feel before?"}</span>
          <div className="chip-group">
            {(timer.running ? ["Proud", "Calm", "Energized", "Drained"] : ["Focused", "Tired", "Stressed", "Motivated"]).map((m) => {
              const active = timer.running ? moodAfter === m : moodBefore === m;
              return (
                <button
                  key={m}
                  type="button"
                  className={`chip ${active ? "chip-active" : ""}`}
                  onClick={() => {
                    hapticLight();
                    if (timer.running) setMoodAfter(m);
                    else setMoodBefore(m);
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        {showNote && (
          <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} placeholder="Overlay notes (not saved)..." />
        )}
      </section>

      <section className="card">
        <h4>
          <Settings2 size={16} /> Session setup
        </h4>
        <div className="timer-picker-grid">
          {stepper("focus-minutes", "Focus (min)", draftFocus, setDraftFocus, clampFocus, 5)}
          {stepper("break-minutes", "Break (min)", draftBreak, setDraftBreak, clampBreak, 1)}
        </div>
        <div className="chip-group" style={{ marginBottom: 12 }}>
          <button type="button" className={`chip ${draftFocus === 25 && draftBreak === 5 ? "chip-active" : ""}`} onClick={() => applyPreset(25, 5)}>
            Pomodoro 25/5
          </button>
          <button type="button" className={`chip ${draftFocus === 50 && draftBreak === 10 ? "chip-active" : ""}`} onClick={() => applyPreset(50, 10)}>
            50/10
          </button>
          <button type="button" className={`chip ${draftFocus === 60 && draftBreak === 10 ? "chip-active" : ""}`} onClick={() => applyPreset(60, 10)}>
            Deep 60/10
          </button>
          <PressableButton onClick={() => timer.applyDurations(draftFocus, draftBreak)}>Apply</PressableButton>
        </div>

        <div className="timer-task-select">
          <label className="soft">Session focus</label>
          <div className="chip-group" style={{ marginBottom: 8 }}>
            {(["general", "task", "exam"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${linkMode === m ? "chip-active" : ""}`}
                onClick={() => {
                  setLinkMode(m);
                  if (m === "general") {
                    setSelectedTaskId("");
                    updateUser({ ...user, selectedExamId: "" });
                  } else if (m === "task") {
                    updateUser({ ...user, selectedExamId: "" });
                  } else {
                    setSelectedTaskId("");
                  }
                }}
              >
                {m === "general" ? "General" : m === "task" ? "Task" : "Exam"}
              </button>
            ))}
          </div>
          {linkMode === "task" && (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              aria-label="Select task for focus session"
            >
              <option value="">Choose a task…</option>
              {user.tasks
                .filter((t) => t.status !== "done")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
            </select>
          )}
          {linkMode === "exam" && (
            <select
              value={user.selectedExamId}
              onChange={(e) => updateUser({ ...user, selectedExamId: e.target.value })}
              aria-label="Select exam for focus session"
            >
              <option value="">Choose an exam…</option>
              {(user.exams ?? [])
                .filter((e) => !e.archived)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="soundscape-card">
          <div className="row">
            <span className="eyebrow">
              <Music2 size={13} /> Soundscape
            </span>
            <small className="soft">{SOUNDSCAPES.find((s) => s.id === soundscapeId)?.hint ?? ""}</small>
          </div>
          <div className="chip-group soundscape-chips">
            {SOUNDSCAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${soundscapeId === s.id ? "chip-active" : ""}`}
                aria-pressed={soundscapeId === s.id}
                onClick={() => {
                  hapticLight();
                  updateUser({ ...user, soundscapeId: s.id });
                  // Timer idle → give a short preview so the choice is audible; also unlocks AudioContext.
                  if (s.id !== "off" && !(timer.running && timer.phase === "focus")) {
                    void previewSoundscape(s.id, soundscapeVolume);
                  }
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
          <label className="soundscape-volume">
            <span className="soft">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(soundscapeVolume * 100)}
              disabled={soundscapeId === "off"}
              aria-label="Soundscape volume"
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setSoundscapeVolume(v);
                updateUser({ ...user, soundscapeVolume: v });
              }}
            />
            <small className="soft tabular">{Math.round(soundscapeVolume * 100)}%</small>
          </label>
          <small className="soft block">Plays during focus, pauses on breaks. Synthesized on-device — no downloads.</small>
        </div>

        <div className="soundscape-card">
          <span className="eyebrow">End sound</span>
          <div className="chip-group soundscape-chips">
            {TIMER_END_SOUNDS.filter((s) => isTimerSoundOwned(s.id, hasUnlock)).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${user.timerEndSoundId === s.id ? "chip-active" : ""}`}
                onClick={() => {
                  hapticLight();
                  updateUser({ ...user, timerEndSoundId: s.id });
                  previewTimerEndSound(s.id);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {user.focusProfiles.length > 0 && (
          <div className="focus-profiles-row" style={{ marginTop: 12 }}>
            <span className="eyebrow">Profiles</span>
            <div className="chip-group">
              {user.focusProfiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${user.activeFocusProfileId === p.id ? "chip-active" : ""}`}
                  onClick={() => applyFocusProfile(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <PressableButton variant="ghost" onClick={() => saveFocusProfile()}>
              Save current preset
            </PressableButton>
          </div>
        )}

        <div className="list" style={{ marginTop: 12 }}>
          <div className="list-row">
            <div>
              <span>Points preview</span>
              <br />
              <small className="soft">{formatPointsPreview(draftFocus, draftBreak, timer.comboMult)}</small>
            </div>
          </div>
          <div className="list-row">
            <div>
              <span>{comboLabel(timer.comboMult)}</span>
              <br />
              <small className="soft">
                {user.loginStreak} day login combo · {timer.pendingBase} base × {timer.comboMult}
                {timer.eventMult > 1 ? ` × ${timer.eventMult} event` : ""}
                {timer.ownerMult > 1 ? ` × ${timer.ownerMult} owner` : ""} = {timer.pendingPoints} pts on end
              </small>
            </div>
          </div>
          <label className="list-row study-glow-toggle">
            <div>
              <span>
                <Sparkles size={14} /> Study Glow Mode
              </span>
              <br />
              <small className="soft">Ambient glow while a session runs</small>
            </div>
            <button
              type="button"
              className={`toggle ${glowOn ? "on" : ""}`}
              aria-label="Toggle study glow"
              onClick={() => {
                hapticLight();
                updateUser({ ...user, studyGlowEnabled: !glowOn });
              }}
            >
              <span />
            </button>
          </label>
        </div>
      </section>

      <SessionReflectionModal
        open={reflectionOpen}
        minutesStudied={pendingMinutes}
        onSubmit={(meta) => completeWithMeta(false, meta)}
        onSkip={() => completeWithMeta(false)}
      />
    </PageTransition>
  );
}
