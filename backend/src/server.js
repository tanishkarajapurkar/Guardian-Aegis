require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const agentService = require('./services/agentService');
const policyEngine = require('./engines/policyEngine');
const riskEngine = require('./engines/riskEngine');
const reasonerEngine = require('./engines/reasonerEngine');
const mlClient = require('./services/mlClient');
const auditLogger = require('./services/auditLogger');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

auditLogger.setWebSocketServer(wss);

app.use(cors());
app.use(express.json());

// Handle WebSocket connections
wss.on('connection', ws => {
  // Send initial state on connection
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    payload: {
      agents: agentService.getAll(),
      logs: auditLogger.getLogs(25),
      thresholds: { allowMax: 30, challengeMax: 65, criticalMin: 66 }
    }
  }));
});

// Helper: Broadcast agent updates
function broadcastAgentUpdates() {
  auditLogger.broadcast('AGENTS_UPDATED', agentService.getAll());
}

// ----------------------------------------------------
// Core Gateway Interceptor Endpoint
// ----------------------------------------------------
app.post('/api/gateway/dispatch', async (req, res) => {
  const { agentId, action, resource, parameters } = req.body;

  if (!agentId || !action) {
    return res.status(400).json({ error: 'agentId and action are required' });
  }

  const agent = agentService.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: `Agent '${agentId}' not found in registry` });
  }

  // 1. Policy Engine evaluation (RBAC)
  const policyResult = policyEngine.evaluate(agent, action, resource);

  // 2. Behavior Monitor evaluation (ML Anomaly Detection)
  const anomalyResult = await mlClient.predictAnomaly(
    agentId,
    action,
    policyResult.allowed,
    policyResult.isSensitive
  );

  // 3. Composite Risk Calculation
  const riskAssessment = riskEngine.calculate({
    agent,
    policyResult,
    anomalyResult,
    resource,
    action
  });

  // 4. AI Reasoner Explanation
  const reasoning = await reasonerEngine.explain({
    agent,
    action,
    resource,
    policyResult,
    anomalyResult,
    riskScore: riskAssessment.riskScore
  });

  // 5. Enforce and record in state
  const updatedAgent = agentService.recordEvaluation(agentId, {
    action,
    resource,
    decision: riskAssessment.decision,
    riskScore: riskAssessment.riskScore,
    reason: reasoning.summary
  });

  // 6. Log and broadcast
  const auditEntry = auditLogger.logEvent({
    agentId,
    agentName: agent.name,
    action,
    resource,
    decision: riskAssessment.decision,
    riskScore: riskAssessment.riskScore,
    severity: riskAssessment.severity,
    reasoning,
    policyStatus: policyResult.status,
    anomalyScore: anomalyResult.score,
    breakdown: riskAssessment.breakdown
  });

  broadcastAgentUpdates();

  const isAllowed = riskAssessment.decision === 'ALLOW';
  const statusCode = riskAssessment.decision === 'BLOCK' ? 403 : 200;

  return res.status(statusCode).json({
    allowed: isAllowed,
    decision: riskAssessment.decision,
    riskScore: riskAssessment.riskScore,
    severity: riskAssessment.severity,
    reasoning: reasoning.summary,
    reasonerMode: reasoning.mode,
    policyResult,
    anomalyResult,
    agent: updatedAgent,
    auditId: auditEntry.id
  });
});

// ----------------------------------------------------
// Agent Management Endpoints
// ----------------------------------------------------
app.get('/api/agents', (req, res) => {
  res.json(agentService.getAll());
});

app.post('/api/agents/:id/quarantine', (req, res) => {
  const agent = agentService.quarantine(req.params.id, req.body.reason || 'Manual Operator Quarantine');
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  broadcastAgentUpdates();
  auditLogger.broadcast('MANUAL_QUARANTINE', { agentId: agent.id, reason: agent.quarantineReason });
  res.json(agent);
});

app.post('/api/agents/:id/release', (req, res) => {
  const agent = agentService.release(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  mlClient.resetAgentHistory(agent.id);
  broadcastAgentUpdates();
  res.json(agent);
});

// ----------------------------------------------------
// Audit & Logs Endpoints
// ----------------------------------------------------
app.get('/api/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(auditLogger.getLogs(limit));
});

