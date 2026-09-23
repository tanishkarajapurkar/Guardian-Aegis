import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import AgentCard from './components/AgentCard';
import LiveActivityFeed from './components/LiveActivityFeed';
import IncidentModal from './components/IncidentModal';
import SimulationControls from './components/SimulationControls';
import ThreeBrainsOverview from './components/ThreeBrainsOverview';

const INITIAL_AGENTS = [
  {
    id: 'java-agent',
    name: 'Java Developer Agent',
    role: 'Java Development & Code Analysis',
    icon: 'Coffee',
    color: 'amber',
    status: 'NORMAL',
    riskScore: 8,
    actionsCount: 0,
    blockedCount: 0,
    violations: 0,
    lastAction: null,
    quarantinedAt: null,
    quarantineReason: null
  },
  {
    id: 'ml-agent',
    name: 'ML / Data Agent',
    role: 'Dataset Analytics & Model Training',
    icon: 'Brain',
    color: 'purple',
    status: 'NORMAL',
    riskScore: 5,
    actionsCount: 0,
    blockedCount: 0,
    violations: 0,
    lastAction: null,
    quarantinedAt: null,
    quarantineReason: null
  },
  {
    id: 'web-agent',
    name: 'Web / API Agent',
    role: 'Information Retrieval & API Integration',
    icon: 'Globe',
    color: 'cyan',
    status: 'NORMAL',
    riskScore: 10,
    actionsCount: 0,
    blockedCount: 0,
    violations: 0,
    lastAction: null,
    quarantinedAt: null,
    quarantineReason: null
  }
];

