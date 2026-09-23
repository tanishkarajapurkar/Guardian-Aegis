/**
 * Audit Logger & Real-time Event Broadcaster
 * Maintains tamper-evident in-memory log history and pushes live events via WebSocket.
 */

class AuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.wss = null;
  }

  setWebSocketServer(wss) {
    this.wss = wss;
  }

  broadcast(type, payload) {
    if (!this.wss) return;
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  logEvent({
    agentId,
    agentName,
    action,
    resource,
    decision,
    riskScore,
    severity,
    reasoning,
    policyStatus,
    anomalyScore,
    breakdown
  }) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      action,
      resource,
      decision, // ALLOW | CHALLENGE | BLOCK
      riskScore,
      severity, // LOW | MEDIUM | CRITICAL
      reasoning,
      policyStatus,
      anomalyScore,
      breakdown
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Broadcast action intercept event to dashboard
    this.broadcast('ACTION_INTERCEPTED', entry);

    // If critical or blocked, broadcast security incident alert
    if (decision === 'BLOCK' || severity === 'CRITICAL') {
      this.broadcast('SECURITY_INCIDENT', {
        incidentId: entry.id,
        agentId,
        agentName,
        threat: policyStatus === 'FORBIDDEN_ACTION' ? 'Unauthorized Destructive Tool' : 'High Behavioral Anomaly',
        action,
        resource,
        policy: policyStatus,
        riskScore,
        decision,
        reasoning: reasoning.summary || reasoning,
        timestamp: entry.timestamp
      });
    }

    return entry;
  }

  getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  clear() {
    this.logs = [];
    this.broadcast('LOGS_CLEARED', {});
  }
}

module.exports = new AuditLogger();
