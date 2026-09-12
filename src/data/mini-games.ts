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
  { id: "reaction-tap", kind: "reaction", title: "Reaction Tap", blurb: "Tap when the signal appears.", price: 0, free: true, pointsPerRound: 10 },
  { id: "memory-tiles", kind: "memoryTiles", title: "Memory Tiles", blurb: "Match the tile pattern.", price: 0, free: true, pointsPerRound: 9 },
  { id: "math-sprint", kind: "mathSprint", title: "Quick Maths Sprint", blurb: "Rapid-fire arithmetic.", price: 0, free: true, pointsPerRound: 7 },
  { id: "memory-sprint", kind: "memory", title: "Memory Sprint", blurb: "Classic 4-tone Simon.", price: 250, free: false, pointsPerRound: 10 },
  { id: "logic-burst", kind: "logic", title: "Logic Burst", blurb: "True / false trivia.", price: 250, free: false, pointsPerRound: 7 },
  { id: "pattern-rush", kind: "pattern", title: "Pattern Rush", blurb: "5-tone pattern repeats.", price: 250, free: false, pointsPerRound: 8 },
  { id: "micro-chess", kind: "chessMicro", title: "Micro Chess", blurb: "Tiny tactic picks.", price: 250, free: false, pointsPerRound: 9 },
  { id: "focus-dodge", kind: "focusDodge", title: "Focus Dodge", blurb: "Dodge distraction lanes.", price: 400, free: false, pointsPerRound: 12 },
  { id: "pattern-repeat", kind: "patternRepeat", title: "Pattern Repeat", blurb: "Repeat the light pattern.", price: 300, free: false, pointsPerRound: 8 },
  { id: "typing-burst", kind: "typingBurst", title: "Typing Burst", blurb: "Type the phrase fast.", price: 500, free: false, pointsPerRound: 11 },
  { id: "coin-catcher", kind: "coinCatcher", title: "Coin Catcher", blurb: "Catch falling coins.", price: 600, free: false, pointsPerRound: 10 },
  { id: "timer-rush", kind: "timerRush", title: "Timer Rush", blurb: "Stop closest to target.", price: 800, free: false, pointsPerRound: 14 },
];

export const CHESS_MICRO_PUZZLES = [
  { q: "White to mate in 1 — best move?", opts: ["Qh8#", "Qe5+"], ans: 0 },
  { q: "Knight fork on king and rook — destination?", opts: ["f7", "h6"], ans: 0 },
  { q: "Stalemate avoidance: safest king move?", opts: ["g8", "h8"], ans: 0 },
];
