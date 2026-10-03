import { useState } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import type { StudyRoutineStep } from "../../types";
import { PageTransition } from "../../components/ui/PageTransition";
import { PressableButton } from "../../components/ui/PressableButton";

export function RoutineBuilderPage() {
  const { user, addRoutine, updateRoutine, deleteRoutine, startRoutine } = useStudyGrind();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  if (!user) return null;

  const routines = user.studyRoutines ?? [];
  const selected = routines.find((r) => r.id === selectedId) ?? null;

  const patchSteps = (steps: StudyRoutineStep[]) => {
    if (!selected) return;
    updateRoutine(selected.id, { steps });
  };

  const addStep = (kind: StudyRoutineStep["kind"]) => {
    if (!selected) return;
    let step: StudyRoutineStep;
    if (kind === "focus") step = { id: crypto.randomUUID(), kind: "focus", focusMin: 25, breakMin: 5 };
    else if (kind === "break") step = { id: crypto.randomUUID(), kind: "break", breakMin: 5 };
    else step = { id: crypto.randomUUID(), kind: "prompt", text: "Check your notes" };
    patchSteps([...selected.steps, step]);
  };

  const updateStep = (stepId: string, next: StudyRoutineStep) => {
    if (!selected) return;
    patchSteps(selected.steps.map((s) => (s.id === stepId ? next : s)));
  };

  const removeStep = (stepId: string) => {
    if (!selected) return;
    patchSteps(selected.steps.filter((s) => s.id !== stepId));
  };

  return (
    <PageTransition>
      <section className="card">
        <h4>Routine Builder</h4>
        <p className="soft">Run a routine from the timer — steps apply durations automatically.</p>
        <div className="row wrap">
          <input
            placeholder="Routine name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New routine name"
          />
          <PressableButton
            onClick={() => {
              const id = addRoutine(newName);
              if (id) {
                setSelectedId(id);
                setNewName("");
              }
            }}
          >
            Create
          </PressableButton>
        </div>
      </section>

      <section className="card">
        <h5>Your routines</h5>
        {routines.length === 0 && <p className="soft">No routines yet.</p>}
        {routines.map((r) => (
          <article key={r.id} className={`list-row ${selectedId === r.id ? "selected" : ""}`}>
            <button type="button" className="ghost full-width text-left" onClick={() => setSelectedId(r.id)}>
              <b>{r.name}</b>
              <small className="soft block">{r.steps.length} steps</small>
            </button>
            <div className="row wrap">
              <PressableButton onClick={() => startRoutine(r.id)}>Run</PressableButton>
              <PressableButton variant="ghost" onClick={() => deleteRoutine(r.id)}>
                Delete
              </PressableButton>
            </div>
          </article>
        ))}
      </section>

      {selected && (
        <section className="card beta-editor">
          <h5>Edit {selected.name}</h5>
          <input
            value={selected.name}
            onChange={(e) => updateRoutine(selected.id, { name: e.target.value.slice(0, 48) })}
            aria-label="Routine name"
          />
          {selected.steps.map((step, i) => (
            <div key={step.id} className="card tint beta-step-card">
              <small className="soft">Step {i + 1}</small>
              {step.kind === "focus" && (
                <>
                  <b>Focus block</b>
                  <div className="row wrap">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={step.focusMin}
                      onChange={(e) =>
                        updateStep(step.id, { ...step, focusMin: Number(e.target.value) })
                      }
                      aria-label="Focus minutes"
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={step.breakMin}
                      onChange={(e) =>
                        updateStep(step.id, { ...step, breakMin: Number(e.target.value) })
                      }
                      aria-label="Break minutes"
                    />
                  </div>
                </>
              )}
              {step.kind === "break" && (
                <>
                  <b>Break only</b>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={step.breakMin}
                    onChange={(e) => updateStep(step.id, { ...step, breakMin: Number(e.target.value) })}
                  />
                </>
              )}
              {step.kind === "prompt" && (
                <>
                  <b>Prompt</b>
                  <input
                    value={step.text}
                    onChange={(e) => updateStep(step.id, { ...step, text: e.target.value.slice(0, 120) })}
                  />
                </>
              )}
              <PressableButton variant="ghost" onClick={() => removeStep(step.id)}>
                Remove step
              </PressableButton>
            </div>
          ))}
          <div className="row wrap">
            <PressableButton variant="ghost" onClick={() => addStep("focus")}>
              + Focus
            </PressableButton>
            <PressableButton variant="ghost" onClick={() => addStep("break")}>
              + Break
            </PressableButton>
            <PressableButton variant="ghost" onClick={() => addStep("prompt")}>
              + Prompt
            </PressableButton>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
