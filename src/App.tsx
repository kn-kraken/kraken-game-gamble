import { useRef, useState, useEffect } from "react";
import { PoolBoard, type PoolBoardRef } from "./components/PoolBoard";
import { Sidebar } from "./components/Sidebar";
import { StartView } from "./components/startView";

type GamePhase = "start" | "play";

interface GameState {
  phase: GamePhase;
  ballNumbers: number[];
  round: number;
  currentPointsOnBoard: number;
  totalPoints: number;
  shakes: number;
  betAmount: number;
  balance: number;
  specialBallsUsed: number;
  specialBallsTotal: number;
}

// Generate random ball numbers between 1-49
const generateBallNumbers = (count: number): number[] => {
  const safeCount = Math.min(count, 20);

  const numbers = Array.from({ length: 49 }, (_, i) => i + 1);

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers.slice(0, safeCount).sort((a, b) => a - b);
};

function App() {
  const poolBoardRef = useRef<PoolBoardRef>(null);
  const [gameState, setGameState] = useState<GameState>({
    phase: "start",
    ballNumbers: generateBallNumbers(0),
    round: 1,
    currentPointsOnBoard: 0,
    totalPoints: 0,
    shakes: 3,
    betAmount: 0,
    balance: 500,
    specialBallsUsed: 3,
    specialBallsTotal: 0,
  });

  const [ballsInFields, setBallsInFields] = useState<number[]>([]);

  const handleScoreUpdate = (newScore: number) => {
    setGameState((prev) => {
      // Drobna optymalizacja: nie aktualizuj stanu, jeśli punkty się nie zmieniły
      if (prev.currentPointsOnBoard === newScore) return prev;

      return {
        ...prev,
        currentPointsOnBoard: newScore,
      };
    });
  };
  const [ballsMoving, setBallsMoving] = useState(false);

  // Poll ball movement state
  useEffect(() => {
    const interval = setInterval(() => {
      if (poolBoardRef.current) {
        setBallsMoving(poolBoardRef.current.areBallsMoving());
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, []);

  const handleStartGame = (ballCount: number, betAmount: number) => {
    setGameState((prev) => ({
      ...prev,
      phase: "play",
      ballNumbers: generateBallNumbers(ballCount),
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: 0,
      shakes: 3,
      betAmount,
      balance: prev.balance - betAmount,
      specialBallsUsed: 3,
      specialBallsTotal: 0,
    }));
  };

  const handleEndGamge = () => {
    setGameState((prev) => ({
      ...prev,
      phase: "start",
      ballNumbers: generateBallNumbers(6),
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: gameState.currentPointsOnBoard + gameState.totalPoints,
      shakes: 3,
      betAmount: 0,
    }));
    alert("Game Over!");
  };

  const handleShake = (force: number) => {
    poolBoardRef.current?.shake(force);
    setGameState((prev) => ({
      ...prev,
      shakes: Math.max(0, prev.shakes - 1),
    }));
  };

  return (
    <div className="h-screen bg-bg flex w-screen">
      <div className="flex items-center justify-center">
        <Sidebar
          gameState={gameState}
          onShake={handleShake}
          onEndGame={handleEndGamge}
          ballsMoving={ballsMoving}
        />
      </div>
      <div className="w-full h-full flex flex-col">
        <div className="flex-1">
          {gameState.phase === "start" ? (
            <StartView handleStartGame={handleStartGame} />
          ) : (
            <>
              <PoolBoard
                ref={poolBoardRef}
                ballCount={gameState.ballNumbers.length}
                ballNumbers={gameState.ballNumbers}
                onScoreChange={handleScoreUpdate}
                onBallsInFieldChange={setBallsInFields}
              />

              <div className="bg-bg p-4  fixed bottom-2 rounded-r-full">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {gameState.ballNumbers.map((num, index) => {
                    const isInField = ballsInFields.includes(index);
                    return (
                      <div
                        key={index}
                        className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg relative transition-all duration-200"
                        style={{
                          boxShadow: isInField
                            ? "0 8px 12px rgba(255,215,0,0.6), 0 4px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3)"
                            : "0 4px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3)",
                          transform: isInField
                            ? "translateY(-8px) scale(1.1)"
                            : "translateY(0) scale(1)",
                        }}
                      >
                        <span className="text-black font-bold text-sm z-10">
                          {num}
                        </span>
                        <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white opacity-60" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
