import { useState } from "react";
import { BookOpen } from "lucide-react";
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

  if (!user) return null;
  const deck = user.decks.find((d) => d.id === studyDeckId);
  const card = deck ? pickNextFlashCard(deck.cards, shuffle) : undefined;
  const mastery = deck ? deckMasteryPercent(deck.cards) : 0;

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
            <p className="soft">
              Mastery: {mastery}% · {deck.cards.length} cards · {deckDueCount(deck.cards)} due now
            </p>
          </section>

          {card ? (
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
          ) : (
            <EmptyState icon={<BookOpen size={32} />} title="Deck complete" hint="All cards marked known — add more or reset." />
          )}
        </>
      ) : null}
    </PageTransition>
  );
}
