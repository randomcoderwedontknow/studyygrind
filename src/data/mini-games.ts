import type { GameKind } from "../types";

export type MiniGameDef = {
  id: string;
  kind: GameKind;
  title: string;
  blurb: string;
  price: number;
  free: boolean;
  pointsPerRound: number;
};

export const MINI_GAMES: MiniGameDef[] = [
  { id: "word-scramble", kind: "scramble", title: "Word Scramble", blurb: "Unscramble study words.", price: 0, free: true, pointsPerRound: 8 },
  { id: "number-ninja", kind: "math", title: "Number Ninja", blurb: "Mental math sprint.", price: 0, free: true, pointsPerRound: 6 },
  { id: "reaction-tap", kind: "reaction", title: "Reaction Tap", blurb: "Tap when the screen turns green.", price: 0, free: true, pointsPerRound: 10 },
  { id: "memory-sprint", kind: "memory", title: "Memory Sprint", blurb: "Classic four-pad Simon sequence.", price: 850, free: false, pointsPerRound: 10 },
];
