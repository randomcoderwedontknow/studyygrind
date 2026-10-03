import { useMemo, useState } from "react";
import { Clock3, Copy, Music2, Sliders, Trash2, Volume2 } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import type { FocusProfile, Tab } from "../types";
import { SOUNDSCAPES, previewSoundscape } from "../lib/soundscapes";
import { TIMER_END_SOUNDS, isTimerSoundOwned, previewTimerEndSound } from "../lib/timer-audio";
import { clampInteger } from "../lib/numeric-input";
import { FOCUS_LOCK_TAB_OPTIONS } from "../components/focus/FocusLockSetup";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { NumericInput } from "../components/ui/NumericInput";
import { Modal } from "../components/ui/Modal";
import { hapticLight } from "../lib/haptics";

function emptyProfile(): FocusProfile {
  return {
    id: crypto.randomUUID(),
    name: "New preset",
    focusDurationMin: 25,
    breakDurationMin: 5,
    soundscapeId: "off",
    soundscapeVolume: 0.5,
    timerEndSoundId: "default",
    focusLockOn: false,
    lockedTabs: [],
  };
}

function normalizeProfile(p: FocusProfile): FocusProfile {
  return {
    ...p,
    name: p.name.trim().slice(0, 24) || "Preset",
    focusDurationMin: clampInteger(p.focusDurationMin, 5, 180, 25),
    breakDurationMin: clampInteger(p.breakDurationMin, 1, 30, 5),
    soundscapeVolume: Math.min(1, Math.max(0, p.soundscapeVolume ?? 0.5)),
    lockedTabs: (p.lockedTabs ?? []).filter((t): t is Tab => FOCUS_LOCK_TAB_OPTIONS.includes(t as Tab)),
  };
}

