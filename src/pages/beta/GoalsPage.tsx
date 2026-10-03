import { useState } from "react";
import { useStudyGrind } from "../../context/StudyGrindContext";
import { PageTransition } from "../../components/ui/PageTransition";
import { PressableButton } from "../../components/ui/PressableButton";

export function GoalsPage() {
  const { user, addGoal, updateGoal, deleteGoal } = useStudyGrind();
  const [newTitle, setNewTitle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState("");

  if (!user) return null;

  const goals = user.semesterGoals ?? [];

  return (
    <PageTransition>
      <section className="card">
        <h4>Goals</h4>
        <p className="soft">Long-term targets with milestones — separate from exams on Tasks.</p>
        <div className="row wrap">
          <input
            placeholder="Goal title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            aria-label="New goal title"
          />
          <PressableButton
            onClick={() => {
              const id = addGoal(newTitle);
              if (id) {
                setExpandedId(id);
                setNewTitle("");
              }
            }}
          >
            Add goal
          </PressableButton>
        </div>
      </section>

      {goals.length === 0 && (
        <section className="card">
          <p className="soft">No goals yet. Add one above.</p>
        </section>
      )}

      {goals.map((g) => {
        const done = g.milestones.filter((m) => m.done).length;
        const total = g.milestones.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const open = expandedId === g.id;
        return (
          <section key={g.id} className="card beta-goal-card">
            <div className="row wrap">
              <div>
                <b>{g.title}</b>
                {g.targetDate && <small className="soft block">Target: {g.targetDate}</small>}
                <small className="soft block">
                  {total ? `${pct}% · ${done}/${total} milestones` : "No milestones yet"}
                </small>
              </div>
              <PressableButton variant="ghost" onClick={() => setExpandedId(open ? null : g.id)}>
                {open ? "Close" : "Edit"}
              </PressableButton>
            </div>
            {open && (
              <>
                <label className="soft">Notes</label>
                <textarea
                  value={g.notes ?? ""}
                  onChange={(e) => updateGoal(g.id, { notes: e.target.value.slice(0, 500) })}
                  rows={2}
                />
                <label className="soft">Target date</label>
                <input
                  type="date"
                  value={g.targetDate ?? ""}
                  onChange={(e) => updateGoal(g.id, { targetDate: e.target.value })}
                />
                <h5>Milestones</h5>
                {g.milestones.map((m) => (
                  <div key={m.id} className="row wrap">
                    <label className="row">
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={() =>
                          updateGoal(g.id, {
                            milestones: g.milestones.map((x) =>
                              x.id === m.id ? { ...x, done: !x.done } : x,
                            ),
                          })
                        }
                      />
                      {m.label}
                    </label>
                    <PressableButton
                      variant="ghost"
                      onClick={() =>
                        updateGoal(g.id, { milestones: g.milestones.filter((x) => x.id !== m.id) })
                      }
                    >
                      Remove
                    </PressableButton>
                  </div>
                ))}
                <div className="row wrap">
                  <input
                    placeholder="New milestone"
                    value={expandedId === g.id ? milestoneDraft : ""}
                    onChange={(e) => setMilestoneDraft(e.target.value)}
                  />
                  <PressableButton
                    variant="ghost"
                    onClick={() => {
                      const label = milestoneDraft.trim();
                      if (!label) return;
                      updateGoal(g.id, {
                        milestones: [...g.milestones, { id: crypto.randomUUID(), label, done: false }],
                      });
                      setMilestoneDraft("");
                    }}
                  >
                    Add milestone
                  </PressableButton>
                </div>
                <PressableButton variant="ghost" onClick={() => deleteGoal(g.id)}>
                  Delete goal
                </PressableButton>
              </>
            )}
          </section>
        );
      })}
    </PageTransition>
  );
}
