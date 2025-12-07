import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

export interface ScoreEntry {
  id: number;
  playerName: string;
  points: number;
  round: number;
  createdAt: string;
}

export const Leaderboard = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setScores(data))
      .catch((err) => console.error("Failed to load leaderboard", err));
  }, [refreshTrigger]);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg text-white w-full">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-2">
        <Trophy className="text-yellow-400" />
        <h2 className="text-xl font-bold">Top Scores</h2>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {scores.length === 0 ? (
          <p className="text-gray-400 text-sm">No scores yet.</p>
        ) : (
          scores.map((score, index) => (
            <div
              key={score.id}
              className="flex justify-between items-center bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono font-bold w-6 text-center ${
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                      ? "text-gray-300"
                      : index === 2
                      ? "text-orange-400"
                      : "text-gray-500"
                  }`}
                >
                  #{index + 1}
                </span>
                <span className="font-medium truncate max-w-[100px]" title={score.playerName}>
                  {score.playerName}
                </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="font-bold text-green-400">{score.points} pts</span>
                 <span className="text-xs text-gray-500">R: {score.round}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};