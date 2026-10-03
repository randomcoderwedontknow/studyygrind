import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { GameState, UserData } from "../../types";
import { PressableButton } from "../ui/PressableButton";

export function ReactionGame({
  state,
  setGameState,
  user,
  updateUser,
  grantMiniGamePoints,
  setGameMessage,
  onQuit,
}: {
  state: Extract<GameState, { kind: "reaction" }>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  user: UserData;
  updateUser: (u: UserData) => void;
  grantMiniGamePoints: (u: UserData, n: number) => UserData;
  setGameMessage: (s: string) => void;
  onQuit: () => void;
}) {
  useEffect(() => {
    if (!state.waiting || state.falseStart) return;
    const delay = Math.max(0, state.startAt - Date.now());
    const t = setTimeout(() => setGameState({ ...state, waiting: false, startAt: Date.now() }), delay);
    return () => clearTimeout(t);
  }, [state.waiting, state.startAt, state.falseStart, setGameState, state]);

  const bg = state.falseStart ? "var(--danger, #c0392b)" : state.waiting ? "var(--muted, #555)" : "var(--success, #2ecc71)";

  return (
    <section className="card game-stage reaction-stage" style={{ background: bg, color: "#fff", minHeight: 200 }}>
      <h4 style={{ color: "#fff" }}>Reaction Tap</h4>
      {state.falseStart ? (
        <p>Too early! Wait for green.</p>
      ) : state.waiting ? (
        <p>Wait…</p>
      ) : (
        <p>TAP NOW!</p>
      )}
      <PressableButton
        onClick={() => {
          if (state.falseStart) {
            setGameState(null);
            return;
          }
          if (state.waiting) {
            setGameState({ ...state, falseStart: true, waiting: true });
            setGameMessage("False start");
            return;
          }
          const ms = Date.now() - state.startAt;
          const pts = Math.max(4, Math.floor(20 - ms / 50));
          const nu = grantMiniGamePoints(user, pts);
          updateUser(nu);
          setGameMessage(`Reaction: ${ms}ms → +${pts} pts`);
          setGameState(null);
        }}
      >
        {state.waiting && !state.falseStart ? "Don't tap yet" : "Tap"}
      </PressableButton>
      <button type="button" className="ghost" style={{ color: "#fff" }} onClick={onQuit}>
        Quit
      </button>
    </section>
  );
}
