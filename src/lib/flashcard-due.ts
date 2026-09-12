import { deckDueCount } from "./flashcard-scheduler";
import type { Deck } from "../types";

export function countDueCards(decks: Deck[]): number {
  return decks.reduce((sum, d) => sum + deckDueCount(d.cards), 0);
}
