import { PoolBoard } from "./components/PoolBoard";

function App() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">2D Pool Gamble</h1>
          <p className="text-gray-400">Simple pool physics simulation</p>
        </header>

        <div className="bg-slate-700 rounded-xl p-6 shadow-2xl">
          <PoolBoard width={800} height={500} />
        </div>

        <footer className="mt-6 text-center text-gray-500 text-sm">
          <p>Mock UI - Ready for future updates</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
