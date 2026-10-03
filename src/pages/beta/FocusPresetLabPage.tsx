import { useState } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import type { FocusProfile } from "../../types";
import { SOUNDSCAPES } from "../../lib/soundscapes";
import { TIMER_END_SOUNDS } from "../../lib/timer-audio";
import { PageTransition } from "../../components/ui/PageTransition";
import { PressableButton } from "../../components/ui/PressableButton";

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

export function FocusPresetLabPage() {
  const { user, upsertFocusProfile, deleteFocusProfile, applyFocusProfile, goTab, maxFocusProfiles } = useStudyGrind();
  const [editing, setEditing] = useState<FocusProfile | null>(null);

  if (!user) return null;

  const startNew = () => {
    if (user.focusProfiles.length >= maxFocusProfiles()) {
      return;
    }
    setEditing(emptyProfile());
  };

  const save = () => {
    if (!editing) return;
    if (upsertFocusProfile(editing)) setEditing(null);
  };

  return (
    <PageTransition>
      <section className="card">
        <h4>Focus Preset Lab</h4>
        <p className="soft">Presets sync with the timer. Limit: {maxFocusProfiles()}.</p>
        <PressableButton onClick={startNew}>New preset</PressableButton>
      </section>

      {editing && (
        <section className="card beta-editor">
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value.slice(0, 24) })}
            aria-label="Preset name"
          />
          <label className="soft">Focus (min)</label>
          <input
            type="number"
            min={5}
            max={180}
            value={editing.focusDurationMin}
            onChange={(e) => setEditing({ ...editing, focusDurationMin: Number(e.target.value) })}
          />
          <label className="soft">Break (min)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={editing.breakDurationMin}
            onChange={(e) => setEditing({ ...editing, breakDurationMin: Number(e.target.value) })}
          />
          <label className="soft">Soundscape</label>
          <select
            value={editing.soundscapeId}
            onChange={(e) => setEditing({ ...editing, soundscapeId: e.target.value })}
          >
            {SOUNDSCAPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="soft">End sound</label>
          <select
            value={editing.timerEndSoundId}
            onChange={(e) => setEditing({ ...editing, timerEndSoundId: e.target.value })}
          >
            {TIMER_END_SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="setting-row">
            <span>Focus lock default</span>
            <button
              type="button"
              className={`toggle ${editing.focusLockOn ? "on" : ""}`}
              onClick={() => setEditing({ ...editing, focusLockOn: !editing.focusLockOn })}
              aria-pressed={editing.focusLockOn}
            >
              <span />
            </button>
          </div>
          <div className="row wrap">
            <PressableButton onClick={save}>Save preset</PressableButton>
            <PressableButton variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </PressableButton>
          </div>
        </section>
      )}

      <section className="card">
        <h5>Saved presets</h5>
        {user.focusProfiles.length === 0 && <p className="soft">No presets yet.</p>}
        {user.focusProfiles.map((p) => (
          <article key={p.id} className="list-row beta-preset-row">
            <div>
              <b>{p.name}</b>
              <small className="soft block">
                {p.focusDurationMin}m focus · {p.breakDurationMin}m break · {p.soundscapeId}
              </small>
            </div>
            <div className="row wrap">
              <PressableButton variant="ghost" onClick={() => setEditing({ ...p })}>
                Edit
              </PressableButton>
              <PressableButton
                onClick={() => {
                  applyFocusProfile(p.id);
                  goTab("timer");
                }}
              >
                Apply
              </PressableButton>
              {p.id !== "default" && (
                <PressableButton variant="ghost" onClick={() => deleteFocusProfile(p.id)}>
                  Delete
                </PressableButton>
              )}
            </div>
          </article>
        ))}
      </section>
    </PageTransition>
  );
}
