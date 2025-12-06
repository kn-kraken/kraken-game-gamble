import { useRef, useState, useEffect } from "react";
import { PoolBoard, type PoolBoardRef } from "./components/PoolBoard";
import { ForceBtn } from "./components/ForceBtn";
import { Check } from "lucide-react";

type GamePhase = "start" | "play";

interface GameState {
  phase: GamePhase;
  ballNumbers: number[];
  round: number;
  currentPointsOnBoard: number;
  totalPoints: number;
  shakes: number;
}

// Generate random ball numbers between 1-49
const generateBallNumbers = (count: number): number[] => {
  return Array.from(
    { length: Math.min(count, 20) },
    () => Math.floor(Math.random() * 49) + 1
  );
};

function App() {
  const poolBoardRef = useRef<PoolBoardRef>(null);
  const [gameState, setGameState] = useState<GameState>({
    phase: "start",
    ballNumbers: generateBallNumbers(20),
    round: 1,
    currentPointsOnBoard: 0,
    totalPoints: 0,
    shakes: 3,
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

  const handleStartGame = () => {
    setGameState((prev) => ({
      ...prev,
      phase: "play",
      ballNumbers: generateBallNumbers(prev.ballNumbers.length),
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: 0,
      shakes: 3,
    }));
  };

  const handleEndGamge = () => {
    setGameState({
      phase: "start",
      ballNumbers: generateBallNumbers(6),
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: gameState.currentPointsOnBoard + gameState.totalPoints,
      shakes: 3,
    });
    alert("Game Over!");
  };

  const handleShake = (force: number) => {
    poolBoardRef.current?.shake(force);
    setGameState((prev) => ({
      ...prev,
      shakes: Math.max(0, prev.shakes - 1),
    }));
  };

  const handleBallCountChange = (count: number) => {
    const limitedCount = Math.min(count, 20);
    setGameState((prev) => ({
      ...prev,
      ballNumbers: generateBallNumbers(limitedCount),
    }));
  };

  return (
    <div className="h-screen bg-bg flex gap-8">
      <div className="w-1/4 flex flex-col justify-center items-start gap-8 p-4">
        <div>test</div>

        <div className="text-white space-y-2">
          <div className="text-xl">
            <span className="font-bold">Round:</span> {gameState.round}
          </div>
          <div className="text-xl">
            <span className="font-bold">Points on Board:</span>{" "}
            {gameState.currentPointsOnBoard}
          </div>
          <div className="text-xl">
            <span className="font-bold">Total Points:</span>{" "}
            {gameState.totalPoints}
          </div>
        </div>

        <div className="flex gap-4">
          <ForceBtn
            onShake={handleShake}
            disabled={gameState.shakes < 1 || ballsMoving}
            shakesRemaining={gameState.shakes}
          />
          <button
            onClick={handleEndGamge}
            className="w-16 h-16 bg-blue-600 text-white grid place-items-center hover:cursor-pointer"
          >
            <Check className="w-8 h-8" />
          </button>
        </div>
      </div>
      <div className="w-3/4 h-full flex flex-col">
        <div className="flex-1">
          <PoolBoard
            ref={poolBoardRef}
            ballCount={gameState.ballNumbers.length}
            ballNumbers={gameState.ballNumbers}
            onScoreChange={handleScoreUpdate}
            onBallsInFieldChange={setBallsInFields}
          />
        </div>

        {/* Bottom ball display */}
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
      </div>
    </div>
  );
}

export default App;
