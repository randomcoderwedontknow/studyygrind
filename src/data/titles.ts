import { CUSTOM_TITLE_UNLOCK_PRICE } from "./constants";

export type CosmeticTitle = {
  id: string;
  label: string;
  price: number;
  description: string;
};

export const STARTER_TITLE_ID = "starter";

export const STARTER_TITLE: CosmeticTitle = {
  id: STARTER_TITLE_ID,
  label: "New Student",
  price: 0,
  description: "Your first display title — free for everyone.",
};

export const PURCHASABLE_TITLES: CosmeticTitle[] = [
  { id: "night-owl", label: "Night Owl", price: 10_000, description: "For late-night study sessions." },
  { id: "card-shark", label: "Card Shark", price: 15_000, description: "Flashcard specialist." },
  { id: "point-hoarder", label: "Point Hoarder", price: 25_000, description: "Collects every reward." },
  { id: "focus-fanatic", label: "Focus Fanatic", price: 35_000, description: "Lives on the timer." },
  { id: "grind-goblin", label: "Study Buddy", price: 45_000, description: "Friendly study companion vibe." },
];

export const CUSTOM_NAME_TITLE_ID = "custom-name";

export function titleById(id: string): CosmeticTitle | undefined {
  if (id === STARTER_TITLE_ID) return STARTER_TITLE;
  if (id === CUSTOM_NAME_TITLE_ID) {
    return {
      id: CUSTOM_NAME_TITLE_ID,
      label: "Custom Name",
      price: CUSTOM_TITLE_UNLOCK_PRICE,
      description: "Your own display title.",
    };
  }
  return PURCHASABLE_TITLES.find((t) => t.id === id);
}
