import React from 'react';
import { ShieldAlert, X, AlertTriangle, Lock, Bot, Activity, CheckCircle2 } from 'lucide-react';

export default function IncidentModal({ incident, onClose, onReleaseQuarantine }) {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-red-600 bg-[#0b0f19] p-6 shadow-2xl shadow-red-950/80 animate-incident-glow">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Header */}
        <div className="flex items-center gap-3 border-b border-red-900/60 pb-4">
          <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-widest uppercase">
                EMERGENCY INTERCEPT
              </span>
              <span className="text-red-400 font-mono text-xs">PS002 INCIDENT</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 font-['JetBrains_Mono']">
              MALICIOUS BEHAVIOR CONSTRAINED
            </h2>
          </div>
        </div>

        {/* Incident Summary Card */}
        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/20 p-4 font-mono text-xs space-y-3">
          
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-red-900/40">
            <div>
              <span className="text-slate-400 text-[11px] block">Attacking Agent:</span>
              <strong className="text-white text-sm font-bold">{incident.agentName || incident.agentId}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Threat Vector:</span>
              <strong className="text-red-400 text-sm font-bold">{incident.threat}</strong>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">ACTION</span>
              <span className="text-sky-300 font-bold text-xs truncate block">{incident.action}</span>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">POLICY</span>
              <span className="text-red-400 font-bold text-xs">❌ DENIED</span>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">RISK SCORE</span>
              <span className="text-red-400 font-bold text-sm">{incident.riskScore} / 100</span>
            </div>
          </div>

          {/* Target Resource */}
          <div className="flex items-center justify-between text-slate-300 px-1">
            <span className="text-slate-400">Target Asset:</span>
            <span className="font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
              {incident.resource || 'Critical Database Resource'}
            </span>
          </div>

          {/* AI Forensic Reasoning */}
          <div className="p-3 rounded-lg bg-[#070b14] border border-red-900/50 text-slate-200">
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>🛡️ Guardian AI Threat Rationale:</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {incident.reasoning}
            </p>
          </div>

          {/* Action Taken */}
          <div className="flex items-center justify-between pt-2 border-t border-red-900/40 text-xs">
            <span className="text-slate-400">Containment Action:</span>
            <span className="flex items-center gap-1 text-red-400 font-bold bg-red-950/80 px-2.5 py-1 rounded border border-red-700">
              <Lock className="w-3.5 h-3.5" /> BLOCKED & QUARANTINED
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onReleaseQuarantine(incident.agentId);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Lift Quarantine
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold font-mono bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition"
          >
            Acknowledge Incident
          </button>
        </div>

      </div>
    </div>
  );
}