// ----------------------------------------------------
// Simulation & Demo Scenarios
// ----------------------------------------------------
app.post('/api/simulation/reset', (req, res) => {
  const agents = agentService.reset();
  auditLogger.clear();
  for (const a of agents) {
    mlClient.resetAgentHistory(a.id);
  }
  broadcastAgentUpdates();
  res.json({ message: 'Simulation environment reset to clean baseline', agents });
});

app.post('/api/simulation/normal', async (req, res) => {
  const actions = [
    { agentId: 'java-agent', action: 'READ_JAVA_FILE', resource: 'OrderService.java' },
    { agentId: 'ml-agent', action: 'READ_DATASET', resource: 'customers_2026.csv' },
    { agentId: 'web-agent', action: 'HTTP_GET', resource: 'https://api.github.com/repos' },
    { agentId: 'java-agent', action: 'COMPILE_JAVA', resource: 'OrderService.java' },
    { agentId: 'ml-agent', action: 'TRAIN_MODEL', resource: 'churn_classifier.pkl' }
  ];

  for (const item of actions) {
    await simulateDispatch(item);
    await sleep(400);
  }

  res.json({ message: 'Normal workload simulation completed successfully' });
});

app.post('/api/simulation/challenge', async (req, res) => {
  // ML Agent requests an unlisted sensitive dataset -> triggers challenge
  await simulateDispatch({
    agentId: 'ml-agent',
    action: 'ACCESS_NEW_DATASET',
    resource: 'restricted_financial_q3.parquet'
  });

  res.json({ message: 'Challenge scenario dispatched to Guardian' });
});

app.post('/api/simulation/attack', async (req, res) => {
  // Asynchronous attack progression with real-time delays
  res.json({ message: 'Compromised Java Agent attack sequence initiated' });

  const attackSequence = [
    { agentId: 'java-agent', action: 'READ_JAVA_FILE', resource: 'DatabaseConfig.java', delay: 200 },
    { agentId: 'java-agent', action: 'COMPILE_JAVA', resource: 'DatabaseConfig.java', delay: 700 },
    { agentId: 'java-agent', action: 'RUN_JAVA', resource: 'DatabaseConfig.class', delay: 700 },
    { agentId: 'java-agent', action: 'HTTP_REQUEST', resource: 'http://198.51.100.23:8080/beacon', delay: 800 },
    { agentId: 'java-agent', action: 'ACCESS_ENV', resource: 'DB_ROOT_PASSWORD', delay: 800 },
    { agentId: 'java-agent', action: 'DELETE_DATABASE', resource: 'campusDB', delay: 900 }
  ];

  for (const step of attackSequence) {
    await sleep(step.delay);
    await simulateDispatch(step);
  }
});

async function simulateDispatch(item) {
  const agent = agentService.get(item.agentId);
  if (!agent) return;

  const policyResult = policyEngine.evaluate(agent, item.action, item.resource);
  const anomalyResult = await mlClient.predictAnomaly(
    item.agentId,
    item.action,
    policyResult.allowed,
    policyResult.isSensitive
  );
  const riskAssessment = riskEngine.calculate({
    agent,
    policyResult,
    anomalyResult,
    resource: item.resource,
    action: item.action
  });
  const reasoning = await reasonerEngine.explain({
    agent,
    action: item.action,
    resource: item.resource,
    policyResult,
    anomalyResult,
    riskScore: riskAssessment.riskScore
  });

  agentService.recordEvaluation(item.agentId, {
    action: item.action,
    resource: item.resource,
    decision: riskAssessment.decision,
    riskScore: riskAssessment.riskScore,
    reason: reasoning.summary
  });

  auditLogger.logEvent({
    agentId: item.agentId,
    agentName: agent.name,
    action: item.action,
    resource: item.resource,
    decision: riskAssessment.decision,
    riskScore: riskAssessment.riskScore,
    severity: riskAssessment.severity,
    reasoning,
    policyStatus: policyResult.status,
    anomalyScore: anomalyResult.score,
    breakdown: riskAssessment.breakdown
  });

  broadcastAgentUpdates();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  GUARDIAN AEGIS SECURITY GATEWAY ONLINE ON PORT ${PORT}`);
  console.log(`    WebSocket: ws://localhost:${PORT}`);
  console.log(`    API Dispatch: http://localhost:${PORT}/api/gateway/dispatch`);
  console.log(`=======================================================`);
});
