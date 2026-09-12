import { useCallback } from "react";
import { CHESS_MICRO_PUZZLES } from "../data/mini-games";
import type { GameKind, GameState } from "../types";
import { useStudyGrind } from "../context/StudyGrindContext";

export function useGames() {
  const {
    user,
    updateUser,
    grantMiniGamePoints,
    setGameState,
    setGameScore,
    setGameRound,
    setGameMessage,
    gameRound,
    gameScore,
  } = useStudyGrind();

  const nextRound = useCallback(
    (kind: GameKind) => {
      if (kind === "scramble") {
        const words = ["focus", "study", "grind", "learn", "habit", "memory", "logic", "vector"];
        const w = words[Math.floor(Math.random() * words.length)];
        const arr = w.split("").sort(() => Math.random() - 0.5);
        while (arr.join("") === w) arr.sort(() => Math.random() - 0.5);
        setGameState({ kind: "scramble", word: w, scrambled: arr.join(""), guess: "" });
      } else if (kind === "math" || kind === "mathSprint") {
        const ops: ("+" | "-" | "×")[] = ["+", "-", "×"];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        setGameState({ kind: kind === "mathSprint" ? "mathSprint" : "math", a, b, op: op as "+" | "-" | "×", guess: "", streak: 0 });
      } else if (kind === "memory" || kind === "memoryTiles" || kind === "pattern" || kind === "patternRepeat") {
        const len = kind === "pattern" || kind === "patternRepeat" ? Math.min(7, 2 + gameRound) : Math.min(8, 3 + Math.floor(gameRound / 3));
        const max = kind === "pattern" || kind === "patternRepeat" ? 5 : 4;
        const sequence = Array.from({ length: len }, () => Math.floor(Math.random() * max));
        const gkind = kind === "memoryTiles" ? "memoryTiles" : kind === "patternRepeat" ? "patternRepeat" : kind;
        if (gkind === "memoryTiles") {
          setGameState({ kind: "memoryTiles", size: 4, pattern: sequence, userInput: [], showing: true });
          setTimeout(() => setGameState((p) => (p && p.kind === "memoryTiles" ? { ...p, showing: false } : p)), len * 550 + 400);
        } else {
          setGameState({ kind: gkind as "memory" | "pattern" | "patternRepeat", sequence, userInput: [], showing: true, step: 0 });
          let i = 0;
          const interval = setInterval(() => {
            i += 1;
            setGameState((prev) =>
              prev && (prev.kind === "memory" || prev.kind === "pattern" || prev.kind === "patternRepeat")
                ? { ...prev, step: i }
                : prev,
            );
            if (i >= len) {
              clearInterval(interval);
              setTimeout(
                () =>
                  setGameState((prev) =>
                    prev && (prev.kind === "memory" || prev.kind === "pattern" || prev.kind === "patternRepeat")
                      ? { ...prev, showing: false }
                      : prev,
                  ),
                500,
              );
            }
          }, 520);
        }
      } else if (kind === "logic") {
        const pairs = [
          { q: "2 + 2 = 4", c: true },
          { q: "The moon is larger than Earth", c: false },
          { q: "Water boils at 100°C at sea level", c: true },
        ];
        const pick = pairs[Math.floor(Math.random() * pairs.length)];
        setGameState({ kind: "logic", question: pick.q, correct: pick.c });
      } else if (kind === "chessMicro") {
        setGameState({ kind: "chessMicro", puzzleIdx: Math.floor(Math.random() * CHESS_MICRO_PUZZLES.length), picked: null });
      } else if (kind === "reaction") {
        setGameState({ kind: "reaction", waiting: true, startAt: Date.now() + 1200 + Math.random() * 2000, clicks: 0 });
      } else if (kind === "focusDodge") {
        setGameState({ kind: "focusDodge", lane: 1, obstacles: [2], tick: 0 });
      } else if (kind === "typingBurst") {
        const phrases = ["study focus calm", "deep work now", "learn repeat win"];
        setGameState({ kind: "typingBurst", target: phrases[Math.floor(Math.random() * phrases.length)], typed: "", startAt: Date.now() });
      } else if (kind === "coinCatcher") {
        setGameState({ kind: "coinCatcher", x: 50, coins: [{ x: 30, y: 0 }], score: 0 });
      } else if (kind === "timerRush") {
        const target = 3000 + Math.floor(Math.random() * 4000);
        setGameState({ kind: "timerRush", target, current: 0, startAt: Date.now() });
      }
    },
    [gameRound, setGameState],
  );

  const startGame = (kind: GameKind) => {
    setGameRound(0);
    setGameScore(0);
    setGameMessage("");
    nextRound(kind);
  };

  const award = (wish: number, msg: string, cont: () => void) => {
    if (!user) return;
    const nu = grantMiniGamePoints(user, wish);
    const gained = nu.focusPoints - user.focusPoints;
    setGameScore((s) => s + gained);
    setGameRound((r) => r + 1);
    updateUser(nu);
    setGameMessage(msg);
    setTimeout(cont, 600);
  };

  const submitScramble = (state: Extract<GameState, { kind: "scramble" }>) => {
    if (!user) return;
    if (state.guess.toLowerCase().trim() === state.word) award(8, `Correct! +pts`, () => nextRound("scramble"));
    else {
      setGameMessage(`Was: ${state.word}. Score: ${gameScore}`);
      setGameState(null);
    }
  };

  const submitMath = (state: Extract<GameState, { kind: "math" | "mathSprint" }>) => {
    if (!user) return;
    const correct = state.op === "+" ? state.a + state.b : state.op === "-" ? state.a - state.b : state.a * state.b;
    if (Number(state.guess) === correct) award(state.kind === "mathSprint" ? 7 : 6, "Correct!", () => nextRound(state.kind));
    else {
      setGameMessage(`Answer: ${correct}. Score: ${gameScore}`);
      setGameState(null);
    }
  };

  return { startGame, nextRound, submitScramble, submitMath, award, setGameState, setGameMessage };
}