export function FocusPresetLabPage() {
  const { user, upsertFocusProfile, deleteFocusProfile, applyFocusProfile, goTab, maxFocusProfiles, hasUnlock } =
    useStudyGrind();
  const [editing, setEditing] = useState<FocusProfile | null>(null);
  const cap = maxFocusProfiles();

  const activeId = user?.activeFocusProfileId ?? "default";

  const sortedProfiles = useMemo(() => {
    if (!user) return [];
    return [...user.focusProfiles].sort((a, b) => {
      if (a.id === activeId) return -1;
      if (b.id === activeId) return 1;
      if (a.id === "default") return -1;
      if (b.id === "default") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [user, activeId]);

  if (!user) return null;

  const startNew = () => {
    if (user.focusProfiles.length >= cap) return;
    setEditing(emptyProfile());
  };

  const save = () => {
    if (!editing) return;
    if (upsertFocusProfile(normalizeProfile(editing))) setEditing(null);
  };

  const duplicate = (p: FocusProfile) => {
    if (user.focusProfiles.length >= cap) return;
    setEditing({
      ...p,
      id: crypto.randomUUID(),
      name: `${p.name} copy`.slice(0, 24),
    });
  };

  const toggleLockTab = (tab: Tab) => {
    if (!editing) return;
    const locked = editing.lockedTabs ?? [];
    const next = locked.includes(tab) ? locked.filter((t) => t !== tab) : [...locked, tab];
    setEditing({ ...editing, lockedTabs: next });
  };

  return (
    <PageTransition stagger>
      <section className="card preset-lab-hero">
        <div className="preset-lab-hero-head">
          <span className="preset-lab-icon" aria-hidden="true">
            <Sliders size={22} />
          </span>
          <div>
            <h4>Preset Lab</h4>
            <p className="soft">Save focus length, soundscape, end chime, and focus-lock defaults — then apply from here or the timer.</p>
          </div>
        </div>
        <div className="row wrap preset-lab-hero-actions">
          <span className="pill">
            {user.focusProfiles.length}/{cap} slots
          </span>
          <PressableButton onClick={startNew} disabled={user.focusProfiles.length >= cap}>
            New preset
          </PressableButton>
          <PressableButton variant="ghost" onClick={() => goTab("timer")}>
            <Clock3 size={16} /> Open timer
          </PressableButton>
        </div>
      </section>

      {sortedProfiles.length === 0 && (
        <section className="card preset-lab-empty">
          <p>No presets yet. Create one to swap entire timer setups in one tap.</p>
        </section>
      )}

      <div className="preset-lab-grid">
        {sortedProfiles.map((p) => {
          const scape = SOUNDSCAPES.find((s) => s.id === p.soundscapeId);
          const endSound = TIMER_END_SOUNDS.find((s) => s.id === p.timerEndSoundId);
          const isActive = p.id === activeId;
          return (
            <article key={p.id} className={`card preset-lab-card ${isActive ? "preset-lab-card-active" : ""}`}>
              <div className="preset-lab-card-top">
                <b>{p.name}</b>
                {isActive && <span className="pill preset-lab-active-pill">Active</span>}
              </div>
              <p className="soft preset-lab-meta">
                {p.focusDurationMin}m focus · {p.breakDurationMin}m break
              </p>
              <p className="soft preset-lab-meta">
                <Music2 size={12} /> {scape?.name ?? p.soundscapeId}
                {p.soundscapeId !== "off" && ` · ${Math.round((p.soundscapeVolume ?? 0.5) * 100)}%`}
              </p>
              <p className="soft preset-lab-meta">
                End: {endSound?.label ?? p.timerEndSoundId}
                {p.focusLockOn ? " · Lock on" : ""}
              </p>
              <div className="row wrap preset-lab-card-actions">
                <PressableButton
                  onClick={() => {
                    applyFocusProfile(p.id);
                    goTab("timer");
                  }}
                >
                  Apply
                </PressableButton>
                <PressableButton variant="ghost" onClick={() => setEditing({ ...p })}>
                  Edit
                </PressableButton>
                <PressableButton variant="ghost" onClick={() => duplicate(p)} disabled={user.focusProfiles.length >= cap}>
                  <Copy size={14} /> Duplicate
                </PressableButton>
                {p.id !== "default" && (
                  <PressableButton variant="ghost" onClick={() => deleteFocusProfile(p.id)}>
                    <Trash2 size={14} /> Delete
                  </PressableButton>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(editing)}
        title={editing && user.focusProfiles.some((p) => p.id === editing.id) ? "Edit preset" : "New preset"}
        onClose={() => setEditing(null)}
        footer={
          <div className="row wrap">
            <PressableButton onClick={save}>Save preset</PressableButton>
            <PressableButton variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </PressableButton>
          </div>
        }
      >
        {editing && (
          <div className="preset-lab-editor">
            <label className="field">
              <span className="soft">Name</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value.slice(0, 24) })}
                aria-label="Preset name"
                autoFocus
              />
            </label>
            <div className="grid2">
              <label className="field">
                <span className="soft">Focus (min)</span>
                <NumericInput
                  min={5}
                  max={180}
                  fallback={25}
                  value={editing.focusDurationMin}
                  onChange={(n) => setEditing({ ...editing, focusDurationMin: n })}
                />
              </label>
              <label className="field">
                <span className="soft">Break (min)</span>
                <NumericInput
                  min={1}
                  max={30}
                  fallback={5}
                  value={editing.breakDurationMin}
                  onChange={(n) => setEditing({ ...editing, breakDurationMin: n })}
                />
              </label>
            </div>

            <div>
              <span className="soft">Soundscape</span>
              <div className="chip-group" style={{ marginTop: 8 }}>
                {SOUNDSCAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${editing.soundscapeId === s.id ? "chip-active" : ""}`}
                    onClick={() => {
                      hapticLight();
                      setEditing({ ...editing, soundscapeId: s.id });
                      if (s.id !== "off") void previewSoundscape(s.id, editing.soundscapeVolume ?? 0.5);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {editing.soundscapeId !== "off" && (
              <label className="soundscape-volume">
                <span className="soft">
                  <Volume2 size={13} /> Volume
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((editing.soundscapeVolume ?? 0.5) * 100)}
                  onChange={(e) =>
                    setEditing({ ...editing, soundscapeVolume: Number(e.target.value) / 100 })
                  }
                />
              </label>
            )}

            <div>
              <span className="soft">Timer end sound</span>
              <div className="chip-group" style={{ marginTop: 8 }}>
                {TIMER_END_SOUNDS.filter((s) => s.id === "default" || isTimerSoundOwned(s.id, hasUnlock)).map(
                  (s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`chip ${editing.timerEndSoundId === s.id ? "chip-active" : ""}`}
                      onClick={() => {
                        setEditing({ ...editing, timerEndSoundId: s.id });
                        void previewTimerEndSound(s.id);
                      }}
                    >
                      {s.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="setting-row">
              <span>Enable focus lock with this preset</span>
              <button
                type="button"
                className={`toggle ${editing.focusLockOn ? "on" : ""}`}
                onClick={() => setEditing({ ...editing, focusLockOn: !editing.focusLockOn })}
                aria-pressed={editing.focusLockOn}
              >
                <span />
              </button>
            </div>

            {editing.focusLockOn && (
              <div>
                <span className="soft">Tabs to block during focus</span>
                <div className="chip-group" style={{ marginTop: 8 }}>
                  {FOCUS_LOCK_TAB_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${(editing.lockedTabs ?? []).includes(t) ? "chip-active" : ""}`}
                      onClick={() => toggleLockTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
