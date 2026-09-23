const policies = require('../config/policies.json');

class PolicyEngine {
  constructor() {
    this.policies = policies.agents;
  }

  getPolicy(agentId) {
    return this.policies[agentId] || null;
  }

  evaluate(agent, action, resource) {
    const policy = this.getPolicy(agent.id);
    if (!policy) {
      return {
        allowed: false,
        status: 'UNKNOWN_AGENT',
        penalty: 80,
        reason: `Agent '${agent.id}' is not registered in the Guardian security policy directory.`
      };
    }

    if (agent.status === 'QUARANTINED') {
      return {
        allowed: false,
        status: 'QUARANTINED',
        penalty: 100,
        reason: `Agent '${agent.id}' is locked in QUARANTINE containment. All action requests are prohibited.`
      };
    }

    const actionUpper = (action || '').toUpperCase();

    // Check if explicitly forbidden
    if (policy.forbidden && policy.forbidden.includes(actionUpper)) {
      return {
        allowed: false,
        status: 'FORBIDDEN_ACTION',
        penalty: 60,
        reason: `Action '${actionUpper}' is explicitly forbidden for role '${policy.role}'.`
      };
    }

    // Check if sensitive
    if (policy.sensitive && policy.sensitive.includes(actionUpper)) {
      return {
        allowed: true,
        isSensitive: true,
        status: 'SENSITIVE_ACTION',
        penalty: 30,
        reason: `Action '${actionUpper}' accesses privileged resources and requires challenge verification.`
      };
    }

    // Check if explicitly allowed
    if (policy.allowed && policy.allowed.includes(actionUpper)) {
      return {
        allowed: true,
        status: 'ALLOWED',
        penalty: 0,
        reason: `Action '${actionUpper}' is within declared operational bounds for '${policy.name}'.`
      };
    }

    // Unknown or unlisted tool
    return {
      allowed: false,
      status: 'UNDEFINED_TOOL',
      penalty: 45,
      reason: `Action '${actionUpper}' is not in the declared capability set of '${policy.name}'.`
    };
  }
}

module.exports = new PolicyEngine();
