import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { MINI_GAMES, CHESS_MICRO_PUZZLES } from "../data/mini-games";
import { GAME_POINTS_DAILY_CAP } from "../data/constants";
import { useGames } from "../hooks/useGames";
import type { GameKind, GameState } from "../types";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

export function GamesPage() {
  const {
    user,
    gameState,
    setGameState,
    gameScore,
    gameRound,
    gameMessage,
    setGameMessage,
    updateUser,
    grantMiniGamePoints,
    setToast,
  } = useStudyGrind();
  const { startGame, submitScramble, submitMath } = useGames();
  const [rulesKind, setRulesKind] = useState<GameKind | null>(null);

  if (!user) return null;

  const isUnlocked = (id: string) => user.gamesUnlocked.includes(id) || MINI_GAMES.find((g) => g.id === id)?.free;

  const gameDef = rulesKind ? MINI_GAMES.find((g) => g.kind === rulesKind) : null;

  return (
    <PageTransition>
      <section className="hero-panel">
        <h4>
          <Sparkles size={16} /> Break activities
        </h4>
        <p>Quick breaks between study blocks — up to {GAME_POINTS_DAILY_CAP} bonus points per day.</p>
        <span className="pill">
          Today: {user.gamePointsEarnedDate === new Date().toDateString() ? user.gamePointsEarnedToday : 0}/{GAME_POINTS_DAILY_CAP}
        </span>
      </section>

      {!gameState && (
        <section className="games-grid">
          {MINI_GAMES.map((g) => {
            const unlocked = isUnlocked(g.id);
            return (
              <article key={g.id} className="card game-slot">
                <b>{g.title}</b>
                <small>{g.blurb}</small>
                <div className="row wrap">
                  <PressableButton variant="ghost" onClick={() => setRulesKind(g.kind)}>
                    Rules
                  </PressableButton>
                  <PressableButton
                    onClick={() => {
                      if (!unlocked) {
                        if (user.focusPoints < g.price) return setToast(`Need ${g.price} pts`);
                        updateUser({
                          ...user,
                          focusPoints: user.focusPoints - g.price,
                          gamesUnlocked: [...user.gamesUnlocked, g.id],
                        });
                      }
                      setRulesKind(null);
                      startGame(g.kind);
                    }}
                  >
                    {!unlocked ? `Unlock ${g.price}` : "Play"}
                  </PressableButton>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {rulesKind && gameDef && !gameState && (
        <section className="card game-rules">
          <h4>{gameDef.title} — Rules</h4>
          <p>{gameDef.blurb}</p>
          <p className="soft">~{gameDef.pointsPerRound} pts per success (daily cap applies).</p>
          <PressableButton onClick={() => startGame(gameDef.kind)}>Start</PressableButton>
          <PressableButton variant="ghost" onClick={() => setRulesKind(null)}>
            Back
          </PressableButton>
        </section>
      )}

      {gameState?.kind === "scramble" && (
        <GameStage title="Word Scramble" round={gameRound} score={gameScore} message={gameMessage} onQuit={() => setGameState(null)}>
          <div className="scramble-letters">
            {gameState.scrambled.split("").map((ch, i) => (
              <span key={`${ch}${i}`} className="scramble-tile">
                {ch}
              </span>
            ))}
          </div>
          <input
            value={gameState.guess}
            onChange={(e) => setGameState({ ...gameState, guess: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submitScramble(gameState)}
          />
          <PressableButton onClick={() => submitScramble(gameState)}>Submit</PressableButton>
        </GameStage>
      )}

      {gameState?.kind === "math" && (
        <GameStage title="Number Ninja" round={gameRound} score={gameScore} message={gameMessage} onQuit={() => setGameState(null)}>
          <div className="math-prompt">
            {gameState.a} {gameState.op} {gameState.b} = ?
          </div>
          <input
            type="number"
            value={gameState.guess}
            onChange={(e) => setGameState({ ...gameState, guess: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submitMath(gameState)}
          />
          <PressableButton onClick={() => submitMath(gameState)}>Submit</PressableButton>
        </GameStage>
      )}

      {gameState?.kind === "reaction" && (
        <ReactionGame
          state={gameState}
          setGameState={setGameState}
          user={user}
          updateUser={updateUser}
          grantMiniGamePoints={grantMiniGamePoints}
          setGameMessage={setGameMessage}
          setGameScore={() => {}}
        />
      )}

      {gameState?.kind === "chessMicro" && (
        <GameStage title="Micro Chess" round={gameRound} score={gameScore} message={gameMessage} onQuit={() => setGameState(null)}>
          <p>{CHESS_MICRO_PUZZLES[gameState.puzzleIdx].q}</p>
          {CHESS_MICRO_PUZZLES[gameState.puzzleIdx].opts.map((label, i) => (
            <PressableButton
              key={label}
              onClick={() => {
                const puzzle = CHESS_MICRO_PUZZLES[gameState.puzzleIdx];
                if (i === puzzle.ans) {
                  const nu = grantMiniGamePoints(user, 9);
                  updateUser(nu);
                  setGameMessage("+9 pts");
                } else setGameState(null);
              }}
            >
              {label}
            </PressableButton>
          ))}
        </GameStage>
      )}

      {/* Additional game kinds use simplified stubs */}
      {gameState && !["scramble", "math", "reaction", "chessMicro"].includes(gameState.kind) && (
        <GenericMiniGame
          state={gameState}
          setGameState={setGameState}
          user={user}
          updateUser={updateUser}
          grantMiniGamePoints={grantMiniGamePoints}
          setGameMessage={setGameMessage}
        />
      )}
    </PageTransition>
  );
}

function GameStage({
  title,
  round,
  score,
  message,
  onQuit,
  children,
}: {
  title: string;
  round: number;
  score: number;
  message: string;
  onQuit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="card game-stage">
      <h4>{title}</h4>
      <p className="soft">
        Round {round + 1} · Score {score}
      </p>
      {children}
      {message && <p className="break">{message}</p>}
      <PressableButton variant="ghost" onClick={onQuit}>
        Quit
      </PressableButton>
    </section>
  );
}

function ReactionGame({
  state,
  setGameState,
  user,
  updateUser,
  grantMiniGamePoints,
  setGameMessage,
}: {
  state: Extract<GameState, { kind: "reaction" }>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  user: NonNullable<ReturnType<typeof useStudyGrind>["user"]>;
  updateUser: (u: typeof user) => void;
  grantMiniGamePoints: (u: typeof user, n: number) => typeof user;
  setGameMessage: (s: string) => void;
  setGameScore: React.Dispatch<React.SetStateAction<number>>;
}) {
  useEffect(() => {
    if (!state.waiting) return;
    const delay = Math.max(0, state.startAt - Date.now());
    const t = setTimeout(() => setGameState({ ...state, waiting: false, startAt: Date.now() }), delay);
    return () => clearTimeout(t);
  }, [state.waiting, state.startAt]);

  return (
    <GameStage title="Reaction Tap" round={0} score={0} message="" onQuit={() => setGameState(null)}>
      {state.waiting ? (
        <p>Wait for green...</p>
      ) : (
        <PressableButton
          onClick={() => {
            const ms = Date.now() - state.startAt;
            const pts = Math.max(4, Math.floor(20 - ms / 50));
            const nu = grantMiniGamePoints(user, pts);
            updateUser(nu);
            setGameMessage(`Reaction: ${ms}ms → +${pts} pts`);
            setGameState(null);
          }}
        >
          TAP!
        </PressableButton>
      )}
    </GameStage>
  );
}

function GenericMiniGame({
  state,
  setGameState,
  user,
  updateUser,
  grantMiniGamePoints,
  setGameMessage,
}: {
  state: NonNullable<GameState>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  user: NonNullable<ReturnType<typeof useStudyGrind>["user"]>;
  updateUser: (u: typeof user) => void;
  grantMiniGamePoints: (u: typeof user, n: number) => typeof user;
  setGameMessage: (s: string) => void;
}) {
  const title = state.kind;
  return (
    <GameStage title={title} round={0} score={0} message="" onQuit={() => setGameState(null)}>
      <p className="soft">Quick round — tap Win to score.</p>
      <PressableButton
        onClick={() => {
          const nu = grantMiniGamePoints(user, 10);
          updateUser(nu);
          setGameMessage("+10 pts");
          setGameState(null);
        }}
      >
        Win round
      </PressableButton>
    </GameStage>
  );
}
