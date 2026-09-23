import React, { useState } from 'react';
import { Play, ShieldAlert, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function SimulationControls({ onRunSimulation, onReset }) {
  const [activeScenario, setActiveScenario] = useState(null);

  const handleRun = async (scenarioType) => {
    setActiveScenario(scenarioType);
    try {
      await onRunSimulation(scenarioType);
    } finally {
      setTimeout(() => setActiveScenario(null), 1000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm tracking-wide font-['JetBrains_Mono']">
              DEMO SCENARIO SIMULATOR
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test runtime defense with real-time agent workloads and compromise vectors
          </p>
        </div>

        {/* Buttons Deck */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Normal Workload */}
          <button
            onClick={() => handleRun('normal')}
            disabled={activeScenario !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold font-mono bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${activeScenario === 'normal' ? 'animate-spin' : ''}`} />
            <span>Normal Operation</span>
          </button>

          {/* Ambiguous / Challenge Action */}
          <button
            onClick={() => handleRun('challenge')}
            disabled={activeScenario !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold font-mono bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700/80 transition-all disabled:opacity-50"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeScenario === 'challenge' ? 'animate-spin' : ''}`} />
            <span>Challenge Scenario</span>
          </button>

          {/* Rogue Compromised Agent (Star of the demo!) */}
          <button
            onClick={() => handleRun('attack')}
            disabled={activeScenario !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 animate-pulse hover:animate-none"
          >
            <ShieldAlert className={`w-4 h-4 ${activeScenario === 'attack' ? 'animate-spin' : ''}`} />
            <span>SIMULATE COMPROMISED AGENT</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={activeScenario !== null}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all disabled:opacity-50"
            title="Reset system to clean baseline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

        </div>

      </div>
    </div>
  );
}
