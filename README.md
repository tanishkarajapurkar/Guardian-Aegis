# 🛡️ Guardian Aegis: Autonomous Multi-Agent Integrity Monitor & Zero-Trust Gateway

> **Problem Statement PS002**: Multi-Agent Security, Integrity Monitoring, and Runtime Containment.

Guardian Aegis is a **Zero-Trust Security Gateway** that sits between autonomous AI agents and execution resources (compilers, file systems, databases, networks). Rather than passively analyzing audit logs after an incident occurs, Guardian actively **intercepts, inspects, scores risk, and enforces containment** on every tool call in real time.

---

## 🏛️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    🛡️ GUARDIAN AGENT (AEGIS GATEWAY)    │
                      │   Runtime Interceptor & Policy Firewall│
                      └───────────────────┬────────────────────┘
                                          │ Intercepts all actions
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
    ☕ Java Developer Agent          🤖 ML/Data Agent              🌐 Web/API Agent
    (Files, Compile, Run)         (Datasets, Train, Analyze)    (HTTP GET, Search, Scrape)
```

### The Three Brains of Guardian
```
                 Guardian Agent Gateway
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
  Policy Engine       Behavior Monitor       AI Reasoner
(Deterministic RBAC) (scikit-learn ML)   (Gemini AI / NLP)
  "Is it allowed?"    "Is it unusual?"    "Why is it risky?"
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                       Risk Engine
                      (Score: 0-100)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         🟢 ALLOW (0-30)          🔴 BLOCK & QUARANTINE (66-100)
         🟡 CHALLENGE (31-65)
```

1. **Policy Engine (RBAC / ABAC)**: Deterministic permission matrix checking agent identity, declared capabilities, and prohibited actions.
2. **Behavior Monitor (Python / scikit-learn)**: Microservice utilizing an `IsolationForest` to analyze sliding-window behavioral features (requests per minute, unauthorized attempt velocity, tool sequence entropy).
3. **AI Reasoner (Gemini / Local NLP)**: Synthesizes threat rationale and semantic intent mismatch into concise, plain-English explanations for human operators.

---

## 🤖 The Monitored Agents (Subjects)

| Agent | Declared Role | Allowed Actions | Forbidden Actions |
| :--- | :--- | :--- | :--- |
| **☕ Java Agent** | Java Development | `CREATE_JAVA_FILE`, `READ_JAVA_FILE`, `COMPILE_JAVA`, `RUN_JAVA` | `DELETE_DATABASE`, `ACCESS_PASSWORDS`, `SEND_PAYMENT`, `MODIFY_OTHER_AGENT` |
| **🤖 ML/Data Agent** | Data Science & ML | `READ_DATASET`, `RUN_PYTHON`, `TRAIN_MODEL`, `SAVE_MODEL`, `GENERATE_ANALYSIS` | `DELETE_USER`, `ACCESS_CREDENTIALS`, `MODIFY_JAVA_PROJECT` |
| **🌐 Web/API Agent** | Web & API Services | `HTTP_GET`, `READ_API`, `SEARCH`, `GENERATE_API_RESPONSE` | `HTTP_DELETE`, `DATABASE_DROP`, `ACCESS_SECRETS` |

---

## 🚀 Quick Start Guide

### Option 1: One-Click Windows Launch
Double-click `start-demo.bat` in the project root:
```cmd
start-demo.bat
```
This automatically verifies dependencies, launches the backend gateway and React dashboard, and opens your browser.

---

### Option 2: Manual Terminal Launch

#### 1. Backend Gateway (Port 4000)
```bash
cd backend
npm install
npm start
```

#### 2. Frontend SOC Command Center (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

#### 3. Python ML Microservice (Optional - Port 8000)
```bash
cd ml-service
pip install -r requirements.txt
python -m uvicorn app:app --port 8000
```
*(Note: If the Python ML microservice is not started, Guardian automatically uses its embedded statistical scoring engine with zero downtime).*

---

## 🎯 30-Second Hackathon Demo Script

1. **Baseline Operation**:
   - Click **"Normal Operation"** in the top control deck.
   - Notice all 3 agents execute their permitted tasks (Java compiles, ML trains, Web scrapes).
   - Telemetry shows: **Risk 5–15 (LOW)**, all badges **🟢 ACTIVE / NORMAL**.

2. **Privilege Ambiguity (Challenge)**:
   - Click **"Challenge Scenario"**.
   - ML Agent attempts to access an unlisted sensitive dataset.
   - Guardian detects novelty and assigns **Risk 50 (MEDIUM)**, placing the request in **🟡 CHALLENGE** mode.

3. **Compromised Rogue Agent (The Climax)**:
   - Click **"SIMULATE COMPROMISED AGENT"**.
   - The Java Developer Agent begins escalating:
     1. `READ_JAVA_FILE` ➔ 🟢 Allowed
     2. `COMPILE_JAVA` ➔ 🟢 Allowed
     3. `RUN_JAVA` ➔ 🟢 Allowed
     4. `HTTP_REQUEST` ➔ 🟡 Anomalous Tool Warning
     5. `ACCESS_ENV` ➔ 🟡 Credential Access Attempt
     6. `DELETE_DATABASE` on `campusDB` ➔ 🚨 **CRITICAL BREACH**
   - **Guardian Intervenes Immediately**:
     - Action is **BLOCKED**.
     - Anomaly score spikes to **0.94**.
     - Composite Risk reaches **96 / 100**.
     - Java Agent is immediately placed in **🔴 QUARANTINE**.
     - An Emergency Incident Banner pops up explaining the threat in plain English.
     - Subsequent attempts by Java Agent are rejected at the boundary.

---

## 📂 Directory Layout

```
guardian-aegis/
├── backend/
│   ├── src/
│   │   ├── config/policies.json     # Role definitions & permission bounds
│   │   ├── engines/
│   │   │   ├── policyEngine.js      # Deterministic RBAC validation
│   │   │   ├── riskEngine.js        # Multi-factor risk calculation
│   │   │   └── reasonerEngine.js    # Gemini / Local forensic explainer
│   │   ├── services/
│   │   │   ├── agentService.js      # Quarantine & agent lifecycle manager
│   │   │   ├── mlClient.js          # Feature extractor & ML connector
│   │   │   └── auditLogger.js       # Real-time WebSocket event broadcaster
│   │   └── server.js                # Express & WebSocket gateway server
│   ├── test-gateway.js              # Automated integration test script
│   └── package.json
├── ml-service/
│   ├── app.py                       # FastAPI & IsolationForest microservice
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # Header, AgentCard, Feed, IncidentModal
│   │   ├── App.jsx                  # Main command center
│   │   └── index.css                # Dark-mode cybersecurity styling
│   └── package.json
├── start-demo.bat                   # 1-click Windows launcher
└── README.md
```
