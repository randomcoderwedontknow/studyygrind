import { useEffect, useRef } from "react";
import type { GameState } from "../../types";

const PAD_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"];
const PAD_LABELS = ["Red", "Green", "Blue", "Yellow"];

function playTone(pad: number, ctx: AudioContext) {
  const freqs = [329.63, 392, 523.25, 659.25];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freqs[pad] ?? 440;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.stop(ctx.currentTime + 0.36);
}

export function MemorySimonGame({
  state,
  onPad,
  onShowComplete,
  onQuit,
  round,
  score,
  message,
}: {
  state: Extract<GameState, { kind: "memory" }>;
  onPad: (pad: number) => void;
  onShowComplete: () => void;
  round: number;
  score: number;
  message: string;
  onQuit: () => void;
}) {
  const audioRef = useRef<AudioContext | null>(null);
  const litPad = state.showing ? state.sequence[Math.max(0, state.step - 1)] : null;

  useEffect(() => {
    if (!state.showing) return;
    let i = 0;
    const ctx = audioRef.current ?? new AudioContext();
    audioRef.current = ctx;
    const interval = setInterval(() => {
      if (i >= state.sequence.length) {
        clearInterval(interval);
        setTimeout(onShowComplete, 400);
        return;
      }
      playTone(state.sequence[i], ctx);
      i += 1;
    }, 580);
    return () => clearInterval(interval);
  }, [state.showing, state.sequence, onShowComplete]);

  return (
    <section className="card game-stage simon-stage">
      <h4>Memory Sprint</h4>
      <p className="soft">
        Round {round + 1} · Score {score}
      </p>
      <p className="soft">{state.showing ? "Watch the pattern…" : "Repeat the pattern"}</p>
      <div className="simon-grid">
        {[0, 1, 2, 3].map((pad) => (
          <button
            key={pad}
            type="button"
            className={`simon-pad ${litPad === pad && state.showing ? "simon-lit" : ""}`}
            style={{ background: PAD_COLORS[pad] }}
            disabled={state.showing}
            aria-label={PAD_LABELS[pad]}
            onClick={() => {
              const ctx = audioRef.current ?? new AudioContext();
              audioRef.current = ctx;
              playTone(pad, ctx);
              onPad(pad);
            }}
          />
        ))}
      </div>
      {message && <p className="break">{message}</p>}
      <button type="button" className="ghost" onClick={onQuit}>
        Quit
      </button>
    </section>
  );
}
