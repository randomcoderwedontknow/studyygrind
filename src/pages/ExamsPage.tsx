import { useState } from "react";
import { CalendarClock, Pencil, Play, Plus } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { dayDiff } from "../lib/dates";
import type { Exam } from "../types";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { NumericInput } from "../components/ui/NumericInput";
import { EmptyState } from "../components/ui/EmptyState";

function examStatusLabel(date: string) {
  const passed = dayDiff(date) > 0;
  if (passed) return "Past";
  const days = Math.max(0, -dayDiff(date));
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function ExamsPage() {
  const { user, updateUser, goTab, setSelectedTaskId, setToast } = useStudyGrind();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [draft, setDraft] = useState({ title: "", subject: "", examDate: "", targetMinutesPerDay: 45 });

  if (!user) return null;

  const openModal = (exam?: Exam) => {
    if (exam) {
      setEditingId(exam.id);
      setDraft({
        title: exam.title,
        subject: exam.subject ?? "",
        examDate: exam.examDate,
        targetMinutesPerDay: exam.targetMinutesPerDay ?? 45,
      });
    } else {
      setEditingId("");
      setDraft({ title: "", subject: "", examDate: "", targetMinutesPerDay: 45 });
    }
    setModalOpen(true);
  };

  const saveExam = () => {
    if (!draft.title.trim() || !draft.examDate) return;
    if (editingId) {
      updateUser({
        ...user,
        exams: user.exams.map((e) =>
          e.id === editingId
            ? {
                ...e,
                title: draft.title.trim(),
                subject: draft.subject.trim() || undefined,
                examDate: draft.examDate,
                targetMinutesPerDay: draft.targetMinutesPerDay,
              }
            : e,
        ),
      });
      setToast("Exam updated.");
    } else {
      const exam: Exam = {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        subject: draft.subject.trim() || undefined,
        examDate: draft.examDate,
        targetMinutesPerDay: draft.targetMinutesPerDay,
      };
      updateUser({ ...user, exams: [...(user.exams ?? []), exam] });
      setToast("Exam added.");
    }
    setModalOpen(false);
    setEditingId("");
  };

  const deleteExam = (id: string) => {
    updateUser({
      ...user,
      exams: user.exams.filter((e) => e.id !== id),
      selectedExamId: user.selectedExamId === id ? "" : user.selectedExamId,
      decks: user.decks.map((d) => (d.linkedExamId === id ? { ...d, linkedExamId: undefined } : d)),
    });
    setDeleteId("");
    setToast("Exam removed.");
  };

  const studyForExam = (exam: Exam) => {
    setSelectedTaskId("");
    updateUser({ ...user, selectedExamId: exam.id, focusDurationMin: exam.targetMinutesPerDay ?? 45 });
    goTab("timer");
  };

  const active = (user.exams ?? []).filter((e) => !e.archived);
  const archived = (user.exams ?? []).filter((e) => e.archived);

  return (
    <PageTransition stagger>
      <section className="card">
        <div className="row wrap">
          <h4>
            <CalendarClock size={16} /> Exams
          </h4>
          <PressableButton onClick={() => openModal()}>
            <Plus size={16} /> Add exam
          </PressableButton>
        </div>
        <p className="soft">Track dates, daily targets, and focus time per exam.</p>
      </section>

      {active.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={32} />}
          title="No exams yet"
          hint="Add an exam to see countdowns and link study sessions."
        />
      ) : (
        <div className="exams-grid">
          {active.map((exam) => {
            const mins = user.sessionLog.filter((s) => s.examId === exam.id).reduce((sum, s) => sum + s.minutes, 0);
            const linkedDecks = user.decks.filter((d) => d.linkedExamId === exam.id);
            return (
              <article key={exam.id} className="card exam-card">
                <div className="row wrap">
                  <b>{exam.title}</b>
                  <span className="pill">{examStatusLabel(exam.examDate)}</span>
                </div>
                <p className="soft">
                  {exam.subject ? `${exam.subject} · ` : ""}
                  {exam.examDate}
                  {exam.readinessRating ? ` · Readiness ${exam.readinessRating}/5` : ""}
                </p>
                <p className="soft">
                  {mins}m studied · aim {exam.targetMinutesPerDay ?? 45}m/day
                  {linkedDecks.length ? ` · ${linkedDecks.length} deck${linkedDecks.length === 1 ? "" : "s"}` : ""}
                </p>
                <div className="row wrap">
                  <PressableButton onClick={() => studyForExam(exam)}>
                    <Play size={14} /> Study
                  </PressableButton>
                  <PressableButton variant="ghost" onClick={() => openModal(exam)}>
                    <Pencil size={14} /> Edit
                  </PressableButton>
                  <PressableButton variant="ghost" onClick={() => setDeleteId(exam.id)}>
                    Delete
                  </PressableButton>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <section className="card">
          <h5>Archived</h5>
          {archived.map((e) => (
            <p key={e.id} className="soft">
              {e.title} · {e.examDate}
            </p>
          ))}
        </section>
      )}

      <Modal open={modalOpen} title={editingId ? "Edit exam" : "Add exam"} onClose={() => setModalOpen(false)} footer={<PressableButton onClick={saveExam}>Save exam</PressableButton>}>
        <input placeholder="Exam name" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input placeholder="Subject (optional)" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
        <input type="date" value={draft.examDate} onChange={(e) => setDraft({ ...draft, examDate: e.target.value })} aria-label="Exam date" />
        <label className="soft">Target minutes per day</label>
        <NumericInput min={15} max={180} fallback={45} value={draft.targetMinutesPerDay} onChange={(n) => setDraft({ ...draft, targetMinutesPerDay: n })} />
      </Modal>

      <Modal open={Boolean(deleteId)} title="Delete exam?" onClose={() => setDeleteId("")} footer={<PressableButton onClick={() => deleteExam(deleteId)}>Delete</PressableButton>}>
        <p className="soft">This removes the exam and unlinks decks.</p>
      </Modal>
    </PageTransition>
  );
}
