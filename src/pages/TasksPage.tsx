import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckSquare, Pencil, Play, Plus, Search } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { isAndroid } from "../lib/native";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { HorizontalTabBar } from "../components/ui/HorizontalTabBar";
import { dayDiff } from "../lib/dates";
import type { Exam, Task, TaskPriority, TaskStatus } from "../types";
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
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState("");
  const [deleteExamId, setDeleteExamId] = useState("");
  const [examDraft, setExamDraft] = useState({ title: "", subject: "", examDate: "", targetMinutesPerDay: 45 });
  const [editingId, setEditingId] = useState("");
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

  const examStatusLabel = (date: string) => {
    const passed = dayDiff(date) > 0;
    if (passed) return "Due passed";
    const days = Math.max(0, -dayDiff(date));
    if (days === 0) return "Today";
    return `${days} day${days === 1 ? "" : "s"} left`;
  };

  const openExamModal = (exam?: Exam) => {
    if (exam) {
      setEditingExamId(exam.id);
      setExamDraft({
        title: exam.title,
        subject: exam.subject ?? "",
        examDate: exam.examDate,
        targetMinutesPerDay: exam.targetMinutesPerDay ?? 45,
      });
    } else {
      setEditingExamId("");
      setExamDraft({ title: "", subject: "", examDate: "", targetMinutesPerDay: 45 });
    }
    setExamModalOpen(true);
  };

  const saveExam = () => {
    if (!examDraft.title.trim() || !examDraft.examDate) return;
    if (editingExamId) {
      updateUser({
        ...user,
        exams: user.exams.map((e) =>
          e.id === editingExamId
            ? {
                ...e,
                title: examDraft.title.trim(),
                subject: examDraft.subject.trim() || undefined,
                examDate: examDraft.examDate,
                targetMinutesPerDay: examDraft.targetMinutesPerDay,
              }
            : e,
        ),
      });
      setToast("Exam updated.");
    } else {
      const exam: Exam = {
        id: crypto.randomUUID(),
        title: examDraft.title.trim(),
        subject: examDraft.subject.trim() || undefined,
        examDate: examDraft.examDate,
        targetMinutesPerDay: examDraft.targetMinutesPerDay,
      };
      updateUser({ ...user, exams: [...(user.exams ?? []), exam] });
      setToast("Exam added.");
    }
    setExamModalOpen(false);
    setEditingExamId("");
    setExamDraft({ title: "", subject: "", examDate: "", targetMinutesPerDay: 45 });
  };

  const deleteExam = (id: string) => {
    updateUser({
      ...user,
      exams: user.exams.filter((e) => e.id !== id),
      selectedExamId: user.selectedExamId === id ? "" : user.selectedExamId,
      decks: user.decks.map((d) => (d.linkedExamId === id ? { ...d, linkedExamId: undefined } : d)),
    });
    setDeleteExamId("");
    setToast("Exam removed.");
  };

  const studyForExam = (exam: Exam) => {
    setSelectedTaskId("");
    updateUser({ ...user, selectedExamId: exam.id, focusDurationMin: exam.targetMinutesPerDay ?? 45 });
    goTab("timer");
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
    setModalOpen(true);
  };

  const saveTask = () => {
    if (!input.title.trim()) return;
    const due = input.dueDate || undefined;
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
          },
        ],
      });
    }
    setModalOpen(false);
    setToast("Task saved.");
  };

  const moveStatus = (task: Task, status: TaskStatus) => {
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
        </p>
        <div className="row wrap task-actions">
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
            <PressableButton variant="ghost" onClick={() => openExamModal()}>
              <CalendarClock size={16} /> Add exam
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

      {(user.exams ?? []).length > 0 && (
        <section className="card liquid-surface">
          <h4>
            <CalendarClock size={16} /> Exams
          </h4>
          <div className="grid2">
            {(user.exams ?? [])
              .filter((e) => !e.archived)
              .map((exam) => {
                const linkedDecks = user.decks.filter((d) => d.linkedExamId === exam.id);
                return (
                  <article key={exam.id} className="task-card">
                    <div className="row wrap">
                      <b>{exam.title}</b>
                      <span className="pill">{examStatusLabel(exam.examDate)}</span>
                    </div>
                    <p className="soft">
                      {exam.subject ? `${exam.subject} · ` : ""}
                      {exam.examDate}
                      {exam.readinessRating ? ` · Readiness ${exam.readinessRating}/5` : ""}
                    </p>
                    <small className="soft">
                      Aim {exam.targetMinutesPerDay ?? 45}m/day
                      {linkedDecks.length ? ` · ${linkedDecks.length} linked deck${linkedDecks.length === 1 ? "" : "s"}` : ""}
                    </small>
                    <div className="row wrap" style={{ marginTop: 8 }}>
                      <PressableButton onClick={() => studyForExam(exam)}>
                        <Play size={14} /> Study for exam
                      </PressableButton>
                      <PressableButton variant="ghost" onClick={() => openExamModal(exam)}>
                        <Pencil size={14} /> Edit
                      </PressableButton>
                      <PressableButton variant="ghost" onClick={() => setDeleteExamId(exam.id)}>
                        Delete
                      </PressableButton>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}

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

      <Modal
        open={Boolean(deleteExamId)}
        title="Delete exam?"
        onClose={() => setDeleteExamId("")}
        footer={
          <PressableButton onClick={() => deleteExam(deleteExamId)}>Delete</PressableButton>
        }
      >
        <p className="soft">This removes the exam and unlinks any flashcard decks.</p>
      </Modal>

      <Modal
        open={examModalOpen}
        title={editingExamId ? "Edit exam" : "Add exam"}
        onClose={() => setExamModalOpen(false)}
        footer={<PressableButton onClick={saveExam}>Save exam</PressableButton>}
      >
        <input placeholder="Exam name" value={examDraft.title} onChange={(e) => setExamDraft({ ...examDraft, title: e.target.value })} />
        <input placeholder="Subject (optional)" value={examDraft.subject} onChange={(e) => setExamDraft({ ...examDraft, subject: e.target.value })} />
        <input type="date" value={examDraft.examDate} onChange={(e) => setExamDraft({ ...examDraft, examDate: e.target.value })} aria-label="Exam date" />
        <NumericInput
          min={15}
          max={180}
          fallback={45}
          value={examDraft.targetMinutesPerDay}
          onChange={(n) => setExamDraft({ ...examDraft, targetMinutesPerDay: n })}
          aria-label="Target minutes per day"
        />
      </Modal>

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
      </Modal>
    </PageTransition>
  );
}
