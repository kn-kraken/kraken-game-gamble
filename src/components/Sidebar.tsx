import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

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

interface SidebarProps {
  gameState: GameState;
  onShake: (force: number) => void;
  onEndGame: () => void;
  ballsMoving: boolean;
}

export function Sidebar({
  gameState,
  onShake,
  onEndGame,
  ballsMoving,
}: SidebarProps) {
  const {
    ballNumbers,
    shakes,
    currentPointsOnBoard: totalScore,
    betAmount,
    balance,
    specialBallsUsed,
    specialBallsTotal,
  } = gameState;
  const ballCount = ballNumbers.length;
  const [isHolding, setIsHolding] = useState(false);
  const force = useMotionValue(0);
  const [displayForce, setDisplayForce] = useState(0);
  const animationRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1); // 1 for increasing, -1 for decreasing

  // Update display value when motion value changes
  useEffect(() => {
    const unsubscribe = force.on("change", (latest) => {
      setDisplayForce(Math.round(latest));
    });
    return unsubscribe;
  }, [force]);

  useEffect(() => {
    console.log("Animation effect", { isHolding, ballsMoving, shakes });
    if (isHolding && !ballsMoving && shakes > 0) {
      console.log("Starting animation");
      let currentValue = 0;

      const animate = () => {
        currentValue += directionRef.current * 2;

        if (currentValue >= 100) {
          currentValue = 100;
          directionRef.current = -1;
        } else if (currentValue <= 0) {
          currentValue = 0;
          directionRef.current = 1;
        }

        console.log("Animating:", currentValue);
        force.set(currentValue);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log("Stopping animation");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHolding, ballsMoving, shakes]);

  const handleMouseDown = () => {
    console.log("MouseDown", { ballsMoving, shakes, isHolding });
    if (!ballsMoving && shakes > 0) {
      console.log("Setting isHolding to true");
      setIsHolding(true);
      force.set(0);
      directionRef.current = 1;
    }
  };

  const handleMouseUp = () => {
    if (!ballsMoving && shakes > 0 && isHolding) {
      setIsHolding(false);
      onShake(force.get() / 100); // Convert to 0-1 range
      force.set(0);
      directionRef.current = 1;
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      handleMouseUp();
    }
  };

  return (
    <div className="w-full max-w-[560px] h-screen flex flex-col p-4 justify-between">
      {/* Header - Coolki */}
      <img src="/imgs/coolki.png" alt="Coolki Logo" />

      {/* Coin Display Card */}
      <div className={`bg-[#4a6d8c] rounded-3xl p-4 shadow-lg `}>
        {ballCount > 0 ? (
          <div className="flex items-center gap-4">
            {/* Coin Image */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={`/imgs/coins/${ballCount}.png`}
                alt={`Ball count ${ballCount}`}
                className="absolute inset-0 w-full h-full object-cover scale-110"
              />
            </div>

            {/* Text Info */}
            <div className="bg-[#b3d4f0] rounded-2xl px-4 py-3 flex-1">
              <p className="text-lg font-bold text-black">
                rozdanie {ballCount} losowych liczb
              </p>
              <p className="text-lg font-bold text-black">od 1 do 49</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24" />
        )}
      </div>

      {/* Balls and Shakes Info */}
      <div className="bg-bg-side rounded-3xl p-4 shadow-lg">
        <div className="grid grid-cols-[1fr_32px_1fr] justify-center gap-3 items-center">
          {/* Balls */}
          <div>
            <p className="text-lg font-bold text-white mb-2">kulki</p>
            <div className="bg-[#6bc97d] rounded-2xl px-4 py-3 text-center">
              <span className="text-3xl font-bold text-white">{ballCount}</span>
            </div>
          </div>

          <span className="text-3xl font-bold self-end -translate-y-[40%] translate-x-2 w-fit text-white">
            x
          </span>

          {/* Shakes */}
          <div>
            <p className="text-lg font-bold text-white mb-2">strefy</p>
            <div className="bg-[#c96b6b] rounded-2xl px-4 py-3 text-center flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-white">{0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-bg-side rounded-3xl p-4 shadow-lg flex">
        <p className="text-2xl font-bold text-white  flex-1 flex items-center justify-center">
          wynik
        </p>
        <div className="bg-[#3a4a4a] flex-1 rounded-2xl px-6 py-4 text-center">
          <span className="text-4xl font-bold text-white">{totalScore}</span>
        </div>
      </div>

      {/* Balance and Bet */}
      <div className="grid grid-cols-3 gap-3">
        {/* Balance */}
        <div className="bg-bg-side rounded-3xl flex p-3 shadow-lg col-span-2">
          <p className="text-2xl font-bold text-white flex-1 flex items-center justify-center">
            saldo
          </p>
          <div className="bg-[#3a4a4a] rounded-2xl flex-1 flex items-center justify-center px-3 py-2 text-center">
            <span className="text-2xl text-white">{balance} pk</span>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="bg-bg-side rounded-3xl p-2 shadow-lg flex flex-col items-center">
          <p className="text-2xl font-bold text-[#e87d3e] mb-2 flex-1">kurs</p>
          <div className="bg-[#3a4a4a] rounded-2xl flex-1 px-3 py-2 w-full text-center">
            <span className="text-2xl font-bold text-[#e87d3e]">
              {betAmount} <span className="text-white">pk</span>
            </span>
          </div>
        </div>
      </div>

      {/* Special Balls and Moves */}

      {/* <div className="bg-bg-side rounded-3xl p-4 shadow-lg"> */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-side rounded-3xl p-4 shadow-lg col-span-2">
          {/* Special Balls */}
          <div>
            <p className="font-bold text-white mb-2 text-2xl">specjalne</p>
            <div className="flex items-center gap-1">
              <img
                src="/imgs/special/purple.png"
                alt="Special Ball purple"
                className="w-16 h-16 -ml-4"
              />
              <img
                src="/imgs/special/green.png"
                alt="Special Ball green"
                className="w-16 h-16 -ml-4"
              />
              <img
                src="/imgs/special/blue.png"
                alt="Special Ball blue"
                className="w-16 h-16 -ml-4"
              />
              {/* Counter */}
              <span className="text-2xl font-bold text-white ml-auto translate-y-2">
                {specialBallsUsed}/
                <span className="text-4xl text-[#e87d3e]">
                  {specialBallsTotal}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-bg-side rounded-3xl p-2 shadow-lg flex flex-col items-center">
          <p className="text-2xl font-bold text-[#e87d3e] flex-1">ruchy</p>
          <div className="bg-[#3a4a4a] rounded-2xl flex-1  flex-end justify-center px-3 py-2 w-full text-center">
            <div className="text-2xl font-bold text-white translate-y-[8px]">
              {3}/<span className="text-4xl text-[#e87d3e]">{shakes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Options */}
        <button className="bg-[#e8a857] hover:bg-[#d99747] rounded-3xl px-4 py-6 text-center transition-colors shadow-lg">
          <span className="text-xl font-bold text-white">opcje</span>
        </button>

        {/* End Game */}
        <button
          onClick={onEndGame}
          className="bg-[#c96b6b] hover:bg-[#b95b5b] rounded-3xl px-4 py-6 text-center transition-colors shadow-lg"
        >
          <span className="text-xl font-bold text-white">koniec</span>
        </button>

        {/* Mix/Shake - triggers the hold bar */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`bg-[#6bc97d] hover:bg-[#5bb86d] rounded-3xl px-4 py-6 text-center transition-colors shadow-lg cursor-pointer ${
            shakes < 1 || ballsMoving ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className="text-xl font-bold text-white">SHAKE!</span>
        </button>
      </div>

      {/* Shake Bar - shows the force */}
      <div className="w-full">
        <div className="w-full bg-gray-700 h-8 rounded overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: `${displayForce}%` }}
          />
        </div>
        <motion.div
          className="text-white text-center mt-2 text-lg font-bold"
          animate={isHolding ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
          transition={{ repeat: isHolding ? Infinity : 0, duration: 0.6 }}
        ></motion.div>
      </div>
    </div>
  );
}
