/**
 * Verification Test Script for Guardian Aegis
 * Dispatches test actions from Java, ML, and Web agents,
 * followed by a simulated rogue attack to verify policy, anomaly scoring, and quarantine.
 */

async function runTests() {
  const BASE_URL = 'http://localhost:4000/api/gateway/dispatch';
  console.log('--- STARTING GUARDIAN AEGIS VERIFICATION TESTS ---\n');

  const testCases = [
    {
      name: 'Safe Action: Java Agent Compiles Code',
      payload: { agentId: 'java-agent', action: 'COMPILE_JAVA', resource: 'Calculator.java' },
      expectedDecision: 'ALLOW'
    },
    {
      name: 'Safe Action: ML Agent Trains Model',
      payload: { agentId: 'ml-agent', action: 'TRAIN_MODEL', resource: 'housing_data.parquet' },
      expectedDecision: 'ALLOW'
    },
    {
      name: 'Safe Action: Web Agent Queries API',
      payload: { agentId: 'web-agent', action: 'HTTP_GET', resource: 'https://api.github.com' },
      expectedDecision: 'ALLOW'
    },
    {
      name: 'Ambiguous Action: ML Agent Accesses Unlisted Dataset',
      payload: { agentId: 'ml-agent', action: 'ACCESS_NEW_DATASET', resource: 'payroll_confidential.csv' },
      expectedDecision: 'CHALLENGE'
    },
    {
      name: 'Rogue Action: Java Agent Attempts Unauthorized Database Drop',
      payload: { agentId: 'java-agent', action: 'DELETE_DATABASE', resource: 'campusDB' },
      expectedDecision: 'BLOCK'
    },
    {
      name: 'Post-Quarantine Action: Java Agent Attempts Read While Quarantined',
      payload: { agentId: 'java-agent', action: 'READ_JAVA_FILE', resource: 'Test.java' },
      expectedDecision: 'BLOCK'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[Test ${i + 1}] ${tc.name}`);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.payload)
      });
      const data = await res.json();
      const passed = data.decision === tc.expectedDecision;

      console.log(`  Decision: ${data.decision} (Expected: ${tc.expectedDecision}) -> ${passed ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`  Risk Score: ${data.riskScore}/100 | Severity: ${data.severity}`);
      console.log(`  Reasoning: "${data.reasoning}"\n`);
    } catch (err) {
      console.error(`  Error running test: ${err.message}\n`);
    }
  }

  console.log('--- TEST RUN COMPLETE ---');
}

runTests();
