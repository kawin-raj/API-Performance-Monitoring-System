"""
Isolation Forest Anomaly Detection Training Script
Title: Intelligent API Performance Monitoring and Anomaly Detection
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from preprocess import APIPreprocessPipeline
from dataset_generator import generate_api_dataset

def train_isolation_forest():
    df = generate_api_dataset(num_records=5000)
    
    pipeline = APIPreprocessPipeline()
    X_scaled, y_latency, y_anomaly, _ = pipeline.fit_transform(df)
    
    # Feature matrix for isolation forest includes response time
    X_iso = np.hstack([X_scaled, y_latency.values.reshape(-1, 1)])
    
    print("Training Isolation Forest Model...")
    iso_model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    
    iso_model.fit(X_iso)
    
    preds_raw = iso_model.predict(X_iso)
    preds_binary = (preds_raw == -1).astype(int)
    
    print("\n--- Anomaly Detection Evaluation ---")
    print(classification_report(y_anomaly, preds_binary, target_names=['Normal', 'Anomaly']))
    roc = roc_auc_score(y_anomaly, preds_binary)
    print(f"ROC-AUC Score: {roc:.4f}")
    
    joblib.dump(iso_model, 'isolation_forest_model.pkl')
    print("Saved Isolation Forest model to isolation_forest_model.pkl")

if __name__ == '__main__':
    train_isolation_forest()
