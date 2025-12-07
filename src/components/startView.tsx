import { coins } from "../utils/coins";
import { useState } from "react";

type Props = {
  handleStartGame: (ballCount: number, betAmount: number) => void;
};

export const StartView = ({ handleStartGame }: Props) => {
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({
    "1": 0,
    "5": 0,
    "10": 0,
    "20": 0,
  });

  const calculateTotal = (coinKey: string) => {
    const coinValue = parseInt(coinKey);
    const betAmount = betAmounts[coinKey];
    const maxWin = coins[coinKey as keyof typeof coins].max_win;

    // Scale max_win linearly based on bet amount
    // max_win is for the lowest bid (coinValue), so scale proportionally
    const scaledMaxWin = maxWin * (betAmount / coinValue);

    return scaledMaxWin;
  };

  const handleBetChange = (coinKey: string, increment: boolean) => {
    const coinValue = parseInt(coinKey);
    setBetAmounts((prev) => ({
      ...prev,
      [coinKey]: increment
        ? prev[coinKey] + coinValue
        : Math.max(0, prev[coinKey] - coinValue),
    }));
  };

  return (
    <div
      className="h-full bg-cover bg-center w-full flex justify-between px-16 items-center"
      style={{ backgroundImage: "url(/imgs/bg.png)" }}
    >
      {Object.entries(coins).map(([key, coin]) => (
        <div
          key={key}
          className="w-80 bg-bg rounded-3xl p-8 flex flex-col items-center gap-4 border-8 border-black relative pt-32"
        >
          {/* Coin Image */}
          <img
            src={coin.img}
            alt={`${key} coin`}
            className="w-32 h-32 absolute top-[-16%]"
          />

          {/* Distribution Section */}
          <div className="text-white text-center -mt-[66px] pb-12">
            <div className="text-2xl font-bold">rozdanie</div>
            <div className="text-4xl font-bold mt-2">
              <span>{key} kuli</span>
            </div>
          </div>

          <div className="flex ml-auto mr-0">
            <button
              onClick={() => handleBetChange(key, false)}
              className="w-10 h-10 bg-red-400 rounded-xl text-2xl flex items-center justify-center hover:bg-red-500 font-bold text-white"
            >
              -
            </button>
            <button
              onClick={() => handleBetChange(key, true)}
              className="w-10 h-10 bg-green-500 rounded-xl text-2xl flex items-center justify-center hover:bg-green-600 font-bold text-white"
            >
              +
            </button>
          </div>
          {/* Bet Amount */}
          <div className="bg-gray-800 w-full py-3 px-4 rounded-xl text-center flex items-center justify-between">
            <span className="text-white text-xl font-bold">zakład</span>
            <span className="text-white text-2xl font-bold min-w-[80px] bg-[#333A3C] rounded-md">
              {betAmounts[key]} zł
            </span>
          </div>

          {/* Total */}
          <div className="bg-primary w-full py-5 rounded-xl text-center">
            <span className="text-4xl font-bold text-black">
              {calculateTotal(key)} zł
            </span>
          </div>

          {/* Select Button */}
          <button
            onClick={() => handleStartGame(parseInt(key), betAmounts[key])}
            disabled={betAmounts[key] === 0}
            className="bg-green-700 shadow-2xl w-full py-5 rounded-xl text-white text-3xl font-bold hover:bg-green-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            wybierz
          </button>
        </div>
      ))}
    </div>
  );
};