export default function App() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [logs, setLogs] = useState([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const wsRef = useRef(null);

  // Initialize and connect WebSocket
  useEffect(() => {
    let reconnectTimer;

    const connectWebSocket = () => {
      // Connect to backend WebSocket on port 4000
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:4000`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          if (type === 'INITIAL_STATE') {
            if (payload.agents && payload.agents.length > 0) setAgents(payload.agents);
            if (payload.logs) setLogs(payload.logs);
          } else if (type === 'AGENTS_UPDATED') {
            setAgents(payload);
          } else if (type === 'ACTION_INTERCEPTED') {
            setLogs(prev => [payload, ...prev.slice(0, 75)]);
          } else if (type === 'SECURITY_INCIDENT') {
            setActiveIncident(payload);
          } else if (type === 'LOGS_CLEARED') {
            setLogs([]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        // Only retry if running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Fetch initial REST data if backend is available
  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
        }
      })
      .catch(() => {});

    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLogs(data);
        }
      })
      .catch(() => {});
  }, []);

  // Manual Quarantine toggle
  const handleToggleQuarantine = async (agentId, isQuarantined) => {
    const endpoint = isQuarantined
      ? `/api/agents/${agentId}/release`
      : `/api/agents/${agentId}/quarantine`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual operator action from dashboard' })
      });
      if (res.ok) {
        const updated = await res.json();
        setAgents(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        return;
      }
    } catch (err) {
      // Local fallback
    }

    // Client-side fallback state update
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status: isQuarantined ? 'NORMAL' : 'QUARANTINED',
          riskScore: isQuarantined ? 10 : 95,
          quarantinedAt: isQuarantined ? null : new Date().toISOString(),
          quarantineReason: isQuarantined ? null : 'Manual operator quarantine'
        };
      }
      return a;
    }));
  };

  // Helper for simulated logging
  const recordLocalLog = (item, decision, riskScore, reason, policyStatus, anomalyScore) => {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      agentId: item.agentId,
      agentName: INITIAL_AGENTS.find(a => a.id === item.agentId)?.name || item.agentId,
      action: item.action,
      resource: item.resource,
      decision,
      riskScore,
      severity: riskScore > 65 ? 'CRITICAL' : riskScore > 30 ? 'MEDIUM' : 'LOW',
      reasoning: { summary: reason },
      policyStatus,
      anomalyScore
    };

    setLogs(prev => [entry, ...prev.slice(0, 75)]);

    setAgents(prev => prev.map(a => {
      if (a.id === item.agentId) {
        const isBlock = decision === 'BLOCK';
        const isChallenge = decision === 'CHALLENGE';
        return {
          ...a,
          actionsCount: a.actionsCount + 1,
          blockedCount: isBlock ? a.blockedCount + 1 : a.blockedCount,
          riskScore,
          status: isBlock ? 'QUARANTINED' : isChallenge ? 'CHALLENGED' : a.status === 'QUARANTINED' ? 'QUARANTINED' : 'NORMAL',
          quarantinedAt: isBlock ? new Date().toISOString() : a.quarantinedAt,
          quarantineReason: isBlock ? reason : a.quarantineReason,
          lastAction: {
            action: item.action,
            resource: item.resource,
            decision,
            riskScore,
            timestamp: new Date().toISOString()
          }
        };
      }
      return a;
    }));

    return entry;
  };

  // Run simulation scenarios
  const handleRunSimulation = async (type) => {
    if (isWsConnected) {
      try {
        const res = await fetch(`/api/simulation/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) return;
      } catch (err) {
        // Fall back to client simulation
      }
    }

    // Client-side Autonomous Simulation Engine (Works 100% on Vercel Standalone)
    if (type === 'normal') {
      const actions = [
        { agentId: 'java-agent', action: 'READ_JAVA_FILE', resource: 'OrderService.java', risk: 8, reason: 'Verified safe execution: reading repository source code.' },
        { agentId: 'ml-agent', action: 'READ_DATASET', resource: 'customers_2026.csv', risk: 5, reason: 'Verified safe execution: loading authorized training dataset.' },
        { agentId: 'web-agent', action: 'HTTP_GET', resource: 'https://api.github.com/repos', risk: 10, reason: 'Verified safe execution: querying public API.' },
        { agentId: 'java-agent', action: 'COMPILE_JAVA', resource: 'OrderService.java', risk: 12, reason: 'Verified safe execution: compilation within declared bounds.' }
      ];

      for (let i = 0; i < actions.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 100 : 500));
        const act = actions[i];
        recordLocalLog(act, 'ALLOW', act.risk, act.reason, 'ALLOWED', 0.05);
      }
    } else if (type === 'challenge') {
      await new Promise(r => setTimeout(r, 200));
      recordLocalLog(
        { agentId: 'ml-agent', action: 'ACCESS_NEW_DATASET', resource: 'restricted_financial_q3.parquet' },
        'CHALLENGE',
        52,
        'SENSITIVE RESOURCE ACCESS: ML Agent requested access to an unlisted financial asset. Paused for human-in-the-loop authorization.',
        'SENSITIVE_ACTION',
        0.42
      );
    } else if (type === 'attack') {
      const attackSequence = [
        { agentId: 'java-agent', action: 'READ_JAVA_FILE', resource: 'DatabaseConfig.java', decision: 'ALLOW', risk: 10, delay: 200, policy: 'ALLOWED', anomaly: 0.05, reason: 'Reading application configuration file.' },
        { agentId: 'java-agent', action: 'COMPILE_JAVA', resource: 'DatabaseConfig.java', decision: 'ALLOW', risk: 12, delay: 600, policy: 'ALLOWED', anomaly: 0.08, reason: 'Compiling Java classes.' },
        { agentId: 'java-agent', action: 'RUN_JAVA', resource: 'DatabaseConfig.class', decision: 'ALLOW', risk: 15, delay: 600, policy: 'ALLOWED', anomaly: 0.12, reason: 'Executing Java bytecode.' },
        { agentId: 'java-agent', action: 'HTTP_REQUEST', resource: 'http://198.51.100.23:8080/beacon', decision: 'CHALLENGE', risk: 52, delay: 800, policy: 'SENSITIVE_ACTION', anomaly: 0.65, reason: 'ANOMALY DETECTED: Java Developer role initiated outbound raw HTTP socket to unknown IP.' },
        { agentId: 'java-agent', action: 'ACCESS_ENV', resource: 'DB_ROOT_PASSWORD', decision: 'CHALLENGE', risk: 65, delay: 800, policy: 'SENSITIVE_ACTION', anomaly: 0.78, reason: 'PRIVILEGE ESCALATION: Agent attempted access to environment secrets.' },
        { agentId: 'java-agent', action: 'DELETE_DATABASE', resource: 'campusDB', decision: 'BLOCK', risk: 96, delay: 900, policy: 'FORBIDDEN_ACTION', anomaly: 0.95, reason: 'CRITICAL PRIVILEGE BREACH: Java Agent attempted destructive DELETE_DATABASE on campusDB. Dropped and quarantined.' }
      ];

      for (const step of attackSequence) {
        await new Promise(r => setTimeout(r, step.delay));
        const entry = recordLocalLog(step, step.decision, step.risk, step.reason, step.policy, step.anomaly);
        
        if (step.decision === 'BLOCK') {
          setActiveIncident({
            incidentId: entry.id,
            agentId: step.agentId,
            agentName: 'Java Developer Agent',
            threat: 'Unauthorized Destructive Tool',
            action: step.action,
            resource: step.resource,
            policy: step.policy,
            riskScore: step.risk,
            decision: step.decision,
            reasoning: step.reason,
            timestamp: entry.timestamp
          });
        }
      }
    }
  };

  // Reset simulation
  const handleReset = async () => {
    if (isWsConnected) {
      try {
        await fetch('/api/simulation/reset', { method: 'POST' });
      } catch (err) {}
    }
    setAgents(INITIAL_AGENTS);
    setLogs([]);
    setActiveIncident(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation & Status */}
      <Header isWsConnected={isWsConnected} agents={agents} logs={logs} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Simulation Control Deck */}
        <SimulationControls
          onRunSimulation={handleRunSimulation}
          onReset={handleReset}
        />

        {/* The Three Brains Security Architecture Summary */}
        <ThreeBrainsOverview />

        {/* Monitored Worker Agents Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Monitored Autonomous Agents (Subjects)
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              Zero-Trust Interception Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggleQuarantine={handleToggleQuarantine}
              />
            ))}
          </div>
        </div>

        {/* Live Forensic Activity & Intercept Feed */}
        <LiveActivityFeed logs={logs} />

      </main>

      {/* Emergency Incident Pop-up Banner/Modal */}
      <IncidentModal
        incident={activeIncident}
        onClose={() => setActiveIncident(null)}
        onReleaseQuarantine={(agentId) => handleToggleQuarantine(agentId, true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080d19] py-4 text-center text-xs text-slate-500 font-mono">
        Guardian Aegis (PS002) • Autonomous Multi-Agent Integrity Monitor & Zero-Trust Firewall
      </footer>
    </div>
  );
}
