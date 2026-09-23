/**
 * AI Reasoner Engine
 * Evaluates semantic intent and explains why an agent action is anomalous or suspicious.
 * Supports dual-mode:
 * 1. Google Gemini API (if GEMINI_API_KEY is configured)
 * 2. High-precision offline local semantic reasoner (100% free, offline, instant)
 */

class ReasonerEngine {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
  }

  async explain({ agent, action, resource, policyResult, anomalyResult, riskScore }) {
    if (this.apiKey) {
      try {
        const geminiExplanation = await this.callGemini({
          agent,
          action,
          resource,
          policyResult,
          anomalyResult,
          riskScore
        });
        if (geminiExplanation) {
          return {
            mode: 'GEMINI_AI',
            summary: geminiExplanation
          };
        }
      } catch (err) {
        console.warn('[ReasonerEngine] Gemini call failed, falling back to local reasoner:', err.message);
      }
    }

    return {
      mode: 'LOCAL_REASONER',
      summary: this.generateLocalExplanation({ agent, action, resource, policyResult, anomalyResult, riskScore })
    };
  }

  async callGemini({ agent, action, resource, policyResult, anomalyResult, riskScore }) {
    const prompt = `You are the Guardian Agent AI Security Reasoner (PS002 Integrity Monitor).
Analyze this intercepted action:
- Agent ID: ${agent.id} (${agent.name})
- Declared Role: ${agent.role}
- Requested Action: ${action}
- Target Resource: ${resource || 'N/A'}
- Policy Check: ${policyResult.status} (Penalty: ${policyResult.penalty})
- Behavior Anomaly: ${anomalyResult.isAnomaly ? 'DETECTED' : 'NORMAL'} (Score: ${anomalyResult.score})
- Composite Risk Score: ${riskScore} / 100

In 2 concise, professional sentences, explain the security risk, semantic intent mismatch (if any), and why Guardian is taking this action. Do not use bullet points.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.2 }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  }

  generateLocalExplanation({ agent, action, resource, policyResult, anomalyResult, riskScore }) {
    if (agent.status === 'QUARANTINED') {
      return `Agent '${agent.name}' is contained in QUARANTINE due to previous critical violations. Request for '${action}' was dropped immediately at the boundary.`;
    }

    if (policyResult.status === 'FORBIDDEN_ACTION') {
      return `CRITICAL PRIVILEGE BREACH: Agent '${agent.name}' (${agent.role}) attempted to execute '${action}' targeting '${resource || 'system'}'. This destructive capability is strictly excluded from its operational perimeter, presenting an immediate privilege escalation threat.`;
    }

    if (anomalyResult.isAnomaly && policyResult.status === 'SENSITIVE_ACTION') {
      return `BEHAVIORAL VELOCITY SPIKE: Agent '${agent.name}' initiated privileged action '${action}' alongside rapid behavioral shifts (anomaly index: ${(anomalyResult.score * 100).toFixed(0)}%). Execution is paused for human-in-the-loop challenge verification.`;
    }

    if (anomalyResult.isAnomaly) {
      return `ANOMALY DETECTED: The frequency or sequence pattern of action '${action}' deviates significantly from baseline operational patterns observed for '${agent.name}'.`;
    }

    if (policyResult.isSensitive) {
      return `SENSITIVE RESOURCE ACCESS: Action '${action}' on '${resource || 'external endpoint'}' accesses high-value assets. Request requires challenge confirmation to prevent data leakage.`;
    }

    if (riskScore <= 30) {
      return `Verified safe execution: '${action}' aligns with declared capabilities for ${agent.name} with normal operational telemetry.`;
    }

    return `Guardian intercepted '${action}' by ${agent.name}; elevated risk parameters (${riskScore}/100) detected across runtime evaluation matrices.`;
  }
}

module.exports = new ReasonerEngine();
