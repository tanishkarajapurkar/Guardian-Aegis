import React from 'react';
import { Shield, Radio, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Header({ isWsConnected, agents, logs }) {
  const quarantinedCount = agents.filter(a => a.status === 'QUARANTINED').length;
  const blockedCount = agents.reduce((acc, a) => acc + (a.blockedCount || 0), 0);
  const totalActions = agents.reduce((acc, a) => acc + (a.actionsCount || 0), 0);

  return (
    <header className="border-b border-slate-800 bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {quarantinedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-['JetBrains_Mono']">
                GUARDIAN <span className="text-sky-400">AEGIS</span>
              </h1>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/60 font-semibold tracking-wider">
                PS002 Integrity Monitor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Multi-Agent Runtime Firewall & Zero-Trust Gatekeeper
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* WebSocket Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={isWsConnected ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
              {isWsConnected ? 'GATEWAY LIVE' : 'CONNECTING...'}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Intercepts:</span>
              <span className="font-bold text-white font-mono">{totalActions}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Blocks:</span>
              <span className="font-bold text-amber-400 font-mono">{blockedCount}</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono transition-colors ${
              quarantinedCount > 0 
                ? 'bg-red-950/50 border-red-800/80 text-red-300' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}>
              <ShieldAlert className={`w-3.5 h-3.5 ${quarantinedCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-500'}`} />
              <span>Quarantined:</span>
              <span className={`font-bold ${quarantinedCount > 0 ? 'text-red-400' : 'text-white'}`}>
                {quarantinedCount}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
