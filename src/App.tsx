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
    setGameState((prev) => ({
      ...prev,
      ballCount: count,
    }));
  };

  return (
    <div className="flex h-screen bg-gray-800 overflow-hidden">
      <aside className="w-64 h-full bg-gray-900 border-r border-gray-700 text-white p-4 flex flex-col shrink-0">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        {/* Przykładowa zawartość paska bocznego */}
        <div className="space-y-2 text-gray-400">
          <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Opcje gry</div>
          <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Statystyki</div>
          <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Ustawienia</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative">
        
        <div className="flex-1 w-full p-4 flex flex-col justify-center items-center min-h-0">
          <div className="aspect-[12/9] max-h-full w-full max-w-7xl mx-auto bg-black/20 relative shadow-2xl">
            <PoolBoard 
              ref={poolBoardRef} 
              ballCount={gameState.ballCount} 
              onScoreChange={handleScoreUpdate}
            />
          </div>
        </div>
        <div className="w-full bg-gray-900/80 p-6 flex justify-between items-center border-t border-gray-700 shrink-0 z-10">
          <div className="text-gray-400">test</div>

          <div className="text-white space-y-1">
            <div className="text-lg">
              <span className="font-bold text-gray-400">Round:</span> {gameState.round}
            </div>
            <div className="text-lg">
              <span className="font-bold text-gray-400">Points on Board:</span>{" "}
              {gameState.currentPointsOnBoard}
            </div>
            <div className="text-lg">
              <span className="font-bold text-gray-400">Total Points:</span>{" "}
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
              className="w-16 h-16 bg-blue-600 text-white grid place-items-center hover:bg-blue-500 transition-colors rounded shadow-lg"
            >
              <Check className="w-8 h-8" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
