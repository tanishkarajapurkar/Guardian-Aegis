/**
 * Risk Engine
 * Aggregates Policy Penalties + ML Anomaly Scores + Resource Sensitivity + Repeat Offense Multipliers
 * to calculate a calibrated 0-100 Risk Score and Security Decision.
 */

const HIGH_VALUE_RESOURCES = [
  'campusdb',
  'database',
  'passwords',
  'credentials',
  'payment',
  'master_key',
  'auth_tokens',
  'prod_users'
];

class RiskEngine {
  calculate({ agent, policyResult, anomalyResult, resource, action }) {
    let rawScore = 0;

    // 1. Policy Violation Penalty (0 - 60)
    rawScore += policyResult.penalty || 0;

    // 2. Behavioral Anomaly Contribution (0 - 35)
    const anomalyScore = anomalyResult.score || 0;
    rawScore += Math.round(anomalyScore * 35);

    // 3. Sensitive Target Resource Bonus (0 - 25)
    const resourceLower = (resource || '').toLowerCase();
    const isHighValue = HIGH_VALUE_RESOURCES.some(term => resourceLower.includes(term));
    if (isHighValue) {
      rawScore += 25;
    }

    // 4. Repeat Offender Penalty
    const previousViolations = agent.violations || 0;
    rawScore += Math.min(20, previousViolations * 10);

    // Bound between 0 and 100
    const finalRisk = Math.min(100, Math.max(0, rawScore));

    // Determine security enforcement decision
    let decision = 'ALLOW';
    let severity = 'LOW';

    if (policyResult.status === 'QUARANTINED') {
      decision = 'BLOCK';
      severity = 'CRITICAL';
    } else if (finalRisk > 65 || policyResult.status === 'FORBIDDEN_ACTION') {
      decision = 'BLOCK';
      severity = 'CRITICAL';
    } else if (finalRisk > 30 || policyResult.status === 'SENSITIVE_ACTION') {
      decision = 'CHALLENGE';
      severity = 'MEDIUM';
    } else {
      decision = 'ALLOW';
      severity = 'LOW';
    }

    return {
      riskScore: finalRisk,
      decision,
      severity,
      breakdown: {
        policyPenalty: policyResult.penalty || 0,
        anomalyContribution: Math.round(anomalyScore * 35),
        resourceSensitivityBonus: isHighValue ? 25 : 0,
        repeatOffensePenalty: Math.min(20, previousViolations * 10)
      }
    };
  }
}

module.exports = new RiskEngine();
