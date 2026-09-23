const policies = require('../config/policies.json');

class AgentService {
  constructor() {
    this.agents = new Map();
    this.init();
  }

  init() {
    this.agents.clear();
    for (const [id, config] of Object.entries(policies.agents)) {
      this.agents.set(id, {
        id: config.id,
        name: config.name,
        role: config.role,
        icon: config.icon,
        color: config.color,
        status: 'NORMAL', // NORMAL | CHALLENGED | QUARANTINED
        riskScore: 5,
        actionsCount: 0,
        blockedCount: 0,
        violations: 0,
        lastAction: null,
        quarantinedAt: null,
        quarantineReason: null
      });
    }
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  get(agentId) {
    return this.agents.get(agentId) || null;
  }

  quarantine(agentId, reason) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    agent.status = 'QUARANTINED';
    agent.riskScore = Math.max(agent.riskScore, 95);
    agent.quarantinedAt = new Date().toISOString();
    agent.quarantineReason = reason || 'Security Policy Breach / High Anomaly Score';
    return agent;
  }

  release(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    agent.status = 'NORMAL';
    agent.riskScore = 10;
    agent.quarantinedAt = null;
    agent.quarantineReason = null;
    return agent;
  }

  recordEvaluation(agentId, { action, resource, decision, riskScore, reason }) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    agent.actionsCount += 1;
    agent.riskScore = riskScore;
    agent.lastAction = {
      action,
      resource,
      decision,
      riskScore,
      timestamp: new Date().toISOString()
    };

    if (decision === 'BLOCK') {
      agent.blockedCount += 1;
      agent.violations += 1;
      if (agent.status !== 'QUARANTINED') {
        this.quarantine(agentId, reason);
      }
    } else if (decision === 'CHALLENGE') {
      if (agent.status !== 'QUARANTINED') {
        agent.status = 'CHALLENGED';
      }
    } else {
      if (agent.status === 'CHALLENGED') {
        agent.status = 'NORMAL';
      }
    }

    return agent;
  }

  reset() {
    this.init();
    return this.getAll();
  }
}

module.exports = new AgentService();
