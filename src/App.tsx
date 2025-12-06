import { useRef, useState } from "react";
import { PoolBoard, type PoolBoardRef } from "./components/PoolBoard";
import { ForceBtn } from "./components/ForceBtn";

interface GameState {
  round: number;
  currentPointsOnBoard: number;
  totalPoints: number;
  shakes: number;
}

function App() {
  const poolBoardRef = useRef<PoolBoardRef>(null);
  const [gameState, setGameState] = useState<GameState>({
    round: 1,
    currentPointsOnBoard: 0,
    totalPoints: 0,
    shakes: 3,
  });

  const handleShake = (force: number) => {
    poolBoardRef.current?.shake(force);
    setGameState((prev) => ({
      ...prev,
      shakes: Math.max(0, prev.shakes - 1),
    }));
  };

  return (
    <div className="h-screen p-8 bg-gray-800 flex flex-col">
      <div className="mx-auto w-full h-[80vh]  ">
        <PoolBoard ref={poolBoardRef} />
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

        <ForceBtn
          onShake={handleShake}
          disabled={gameState.shakes < 1}
          shakesRemaining={gameState.shakes}
        />
      </div>
    </div>
  );
}

export default App;
