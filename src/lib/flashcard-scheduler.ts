import type { CardStatus, DeckCard } from "../types";

export function cardStatus(c: DeckCard): CardStatus {
  if (c.status) return c.status;
  if (c.known) return "known";
  if ((c.seen ?? 0) > 0) return "practice";
  return "new";
}

export function migrateCardFields(c: DeckCard): DeckCard {
  const status = cardStatus(c);
  return {
    ...c,
    status,
    dueAt: c.dueAt ?? new Date().toISOString(),
    intervalDays: c.intervalDays ?? 1,
    reps: c.reps ?? 0,
    ease: c.ease ?? 2.5,
  };
}

export function isDue(card: DeckCard, now = Date.now()): boolean {
  if (cardStatus(card) === "known") return false;
  const due = card.dueAt ? new Date(card.dueAt).getTime() : 0;
  return due <= now;
}

export function getDueCards(cards: DeckCard[]): DeckCard[] {
  return cards.filter((c) => isDue(c)).map(migrateCardFields);
}

export function pickNextFlashCard(cards: DeckCard[], shuffle: boolean): DeckCard | undefined {
  const due = getDueCards(cards);
  const pool = due.length ? due : cards.filter((c) => cardStatus(c) !== "known");
  const source = pool.length ? pool : cards;
  if (!source.length) return undefined;
  if (shuffle) return source[Math.floor(Math.random() * source.length)];
  const sorted = [...source].sort((a, b) => {
    const da = new Date(a.dueAt ?? 0).getTime();
    const db = new Date(b.dueAt ?? 0).getTime();
    if (da !== db) return da - db;
    if (a.ease !== b.ease) return a.ease - b.ease;
    return a.seen - b.seen;
  });
  return sorted[0];
}

/** SM-2-lite: quality 0-5 */
export function rateCard(card: DeckCard, quality: number): DeckCard {
  const c = migrateCardFields(card);
  let ease = c.ease;
  let interval = c.intervalDays ?? 1;
  const reps = (c.reps ?? 0) + 1;

  if (quality < 3) {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (reps === 1) {
    interval = 1;
  } else if (reps === 2) {
    interval = 3;
  } else {
    interval = Math.round(interval * ease);
  }
  ease = Math.min(3, Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))));

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + interval);
  let status: CardStatus = "practice";
  if (quality >= 4 && reps >= 2) status = "known";
  if (quality < 3) status = "practice";

  return {
    ...c,
    ease,
    intervalDays: interval,
    reps,
    dueAt: dueAt.toISOString(),
    seen: c.seen + 1,
    known: status === "known",
    status,
  };
}

export function deckMasteryPercent(cards: DeckCard[]): number {
  if (!cards.length) return 0;
  return Math.round((cards.filter((c) => cardStatus(c) === "known" || c.ease >= 4).length / cards.length) * 100);
}

export function deckDueCount(cards: DeckCard[]): number {
  return getDueCards(cards).length;
}
