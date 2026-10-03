import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { MINI_GAMES } from "../data/mini-games";
import { GAME_POINTS_DAILY_CAP } from "../data/constants";
import { useGames } from "../hooks/useGames";
import { scalePrice, applyDiscount } from "../lib/pricing";
import type { GameKind } from "../types";
import { MemorySimonGame } from "../components/games/MemorySimonGame";
import { ReactionGame } from "../components/games/ReactionGame";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";

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
  const { startGame, submitScramble, submitMath, submitMemoryPad, finishMemoryShow } = useGames();
  const [rulesKind, setRulesKind] = useState<GameKind | null>(null);

  if (!user) return null;

  const isUnlocked = (id: string) => user.gamesUnlocked.includes(id) || MINI_GAMES.find((g) => g.id === id)?.free;

  const gameDef = rulesKind ? MINI_GAMES.find((g) => g.kind === rulesKind) : null;
  const quit = () => setGameState(null);

  return (
    <PageTransition>
      <section className="hero-panel">
        <h4>
          <Sparkles size={16} /> Break activities
        </h4>
        <p>Four quick games between study blocks — up to {GAME_POINTS_DAILY_CAP} bonus points per day.</p>
        <span className="pill">
          Today: {user.gamePointsEarnedDate === new Date().toDateString() ? user.gamePointsEarnedToday : 0}/{GAME_POINTS_DAILY_CAP}
        </span>
      </section>

      {!gameState && (
        <section className="games-grid">
          {MINI_GAMES.map((g) => {
            const unlocked = isUnlocked(g.id);
            const price = applyDiscount(scalePrice(g.price), user.discount);
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
                        if (user.focusPoints < price) return setToast(`Need ${price.toLocaleString()} pts`);
                        updateUser({
                          ...user,
                          focusPoints: user.focusPoints - price,
                          gamesUnlocked: [...user.gamesUnlocked, g.id],
                        });
                      }
                      setRulesKind(null);
                      startGame(g.kind);
                    }}
                  >
                    {!unlocked ? `Unlock ${price.toLocaleString()}` : "Play"}
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
        <GameStage title="Word Scramble" round={gameRound} score={gameScore} message={gameMessage} onQuit={quit}>
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
        <GameStage title="Number Ninja" round={gameRound} score={gameScore} message={gameMessage} onQuit={quit}>
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
          onQuit={quit}
        />
      )}

      {gameState?.kind === "memory" && (
        <MemorySimonGame
          state={gameState}
          round={gameRound}
          score={gameScore}
          message={gameMessage}
          onPad={(pad) => submitMemoryPad(gameState, pad)}
          onShowComplete={() => finishMemoryShow(gameState)}
          onQuit={quit}
        />
      )}
    </PageTransition>
  );
}
