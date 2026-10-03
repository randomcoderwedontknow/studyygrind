import { useCallback } from "react";
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
      } else if (kind === "math") {
        const ops: ("+" | "-" | "×")[] = ["+", "-", "×"];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        setGameState({ kind: "math", a, b, op, guess: "" });
      } else if (kind === "memory") {
        const len = Math.min(8, 3 + Math.floor(gameRound / 2));
        const sequence = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
        setGameState({ kind: "memory", sequence, userInput: [], showing: true, step: 0 });
      } else if (kind === "reaction") {
        setGameState({
          kind: "reaction",
          waiting: true,
          startAt: Date.now() + 1200 + Math.random() * 2500,
          clicks: 0,
          falseStart: false,
        });
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
    if (state.guess.toLowerCase().trim() === state.word) award(8, "Correct!", () => nextRound("scramble"));
    else {
      setGameMessage(`Answer: ${state.word}`);
      setGameState(null);
    }
  };

  const submitMath = (state: Extract<GameState, { kind: "math" }>) => {
    if (!user) return;
    const g = Number(state.guess);
    let ans = state.a + state.b;
    if (state.op === "-") ans = state.a - state.b;
    if (state.op === "×") ans = state.a * state.b;
    if (g === ans) award(6, "Nice!", () => nextRound("math"));
    else {
      setGameMessage(`Answer: ${ans}`);
      setGameState(null);
    }
  };

  const submitMemoryPad = (state: Extract<GameState, { kind: "memory" }>, pad: number) => {
    if (!user || state.showing) return;
    const nextInput = [...state.userInput, pad];
    const idx = nextInput.length - 1;
    if (state.sequence[idx] !== pad) {
      setGameMessage("Wrong sequence — try again");
      setGameState(null);
      return;
    }
    if (nextInput.length === state.sequence.length) {
      award(10, "Sequence cleared!", () => nextRound("memory"));
      return;
    }
    setGameState({ ...state, userInput: nextInput });
  };

  const finishMemoryShow = (state: Extract<GameState, { kind: "memory" }>) => {
    setGameState({ ...state, showing: false, step: state.sequence.length });
  };

  return {
    startGame,
    submitScramble,
    submitMath,
    submitMemoryPad,
    finishMemoryShow,
    gameRound,
    gameScore,
  };
}
