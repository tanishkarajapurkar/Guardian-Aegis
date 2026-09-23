import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import AgentCard from './components/AgentCard';
import LiveActivityFeed from './components/LiveActivityFeed';
import IncidentModal from './components/IncidentModal';
import SimulationControls from './components/SimulationControls';
import ThreeBrainsOverview from './components/ThreeBrainsOverview';

export default function App() {
  const [agents, setAgents] = useState([]);
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
            setAgents(payload.agents || []);
            setLogs(payload.logs || []);
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
        reconnectTimer = setTimeout(connectWebSocket, 2000);
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

  // Fetch initial REST data if WebSocket takes a moment
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
      const updated = await res.json();
      setAgents(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Failed to toggle quarantine:', err);
    }
  };

  // Run simulation scenarios
  const handleRunSimulation = async (type) => {
    try {
      await fetch(`/api/simulation/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error(`Failed to trigger simulation '${type}':`, err);
    }
  };

  // Reset simulation
  const handleReset = async () => {
    try {
      const res = await fetch('/api/simulation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
      setLogs([]);
      setActiveIncident(null);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
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
