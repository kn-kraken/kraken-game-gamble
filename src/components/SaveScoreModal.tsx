import { useState } from "react";

interface SaveScoreModalProps {
  score: number;
  round: number;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const SaveScoreModal = ({ score, round, onSave, onClose }: SaveScoreModalProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl w-96">
        <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
        <p className="text-gray-400 mb-6">
          You scored <span className="text-green-400 font-bold text-xl">{score}</span> points
          in round {round}.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Enter your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              autoFocus
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Player Name"
            />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Save Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};