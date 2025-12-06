import { useRef, useState, useEffect } from "react";
import { PoolBoard, type PoolBoardRef } from "./components/PoolBoard";
import { ForceBtn } from "./components/ForceBtn";
import { Check } from "lucide-react";

type GamePhase = "start" | "play";

interface GameState {
  phase: GamePhase;
  ballCount: number;
  round: number;
  currentPointsOnBoard: number;
  totalPoints: number;
  shakes: number;
}

function App() {
  const poolBoardRef = useRef<PoolBoardRef>(null);
  const [gameState, setGameState] = useState<GameState>({
    phase: "start",
    ballCount: 6,
    round: 1,
    currentPointsOnBoard: 0,
    totalPoints: 0,
    shakes: 3,
  });
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
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: 0,
      shakes: 3,
    }));
  };

  const handleEndGamge = () => {
    setGameState({
      phase: "start",
      ballCount: 6,
      round: 1,
      currentPointsOnBoard: 100,
      totalPoints: gameState.currentPointsOnBoard,
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
    setGameState((prev) => ({
      ...prev,
      ballCount: count,
    }));
  };

  return (
    <div className="h-screen p-8 bg-gray-800 flex flex-col">
      <div className="mx-auto w-full h-[80vh]">
        <PoolBoard ref={poolBoardRef} ballCount={gameState.ballCount} />
      </div>
      <div className="flex-1 w-full flex justify-between items-center ">
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
    </div>
  );
}

export default App;
