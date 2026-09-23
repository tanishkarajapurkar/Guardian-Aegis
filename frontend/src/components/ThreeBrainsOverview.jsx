import React from 'react';
import { ShieldCheck, Cpu, Brain, Flame } from 'lucide-react';

export default function ThreeBrainsOverview() {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-sky-400" />
          Guardian Defense Core: The Three Brains
        </span>
        <span className="text-[10px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
          Zero-Trust Inspection
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Brain 1: Policy */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200">1. Policy Engine (RBAC)</div>
            <div className="text-slate-500 text-[10px]">Deterministic Enforcement</div>
            <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
              Validates requested tools against the agent's strict operational manifest.
            </p>
          </div>
        </div>

        {/* Brain 2: ML Behavior */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-purple-950/60 border border-purple-800 text-purple-400 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200">2. Behavior Monitor (ML)</div>
            <div className="text-slate-500 text-[10px]">scikit-learn IsolationForest</div>
            <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
              Monitors sliding-window request velocity, tool entropy, and sudden behavioral deviations.
            </p>
          </div>
        </div>

        {/* Brain 3: AI Reasoner */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-1.5 rounded bg-sky-950/60 border border-sky-800 text-sky-400 mt-0.5">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200">3. AI Reasoner</div>
            <div className="text-slate-500 text-[10px]">Google Gemini / Forensic NLP</div>
            <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
              Explains the contextual intent and semantic risk in plain English for human operators.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
