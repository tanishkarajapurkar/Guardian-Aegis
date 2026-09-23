import React from 'react';
import { Coffee, Brain, Globe, Shield, ShieldAlert, ShieldCheck, Lock, Unlock, AlertCircle } from 'lucide-react';

const iconMap = {
  Coffee: Coffee,
  Brain: Brain,
  Globe: Globe
};

export default function AgentCard({ agent, onToggleQuarantine }) {
  const IconComponent = iconMap[agent.icon] || Shield;
  const isQuarantined = agent.status === 'QUARANTINED';
  const isChallenged = agent.status === 'CHALLENGED';

  // Dynamic theme colors
  const statusBorder = isQuarantined
    ? 'border-red-500/80 shadow-red-500/20 shadow-lg'
    : isChallenged
    ? 'border-amber-500/60 shadow-amber-500/10 shadow-md'
    : 'border-slate-800 hover:border-slate-700';

  const riskColor = agent.riskScore > 65
    ? 'text-red-400 bg-red-950/60 border-red-800'
    : agent.riskScore > 30
    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
    : 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

  const riskBarWidth = `${Math.min(100, Math.max(5, agent.riskScore))}%`;
  const riskBarBg = agent.riskScore > 65
    ? 'bg-gradient-to-r from-amber-500 to-red-500'
    : agent.riskScore > 30
    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
    : 'bg-gradient-to-r from-emerald-600 to-emerald-400';

  return (
    <div className={`relative rounded-xl border bg-slate-900/90 backdrop-blur-sm p-5 transition-all duration-300 flex flex-col justify-between ${statusBorder}`}>
      
      {/* Quarantined Banner Overlay if isolated */}
      {isQuarantined && (
        <div className="absolute -top-3 left-4 right-4 bg-red-600 text-white text-[10px] font-bold font-mono tracking-widest uppercase py-0.5 rounded text-center shadow-md flex items-center justify-center gap-1.5 animate-pulse">
          <ShieldAlert className="w-3 h-3" />
          <span>ISOLATED UNDER GUARDIAN CONTAINMENT</span>
        </div>
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              isQuarantined 
                ? 'bg-red-950/60 border-red-700 text-red-400' 
                : 'bg-slate-800/80 border-slate-700 text-sky-400'
            }`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">{agent.name}</h3>
              <p className="text-xs text-slate-400">{agent.role}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center">
            {isQuarantined ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-1 rounded-md bg-red-950/80 text-red-400 border border-red-700">
                <Lock className="w-3 h-3" /> QUARANTINED
              </span>
            ) : isChallenged ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-700">
                <AlertCircle className="w-3 h-3" /> CHALLENGED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-700">
                <ShieldCheck className="w-3 h-3" /> ACTIVE / NORMAL
              </span>
            )}
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Runtime Risk Level:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${riskColor}`}>
              {agent.riskScore} / 100
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${riskBarBg}`}
              style={{ width: riskBarWidth }}
            />
          </div>
        </div>

        {/* Last Intercepted Action */}
        <div className="mt-4 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Last Intercepted Action</span>
            {agent.lastAction && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                agent.lastAction.decision === 'ALLOW' ? 'text-emerald-400 bg-emerald-950' :
                agent.lastAction.decision === 'CHALLENGE' ? 'text-amber-400 bg-amber-950' :
                'text-red-400 bg-red-950'
              }`}>
                {agent.lastAction.decision}
              </span>
            )}
          </div>
          {agent.lastAction ? (
            <div className="truncate">
              <span className="text-sky-300 font-semibold">{agent.lastAction.action}</span>
              <span className="text-slate-400"> ➔ {agent.lastAction.resource || 'system'}</span>
            </div>
          ) : (
            <div className="text-slate-500 italic">No actions intercepted yet</div>
          )}
        </div>
      </div>

      {/* Bottom Controls & Stats */}
      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span>Processed: <strong className="text-slate-200 font-mono">{agent.actionsCount}</strong></span>
          <span>Blocked: <strong className="text-red-400 font-mono">{agent.blockedCount}</strong></span>
        </div>

        <button
          onClick={() => onToggleQuarantine(agent.id, isQuarantined)}
          className={`px-2.5 py-1 rounded text-xs font-medium font-mono flex items-center gap-1 transition-all ${
            isQuarantined
              ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
              : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-800'
          }`}
        >
          {isQuarantined ? (
            <>
              <Unlock className="w-3 h-3" /> Release
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" /> Quarantine
            </>
          )}
        </button>
      </div>

    </div>
  );
}
