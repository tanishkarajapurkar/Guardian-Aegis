"""
Guardian Agent ML Microservice (PS002)
Behavioral Anomaly Detection using scikit-learn IsolationForest.
Evaluates agent action velocity, tool entropy, and unauthorized attempt rates.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest

app = FastAPI(
    title="Guardian Aegis - ML Anomaly Detection Service",
    description="Unsupervised behavior anomaly scoring for autonomous AI agents using IsolationForest",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeaturePayload(BaseModel):
    agent_id: str
    requests_per_min: float
    unauthorized_ratio: float
    sensitive_ratio: float
    tool_entropy: float
    recent_count: int

# Initialize and fit the Isolation Forest model on synthetic baseline data
def create_trained_model():
    np.random.seed(42)
    # Generate 500 normal behavior vectors:
    # [requests_per_min (1-4), unauthorized_ratio (0.0-0.05), sensitive_ratio (0.0-0.1), tool_entropy (0.1-0.4)]
    n_normal = 600
    norm_rpm = np.random.normal(loc=2.5, scale=0.8, size=(n_normal, 1))
    norm_unauth = np.random.exponential(scale=0.01, size=(n_normal, 1))
    norm_sens = np.random.exponential(scale=0.04, size=(n_normal, 1))
    norm_entropy = np.random.normal(loc=0.25, scale=0.08, size=(n_normal, 1))

    X_normal = np.hstack([norm_rpm, norm_unauth, norm_sens, norm_entropy])
    X_normal = np.clip(X_normal, 0, [15, 1.0, 1.0, 1.0])

    # Add a small proportion (5%) of synthetic anomalous vectors for realistic boundary
    n_outliers = 30
    out_rpm = np.random.uniform(7.0, 14.0, size=(n_outliers, 1))
    out_unauth = np.random.uniform(0.3, 1.0, size=(n_outliers, 1))
    out_sens = np.random.uniform(0.4, 0.9, size=(n_outliers, 1))
    out_entropy = np.random.uniform(0.6, 1.0, size=(n_outliers, 1))

    X_outliers = np.hstack([out_rpm, out_unauth, out_sens, out_entropy])
    X_train = np.vstack([X_normal, X_outliers])

    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    iso_forest.fit(X_train)
    return iso_forest

model = create_trained_model()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Guardian Aegis ML Behavior Monitor",
        "model": "scikit-learn IsolationForest",
        "features": ["requests_per_min", "unauthorized_ratio", "sensitive_ratio", "tool_entropy"]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict-anomaly")
def predict_anomaly(payload: FeaturePayload):
    # Vector: [requests_per_min, unauthorized_ratio, sensitive_ratio, tool_entropy]
    vector = np.array([[
        payload.requests_per_min,
        payload.unauthorized_ratio,
        payload.sensitive_ratio,
        payload.tool_entropy
    ]])

    # IsolationForest: 1 for inlier (normal), -1 for outlier (anomaly)
    prediction = model.predict(vector)[0]
    
    # score_samples returns opposite of anomaly score; lower values mean more abnormal
    raw_score = model.score_samples(vector)[0]
    
    # Map raw_score (typically in range -0.7 to -0.3) to 0.0 .. 1.0
    # Higher mapped_score = more anomalous
    normalized_anomaly_score = float(np.clip(((-raw_score) - 0.35) / 0.35, 0.0, 1.0))
    
    # Explicit boosts if unauthorized actions were detected
    if payload.unauthorized_ratio > 0:
        normalized_anomaly_score = max(normalized_anomaly_score, 0.55 + payload.unauthorized_ratio * 0.4)
        normalized_anomaly_score = min(1.0, normalized_anomaly_score)

    is_anomaly = bool(prediction == -1 or normalized_anomaly_score >= 0.50)

    details = (
        f"RPM: {payload.requests_per_min:.1f}, "
        f"Unauth Ratio: {payload.unauthorized_ratio:.2f}, "
        f"Sensitive Ratio: {payload.sensitive_ratio:.2f}, "
        f"Entropy: {payload.tool_entropy:.2f}"
    )

    return {
        "agent_id": payload.agent_id,
        "is_anomaly": is_anomaly,
        "anomaly_score": round(normalized_anomaly_score, 2),
        "raw_score": round(float(raw_score), 4),
        "details": details
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
