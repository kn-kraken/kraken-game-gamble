import { useRef, useState, useEffect } from "react";
import { PoolBoard, type PoolBoardRef } from "./components/PoolBoard";
import { Sidebar } from "./components/Sidebar";
import { StartView } from "./components/startView";
import { ballImg } from "./components/types";
import { SaveScoreModal } from "./components/SaveScoreModal";

type GamePhase = "start" | "play" | "physics" | "scoring";

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
    ballNumbers: [],
    round: 1,
    currentPointsOnBoard: 0,
    totalPoints: 0,
    shakes: 3,
    betAmount: 0,
    balance: 500,
    specialBallsUsed: 3,
    specialBallsTotal: 0,
  });

  const prevState = useRef<GamePhase>("start");
  const [ballsInFields, setBallsInFields] = useState<number[]>([]);
  const [ballsInFieldsData, setBallsInFieldsData] = useState<
    Array<{ ballId: number; ballValue: number; zoneMultiplier: number }>
  >([]);
  const [ballsMoving, setBallsMoving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);

  // Poll ball movement state
  useEffect(() => {
    const interval = setInterval(() => {
      if (poolBoardRef.current) {
        setBallsMoving(poolBoardRef.current.areBallsMoving());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleScoreUpdate = (newScore: number) => {
    setGameState((prev) => {
      if (prev.currentPointsOnBoard === newScore) return prev;

      return {
        ...prev,
        currentPointsOnBoard: newScore,
      };
    });
  };

  useEffect(() => {
    if (prevState.current !== gameState.phase) {
      console.log("Game phase changed to:", gameState.phase);
      prevState.current = gameState.phase;
    }
  }, [gameState.phase]);

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

  const handleEndGame = () => {
    setGameState((prev) => ({
      ...prev,
      phase: "start",
      ballNumbers: [],
      round: 1,
      currentPointsOnBoard: 0,
      totalPoints: prev.currentPointsOnBoard + prev.totalPoints,
      shakes: 3,
      betAmount: 0,
    }));
    setShowSaveModal(true);
  };

  const handleShake = (force: number) => {
    poolBoardRef.current?.shake(force);
    console.log("SHAKE");
    setGameState((prev) => ({
      ...prev,
      phase: "physics",
      shakes: Math.max(0, prev.shakes - 1),
      currentPointsOnBoard: 0,
    }));
  };

  const handleBallsStopped = (
    ballsData: Array<{
      ballId: number;
      ballValue: number;
      zoneMultiplier: number;
    }>
  ) => {
    console.log("handleBallsStopped called with ballsData:", ballsData);
    setBallsInFieldsData(ballsData);
    setGameState((prev) => {
      const newPhase = ballsData.length > 0 ? "scoring" : "play";
      console.log("Setting phase to:", newPhase);
      return {
        ...prev,
        phase: newPhase,
      };
    });
  };

  const handleScoringComplete = (totalEarned: number) => {
    console.log("Scoring complete, totalEarned:", totalEarned);
    setGameState((prev) => {
      return {
        ...prev,
        phase: "play",
        balance: prev.balance,
        totalPoints: prev.totalPoints + totalEarned,
      };
    });
    setBallsInFieldsData([]);
  };

  const resetGame = () => {
    setGameState((prev) => {
      return {
        phase: "start",
        ballNumbers: [],
        round: 1,
        currentPointsOnBoard: 0,
        totalPoints: 0,
        shakes: 3,
        betAmount: 0,
        balance: prev.balance + prev.totalPoints,
        specialBallsUsed: 3,
        specialBallsTotal: 0,
      };
    });
    setBallsInFields([]);
    setShowSaveModal(false);
  };

  const handleSaveScore = async (name: string) => {
    const finalScore = gameState.currentPointsOnBoard + gameState.totalPoints;

    try {
      await fetch("http://localhost:3001/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: name,
          points: finalScore,
          round: gameState.round,
        }),
      });
      setLeaderboardRefresh((prev) => prev + 1);
    } catch (err) {
      console.error("Error saving score:", err);
      alert("Failed to save score server-side.");
    } finally {
      resetGame();
    }
  };

  return (
    <div className="h-screen bg-bg flex w-screen">
      <div className="flex items-center justify-center">
        <Sidebar
          gameState={gameState}
          onShake={handleShake}
          onEndGame={handleEndGame}
          ballsMoving={ballsMoving}
          scoringData={ballsInFieldsData}
          onScoringComplete={handleScoringComplete}
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
                onBallsStopped={handleBallsStopped}
              />

              <div className="bg-bg p-4 fixed bottom-2 rounded-r-full">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {gameState.ballNumbers.map((num, index) => {
                    const isInField = ballsInFields.includes(index);
                    const ball = ballImg[num - 1];
                    if (!ball) return null; // zabezpieczenie
                    return (
                      <div
                        key={index}
                        className="w-12 h-12 flex items-center justify-center relative transition-all duration-200"
                        style={{
                          filter: isInField
                            ? "drop-shadow(0 8px 6px rgba(255,215,0,0.6))"
                            : "drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3))",
                          transform: isInField
                            ? "translateY(-8px) scale(1.1)"
                            : "translateY(0) scale(1)",
                        }}
                      >
                        <img
                          src={ball.src}
                          alt={`Ball ${num}`}
                          className="absolute top-0 left-0 w-full h-full object-contain"
                          draggable={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showSaveModal && (
        <SaveScoreModal
          finalScore={gameState.totalPoints}
          onSave={handleSaveScore}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

export default App;
