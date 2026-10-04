import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckSquare, Pencil, Play, Plus, Search } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { isAndroid } from "../lib/native";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { HorizontalTabBar } from "../components/ui/HorizontalTabBar";
import type { Task, TaskPriority, TaskRecurrence, TaskStatus } from "../types";
import { todayKey } from "../lib/dates";
import {
  isRecurrenceComplete,
  isRecurringTask,
  nextIncompleteOccurrence,
  recurrenceProgressLabel,
} from "../lib/task-recurrence";
import { NumericInput } from "../components/ui/NumericInput";

const PR: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };
const COLUMNS: TaskStatus[] = ["todo", "doing", "done"];
const COL_LABEL: Record<TaskStatus, string> = { todo: "To do", doing: "Doing", done: "Done" };

export function TasksPage() {
  const { user, updateUser, goTab, setSelectedTaskId, showReward, setToast } = useStudyGrind();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mobileCol, setMobileCol] = useState<TaskStatus>("todo");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [recurringOn, setRecurringOn] = useState(false);
  const [recurrenceKind, setRecurrenceKind] = useState<"daily" | "dates">("dates");
  const [recurrenceDates, setRecurrenceDates] = useState<string[]>([]);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [dateDraft, setDateDraft] = useState("");
  const [input, setInput] = useState({
    title: "",
    tag: "General",
    category: "General",
    description: "",
    priority: "Medium" as TaskPriority,
    minutes: 25,
    dueDate: "",
    status: "todo" as TaskStatus,
  });

  const categories = useMemo(() => {
    const set = new Set((user?.tasks ?? []).map((t) => t.category || t.tag));
    return ["all", ...Array.from(set)];
  }, [user?.tasks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (user?.tasks ?? []).filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter && t.tag !== categoryFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
  }, [user?.tasks, search, categoryFilter]);

  if (!user) return null;

  const byStatus = (s: TaskStatus) =>
    [...filtered]
      .filter((t) => t.status === s)
      .sort((a, b) => (PR[a.priority] ?? 1) - (PR[b.priority] ?? 1));

  const loadRecurrenceFromTask = (t?: Task) => {
    const r = t?.recurrence;
    if (!r || r.kind === "none") {
      setRecurringOn(false);
      setRecurrenceKind("dates");
      setRecurrenceDates([]);
      setRecurrenceUntil("");
      return;
    }
    setRecurringOn(true);
    if (r.kind === "daily") {
      setRecurrenceKind("daily");
      setRecurrenceUntil(r.until ?? "");
      setRecurrenceDates([]);
    } else {
      setRecurrenceKind("dates");
      setRecurrenceDates(r.dates ?? []);
      setRecurrenceUntil("");
    }
  };

  const buildRecurrence = (): TaskRecurrence => {
    if (!recurringOn) return { kind: "none" };
    if (recurrenceKind === "daily") {
      return { kind: "daily", startDate: todayKey(), until: recurrenceUntil || undefined };
    }
    return { kind: "dates", dates: [...recurrenceDates].sort() };
  };

  const openNew = () => {
    setEditingId("");
    setInput({
      title: "",
      tag: "General",
      category: "General",
      description: "",
      priority: "Medium",
      minutes: 25,
      dueDate: "",
      status: "todo",
    });
    loadRecurrenceFromTask();
    setModalOpen(true);
  };

  const markOccurrenceDone = (task: Task, day: string) => {
    const done = new Set(task.completedOccurrenceDates ?? []);
    done.add(day);
    updateUser({
      ...user,
      tasks: user.tasks.map((t) =>
        t.id === task.id ? { ...t, completedOccurrenceDates: Array.from(done).sort() } : t,
      ),
    });
    setToast(`Marked ${day} complete.`);
  };

  const saveTask = () => {
    if (!input.title.trim()) return;
    if (recurringOn && recurrenceKind === "dates" && recurrenceDates.length === 0) {
      setToast("Add at least one date for a recurring task.");
      return;
    }
    const due = input.dueDate || undefined;
    const recurrence = buildRecurrence();
    const prev = editingId ? user.tasks.find((t) => t.id === editingId) : undefined;
    const scheduleChanged =
      JSON.stringify(prev?.recurrence) !== JSON.stringify(recurrence);
    if (editingId) {
      updateUser({
        ...user,
        tasks: user.tasks.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title: input.title,
                tag: input.tag,
                category: input.category,
                description: input.description,
                priority: input.priority,
                minutes: input.minutes,
                dueDate: due,
                status: input.status,
                done: input.status === "done",
                recurrence,
                recurrenceStartDate: recurrence.kind === "daily" ? todayKey() : t.recurrenceStartDate,
                completedOccurrenceDates: scheduleChanged ? [] : t.completedOccurrenceDates ?? [],
              }
            : t,
        ),
      });
    } else {
      updateUser({
        ...user,
        tasks: [
          ...user.tasks,
          {
            id: crypto.randomUUID(),
            title: input.title,
            tag: input.tag,
            category: input.category,
            description: input.description,
            priority: input.priority,
            status: "todo",
            done: false,
            minutes: input.minutes,
            dueDate: due,
            focusMinutesSpent: 0,
            pointsReward: 50,
            recurrence,
            recurrenceStartDate: recurrence.kind === "daily" ? todayKey() : undefined,
            completedOccurrenceDates: [],
          },
        ],
      });
    }
    setModalOpen(false);
    setToast("Task saved.");
  };

  const moveStatus = (task: Task, status: TaskStatus) => {
    if (status === "done" && isRecurringTask(task) && !isRecurrenceComplete(task)) {
      setToast("Finish all scheduled days first (use Done for this day).");
      return;
    }
    const wasDone = task.status === "done";
    const nowDone = status === "done";
    let focusPoints = user.focusPoints;
    let tasksCompleted = user.tasksCompleted;
    if (nowDone && !wasDone) {
      focusPoints += task.pointsReward;
      tasksCompleted += 1;
      showReward("Task complete!", task.title, task.pointsReward);
    }
    updateUser({
      ...user,
      focusPoints,
      tasksCompleted,
      tasks: user.tasks.map((t) =>
        t.id === task.id ? { ...t, status, done: nowDone } : t,
      ),
    });
  };

  const TaskCard = ({ t }: { t: Task }) => {
    const overdue = Boolean(t.dueDate && t.status !== "done" && t.dueDate < new Date().toISOString().slice(0, 10));
    const next: TaskStatus | null = t.status === "todo" ? "doing" : t.status === "doing" ? "done" : null;
    return (
      <article className={`task-card priority-${t.priority.toLowerCase()} ${overdue ? "task-overdue" : ""}`}>
        <div className="task-card-head">
          <b>{t.title}</b>
          <span className={`pill task-priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
        </div>
        <p className="soft">
          {t.category}
          {t.dueDate ? ` · due ${t.dueDate}` : ""} · {t.focusMinutesSpent}m focused
          {recurrenceProgressLabel(t) ? ` · ${recurrenceProgressLabel(t)}` : ""}
        </p>
        <div className="row wrap task-actions">
          {isRecurringTask(t) && t.status !== "done" && nextIncompleteOccurrence(t) && (
            <PressableButton variant="ghost" onClick={() => markOccurrenceDone(t, nextIncompleteOccurrence(t)!)}>
              Done for {nextIncompleteOccurrence(t)}
            </PressableButton>
          )}
          {t.status !== "done" && (
            <PressableButton
              variant="ghost"
              onClick={() => {
                setSelectedTaskId(t.id);
                updateUser({ ...user, focusDurationMin: t.minutes });
                goTab("timer");
              }}
            >
              <Play size={14} /> Focus
            </PressableButton>
          )}
          {next && (
            <PressableButton variant="ghost" onClick={() => moveStatus(t, next)}>
              <ArrowRight size={14} /> {COL_LABEL[next]}
            </PressableButton>
          )}
          {t.status === "done" && (
            <PressableButton variant="ghost" onClick={() => moveStatus(t, "todo")}>
              Reopen
            </PressableButton>
          )}
          <PressableButton
            variant="ghost"
            className="icon-btn"
            aria-label="Edit task"
            onClick={() => {
              setEditingId(t.id);
              setInput({
                title: t.title,
                tag: t.tag,
                category: t.category,
                description: t.description,
                priority: t.priority,
                minutes: t.minutes,
                dueDate: t.dueDate ?? "",
                status: t.status,
              });
              loadRecurrenceFromTask(t);
              setModalOpen(true);
            }}
          >
            <Pencil size={14} />
          </PressableButton>
        </div>
      </article>
    );
  };

  const renderColumn = (col: TaskStatus) => (
    <div key={col} className="kanban-column">
      <h5 className="kanban-col-title">
        <span>{COL_LABEL[col]}</span>
        <span className="tabular">{byStatus(col).length}</span>
      </h5>
      {byStatus(col).map((t) => (
        <TaskCard key={t.id} t={t} />
      ))}
      {byStatus(col).length === 0 && <p className="soft kanban-empty">Nothing here</p>}
    </div>
  );

  return (
    <PageTransition stagger>
      <section className="card">
        <div className="row wrap">
          <h4>
            <CheckSquare size={16} /> Tasks
          </h4>
          <div className="row wrap">
            <PressableButton variant="ghost" onClick={() => goTab("exams")}>
              <CalendarClock size={16} /> Exams
            </PressableButton>
            {!isAndroid && (
              <PressableButton onClick={openNew}>
                <Plus size={16} /> Add task
              </PressableButton>
            )}
          </div>
        </div>
        <div className="row search-row">
          <Search size={16} className="soft" />
          <input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
        </div>
        {categories.length > 2 && (
          <HorizontalTabBar
            tabs={categories.map((c) => ({ id: c, label: c === "all" ? "All" : c }))}
            active={categoryFilter}
            onChange={setCategoryFilter}
            ariaLabel="Task categories"
          />
        )}
      </section>

      {user.tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={32} />}
          title="No tasks yet"
          hint="Add tasks and link them to focus sessions for tracked minutes."
          actionLabel="Add first task"
          onAction={openNew}
        />
      ) : isAndroid ? (
        <>
          <div className="task-segment" role="tablist" aria-label="Task status">
            {COLUMNS.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={mobileCol === c}
                className={`task-segment-btn ${mobileCol === c ? "active" : ""}`}
                onClick={() => setMobileCol(c)}
              >
                {COL_LABEL[c]} <span className="tabular">{byStatus(c).length}</span>
              </button>
            ))}
          </div>
          <div className="kanban-grid single">{renderColumn(mobileCol)}</div>
        </>
      ) : (
        <div className="kanban-grid">{COLUMNS.map(renderColumn)}</div>
      )}

      {isAndroid && (
        <button type="button" className="task-fab pressable" onClick={openNew} aria-label="Add task">
          <Plus size={24} />
        </button>
      )}

      <Modal open={modalOpen} title={editingId ? "Edit task" : "New task"} onClose={() => setModalOpen(false)} footer={<PressableButton onClick={saveTask}>Save</PressableButton>}>
        <input placeholder="Title" value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} autoFocus />
        <input placeholder="Category (e.g. Maths)" value={input.category} onChange={(e) => setInput({ ...input, category: e.target.value, tag: e.target.value })} />
        <textarea placeholder="Description (optional)" value={input.description} onChange={(e) => setInput({ ...input, description: e.target.value })} />
        <div>
          <label className="soft">Priority</label>
          <div className="chip-group" style={{ marginTop: 6 }}>
            {(["Low", "Medium", "High"] as TaskPriority[]).map((p) => (
              <button key={p} type="button" className={`chip ${input.priority === p ? "chip-active" : ""}`} onClick={() => setInput({ ...input, priority: p })}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid2">
          <div>
            <label className="soft" htmlFor="task-due">Due date</label>
            <input id="task-due" type="date" value={input.dueDate} onChange={(e) => setInput({ ...input, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="soft" htmlFor="task-minutes">Focus minutes</label>
            <NumericInput
              id="task-minutes"
              min={5}
              max={180}
              fallback={25}
              value={input.minutes}
              onChange={(n) => setInput({ ...input, minutes: n })}
            />
          </div>
        </div>
        <div className="task-recurrence-block">
          <PressableButton variant="ghost" onClick={() => setRecurringOn((v) => !v)}>
            {recurringOn ? "Recurring task on" : "Recurring task"}
          </PressableButton>
          {recurringOn && (
            <>
              <div className="chip-group" style={{ marginTop: 8 }}>
                <button type="button" className={`chip ${recurrenceKind === "daily" ? "chip-active" : ""}`} onClick={() => setRecurrenceKind("daily")}>
                  Every day
                </button>
                <button type="button" className={`chip ${recurrenceKind === "dates" ? "chip-active" : ""}`} onClick={() => setRecurrenceKind("dates")}>
                  Pick dates
                </button>
              </div>
              {recurrenceKind === "daily" && (
                <label className="field">
                  <span className="soft">End date (required to finish series)</span>
                  <input type="date" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} />
                </label>
              )}
              {recurrenceKind === "dates" && (
                <div>
                  <div className="row wrap">
                    <input type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} aria-label="Add recurrence date" />
                    <PressableButton
                      variant="ghost"
                      onClick={() => {
                        if (!dateDraft) return;
                        if (!recurrenceDates.includes(dateDraft)) setRecurrenceDates([...recurrenceDates, dateDraft].sort());
                        setDateDraft("");
                      }}
                    >
                      Add date
                    </PressableButton>
                  </div>
                  <div className="chip-group" style={{ marginTop: 8 }}>
                    {recurrenceDates.map((d) => (
                      <button key={d} type="button" className="chip chip-active" onClick={() => setRecurrenceDates(recurrenceDates.filter((x) => x !== d))}>
                        {d} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </PageTransition>
  );
}
