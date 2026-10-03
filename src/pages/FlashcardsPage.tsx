import { useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { pickNextFlashCard, deckMasteryPercent, rateCard as scheduleRate, deckDueCount } from "../lib/flashcard-scheduler";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { EmptyState } from "../components/ui/EmptyState";

export function FlashcardsPage() {
  const { user, updateUser, setToast } = useStudyGrind();
  const [deckName, setDeckName] = useState("");
  const [studyDeckId, setStudyDeckId] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [cardForm, setCardForm] = useState({ q: "", a: "" });
  const [examActive, setExamActive] = useState(false);
  const [examMinutes, setExamMinutes] = useState(10);
  const [examSecondsLeft, setExamSecondsLeft] = useState(0);
  const [examQueue, setExamQueue] = useState<string[]>([]);
  const [examCorrect, setExamCorrect] = useState(0);
  const [examTotal, setExamTotal] = useState(0);
  const [examDone, setExamDone] = useState(false);

  const deck = user?.decks.find((d) => d.id === studyDeckId);
  const card = deck ? pickNextFlashCard(deck.cards, shuffle) : undefined;
  const mastery = deck ? deckMasteryPercent(deck.cards) : 0;
  const examCard = useMemo(() => {
    if (!deck || examQueue.length === 0) return undefined;
    return deck.cards.find((c) => c.id === examQueue[0]);
  }, [deck, examQueue]);

  useEffect(() => {
    if (!examActive || examSecondsLeft <= 0) return;
    const t = window.setInterval(() => setExamSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [examActive, examSecondsLeft]);

  useEffect(() => {
    const u = user;
    if (!u || !examActive || examSecondsLeft > 0) return;
    setExamActive(false);
    setExamDone(true);
    updateUser({
      ...u,
      flashcardStats: {
        ...u.flashcardStats,
        examSessions: (u.flashcardStats.examSessions ?? 0) + 1,
      },
    });
  }, [user, examActive, examSecondsLeft, updateUser]);

  if (!user) return null;

  const startExam = () => {
    if (!deck || deck.cards.length === 0) return;
    const ids = deck.cards.map((c) => c.id).sort(() => Math.random() - 0.5);
    setExamQueue(ids);
    setExamCorrect(0);
    setExamTotal(0);
    setExamDone(false);
    setExamSecondsLeft(examMinutes * 60);
    setExamActive(true);
    setFlipped(false);
  };

  const rateExam = (correct: boolean) => {
    if (!examCard) return;
    setExamTotal((n) => n + 1);
    if (correct) setExamCorrect((n) => n + 1);
    setExamQueue((q) => q.slice(1));
    setFlipped(false);
  };

  const handleRate = (quality: number) => {
    if (!deck || !card) return;
    const updated = scheduleRate(card, quality);
    const nextDecks = user.decks.map((d) =>
      d.id === studyDeckId ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? updated : c)) } : d,
    );
    const nextUser = {
      ...user,
      decks: nextDecks,
      flashcardStats: {
        ...user.flashcardStats,
        cardsReviewed: user.flashcardStats.cardsReviewed + 1,
        sessions: user.flashcardStats.sessions + 1,
      },
    };
    updateUser(nextUser);
    setFlipped(false);
    const d = nextDecks.find((x) => x.id === studyDeckId);
    if (d && deckMasteryPercent(d.cards) >= 100 && !deck.rewardedAt) {
      updateUser({
        ...nextUser,
        focusPoints: nextUser.focusPoints + 20,
        decks: nextDecks.map((x) => (x.id === studyDeckId ? { ...x, rewardedAt: new Date().toDateString() } : x)),
      });
      setToast("Deck mastered! +20 pts");
    }
  };

  return (
    <PageTransition>
      <section className="card">
        <h4>
          <BookOpen size={16} /> Flashcards
        </h4>
        <div className="row wrap">
          <input placeholder="New deck name" value={deckName} onChange={(e) => setDeckName(e.target.value)} />
          <PressableButton
            onClick={() => {
              if (!deckName.trim()) return;
              const id = crypto.randomUUID();
              updateUser({ ...user, decks: [...user.decks, { id, name: deckName, cards: [] }] });
              setStudyDeckId(id);
              setDeckName("");
            }}
          >
            Create deck
          </PressableButton>
        </div>
        <div className="chip-group">
          {user.decks.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`chip ${studyDeckId === d.id ? "chip-active" : ""}`}
              onClick={() => {
                setStudyDeckId(d.id);
                setFlipped(false);
              }}
            >
              {d.name} ({deckMasteryPercent(d.cards)}%)
            </button>
          ))}
        </div>
      </section>

      {user.decks.length === 0 ? (
        <EmptyState icon={<BookOpen size={36} />} title="No decks" hint="Create a deck or convert from Notes." />
      ) : studyDeckId && deck ? (
        <>
          <section className="card">
            <div className="row wrap">
              <input placeholder="Front" value={cardForm.q} onChange={(e) => setCardForm({ ...cardForm, q: e.target.value })} />
              <input placeholder="Back" value={cardForm.a} onChange={(e) => setCardForm({ ...cardForm, a: e.target.value })} />
              <PressableButton
                onClick={() => {
                  if (!cardForm.q || !cardForm.a) return;
                  updateUser({
                    ...user,
                    decks: user.decks.map((d) =>
                      d.id === studyDeckId
                        ? {
                            ...d,
                            cards: [
                              ...d.cards,
                              {
                                id: crypto.randomUUID(),
                                q: cardForm.q,
                                a: cardForm.a,
                                ease: 2.5,
                                seen: 0,
                                status: "new" as const,
                                dueAt: new Date().toISOString(),
                                intervalDays: 1,
                                reps: 0,
                              },
                            ],
                          }
                        : d,
                    ),
                  });
                  setCardForm({ q: "", a: "" });
                }}
              >
                Add card
              </PressableButton>
              <label className="chip">
                <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} /> Shuffle
              </label>
            </div>
            <label className="soft">Linked exam (optional)</label>
            <select
              value={deck.linkedExamId ?? ""}
              onChange={(e) =>
                updateUser({
                  ...user,
                  decks: user.decks.map((d) =>
                    d.id === studyDeckId ? { ...d, linkedExamId: e.target.value || undefined } : d,
                  ),
                })
              }
              aria-label="Link deck to exam"
            >
              <option value="">No exam</option>
              {(user.exams ?? [])
                .filter((e) => !e.archived)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
            </select>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <PressableButton
                variant="ghost"
                onClick={() => {
                  if (!window.confirm(`Delete deck "${deck.name}"?`)) return;
                  updateUser({ ...user, decks: user.decks.filter((d) => d.id !== studyDeckId) });
                  setStudyDeckId("");
                }}
              >
                Delete deck
              </PressableButton>
            </div>
            <p className="soft">
              Mastery: {mastery}% · {deck.cards.length} cards · {deckDueCount(deck.cards)} due now
            </p>
            {deck.cards.length > 0 && !examActive && (
              <ul className="soft deck-card-list">
                {deck.cards.map((c) => (
                  <li key={c.id} className="row wrap">
                    <span>
                      {c.q.slice(0, 40)}
                      {c.q.length > 40 ? "…" : ""}
                    </span>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() =>
                        updateUser({
                          ...user,
                          decks: user.decks.map((d) =>
                            d.id === studyDeckId ? { ...d, cards: d.cards.filter((x) => x.id !== c.id) } : d,
                          ),
                        })
                      }
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!examActive && !examDone && (
              <div className="row wrap" style={{ marginTop: 12 }}>
                <select value={examMinutes} onChange={(e) => setExamMinutes(Number(e.target.value))} aria-label="Exam duration">
                  <option value={5}>5 min exam</option>
                  <option value={10}>10 min exam</option>
                  <option value={15}>15 min exam</option>
                </select>
                <PressableButton onClick={startExam}>
                  <GraduationCap size={16} /> Exam mode
                </PressableButton>
              </div>
            )}
          </section>

          {examDone && (
            <section className="card exam-mode-shell">
              <h4>Exam complete</h4>
              <p>
                Score: {examCorrect}/{examTotal} · {examMinutes} min session
              </p>
              <PressableButton onClick={() => setExamDone(false)}>Back to deck</PressableButton>
            </section>
          )}

          {examActive && examCard ? (
            <section className="card exam-mode-shell study-stage">
              <div className="row">
                <span className="pill">Exam mode</span>
                <span className="tabular">
                  {String(Math.floor(examSecondsLeft / 60)).padStart(2, "0")}:{String(examSecondsLeft % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="rank-progress-bar" aria-hidden="true">
                <div
                  className="rank-progress-fill"
                  style={{ width: `${Math.max(0, (examSecondsLeft / (examMinutes * 60)) * 100)}%` }}
                />
              </div>
              <div className="flashcard-flip" onClick={() => setFlipped((f) => !f)}>
                <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
                  <div className="flash flashcard-face front">
                    <b>Question</b>
                    <p>{examCard.q}</p>
                  </div>
                  <div className="flash flashcard-face back">
                    <b>Answer</b>
                    <p>{examCard.a}</p>
                  </div>
                </div>
              </div>
              <div className="row wrap">
                <PressableButton onClick={() => rateExam(true)}>Correct</PressableButton>
                <PressableButton variant="ghost" onClick={() => rateExam(false)}>
                  Missed
                </PressableButton>
              </div>
            </section>
          ) : null}

          {!examActive && !examDone && card ? (
            <section className="card study-stage">
              <div className="flashcard-flip" onClick={() => setFlipped((f) => !f)}>
                <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
                  <div className="flash flashcard-face front">
                    <b>Front</b>
                    <p>{card.q}</p>
                  </div>
                  <div className="flash flashcard-face back">
                    <b>Back</b>
                    <p>{card.a}</p>
                  </div>
                </div>
              </div>
              <p className="soft">Tap to flip</p>
              <div className="row wrap">
                <PressableButton onClick={() => handleRate(4)}>Got it</PressableButton>
                <PressableButton variant="ghost" onClick={() => handleRate(2)}>
                  Needs practice
                </PressableButton>
                <PressableButton variant="ghost" onClick={() => handleRate(5)}>
                  Mark known
                </PressableButton>
              </div>
            </section>
          ) : !examActive && !examDone ? (
            <EmptyState icon={<BookOpen size={32} />} title="Deck complete" hint="All cards marked known — add more or reset." />
          ) : null}
        </>
      ) : null}
    </PageTransition>
  );
}
