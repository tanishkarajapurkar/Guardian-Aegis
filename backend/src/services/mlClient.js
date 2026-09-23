/**
 * ML Anomaly Detection Client
 * Extracts rolling behavior features from an agent's recent history
 * and evaluates anomaly score against the Python scikit-learn IsolationForest microservice.
 * Includes resilient local fallback if Python service is offline.
 */

class MLClient {
  constructor() {
    this.history = new Map(); // agentId -> Array of { timestamp, action, allowed, isSensitive }
    this.windowSize = 20;
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  recordAction(agentId, action, isAllowed, isSensitive) {
    if (!this.history.has(agentId)) {
      this.history.set(agentId, []);
    }
    const list = this.history.get(agentId);
    list.push({
      timestamp: Date.now(),
      action,
      isAllowed,
      isSensitive
    });
    if (list.length > this.windowSize) {
      list.shift();
    }
  }

  extractFeatures(agentId) {
    const list = this.history.get(agentId) || [];
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recent = list.filter(item => item.timestamp >= oneMinuteAgo);

    const requestsPerMin = recent.length;
    const unauthorizedCount = recent.filter(item => !item.isAllowed).length;
    const sensitiveCount = recent.filter(item => item.isSensitive).length;

    const unauthorizedRatio = recent.length > 0 ? unauthorizedCount / recent.length : 0;
    const sensitiveRatio = recent.length > 0 ? sensitiveCount / recent.length : 0;

    const uniqueActions = new Set(recent.map(item => item.action)).size;
    const toolEntropy = recent.length > 0 ? uniqueActions / recent.length : 0;

    return {
      requests_per_min: requestsPerMin,
      unauthorized_ratio: unauthorizedRatio,
      sensitive_ratio: sensitiveRatio,
      tool_entropy: toolEntropy,
      recent_count: recent.length
    };
  }

  async predictAnomaly(agentId, currentAction, isAllowed, isSensitive) {
    // Record current attempt
    this.recordAction(agentId, currentAction, isAllowed, isSensitive);
    const features = this.extractFeatures(agentId);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${this.mlServiceUrl}/predict-anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          ...features
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          isAnomaly: data.is_anomaly,
          score: data.anomaly_score,
          details: data.details || 'Evaluated by Python IsolationForest',
          features
        };
      }
    } catch (err) {
      // Python service offline or timed out -> use statistical local baseline
    }

    // High-fidelity statistical fallback model
    const score = this.calculateLocalAnomalyScore(features);
    return {
      isAnomaly: score >= 0.55,
      score: parseFloat(score.toFixed(2)),
      details: 'Evaluated by Statistical Baseline (Local Engine)',
      features
    };
  }

  calculateLocalAnomalyScore(f) {
    // Weightings:
    // Unauthorized spikes: high weight
    // Velocity > 8 req/min: suspicious burst
    // High tool entropy + unauthorized actions: classic reconnaissance pattern
    let score = 0.05;

    if (f.requests_per_min > 5) {
      score += Math.min(0.3, (f.requests_per_min - 5) * 0.05);
    }

    if (f.unauthorized_ratio > 0) {
      score += f.unauthorized_ratio * 0.45;
    }

    if (f.sensitive_ratio > 0.3) {
      score += f.sensitive_ratio * 0.25;
    }

    if (f.tool_entropy > 0.7 && f.recent_count > 3) {
      score += 0.2;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  resetAgentHistory(agentId) {
    this.history.delete(agentId);
  }
}

module.exports = new MLClient();
