import React, { useState } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Bot, BrainCircuit } from 'lucide-react';

export default function LiveActivityFeed({ logs }) {
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.decision === filter;
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm overflow-hidden flex flex-col h-[520px]">
      
      {/* Header & Filter Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0c1222] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h2 className="font-bold text-sm text-white tracking-wide font-['JetBrains_Mono']">
            LIVE INTERCEPT AUDIT FEED
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {logs.length} events
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {['ALL', 'ALLOW', 'CHALLENGE', 'BLOCK'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filter === type
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-transparent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Log Stream Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <span>No intercepted events matching filter</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const isBlock = log.decision === 'BLOCK';
            const isChallenge = log.decision === 'CHALLENGE';

            const badgeBg = isBlock
              ? 'bg-red-950/80 border-red-700 text-red-400'
              : isChallenge
              ? 'bg-amber-950/80 border-amber-700 text-amber-400'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-400';

            const Icon = isBlock
              ? ShieldAlert
              : isChallenge
              ? AlertTriangle
              : CheckCircle2;

            return (
              <div
                key={log.id}
                className={`rounded-lg border transition-all ${
                  isBlock
                    ? 'border-red-900/60 bg-red-950/20 hover:border-red-800'
                    : isChallenge
                    ? 'border-amber-900/60 bg-amber-950/20 hover:border-amber-800'
                    : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                {/* Main Log Row */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isBlock ? 'text-red-400' : isChallenge ? 'text-amber-400' : 'text-emerald-400'
                    }`} />

                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span className="font-semibold text-slate-300 shrink-0">
                      {log.agentId}
                    </span>

                    <span className="text-slate-400">➔</span>

                    <span className="font-bold text-sky-300 truncate">
                      {log.action}
                    </span>

                    {log.resource && (
                      <span className="text-slate-400 truncate hidden md:inline">
                        [{log.resource}]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-bold text-slate-400">
                      Risk: <strong className={isBlock ? 'text-red-400' : isChallenge ? 'text-amber-400' : 'text-emerald-400'}>{log.riskScore}</strong>
                    </span>

                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badgeBg}`}>
                      {log.decision}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Forensic Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/80 bg-[#080d19]/90 text-slate-300 space-y-2">
                    
                    {/* AI Reasoner Note */}
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                      <BrainCircuit className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-0.5">
                          Guardian AI Forensic Reasoner
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          {log.reasoning?.summary || log.reasoning}
                        </p>
                      </div>
                    </div>

                    {/* Three Brain Telemetry Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-500 block text-[9px] uppercase">Policy Check</span>
                        <strong className={log.policyStatus === 'FORBIDDEN_ACTION' ? 'text-red-400' : 'text-emerald-400'}>
                          {log.policyStatus || 'ALLOWED'}
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-500 block text-[9px] uppercase">ML Behavior Anomaly</span>
                        <strong className={(log.anomalyScore || 0) > 0.5 ? 'text-red-400' : 'text-emerald-400'}>
                          Index: {((log.anomalyScore || 0) * 100).toFixed(0)}%
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-500 block text-[9px] uppercase">Target Resource</span>
                        <span className="text-slate-300 truncate block">
                          {log.resource || 'None specified'}
                        </span>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
