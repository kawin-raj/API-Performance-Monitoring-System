"""
XGBoost Latency Prediction Training Script
Title: Intelligent API Performance Monitoring and Anomaly Detection
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
from preprocess import APIPreprocessPipeline
from dataset_generator import generate_api_dataset

def train_xgboost_model():
    print("Generating/loading API dataset...")
    df = generate_api_dataset(num_records=5000)
    
    pipeline = APIPreprocessPipeline()
    X_scaled, y_latency, _, feature_cols = pipeline.fit_transform(df)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_latency, test_size=0.2, random_state=42
    )
    
    print("Training XGBoost Regressor model...")
    model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Evaluation ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} ms")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} ms")
    print(f"R² Score: {r2:.4f}")
    
    joblib.dump(model, 'xgboost_latency_model.pkl')
    joblib.dump(pipeline, 'preprocess_pipeline.pkl')
    print("Saved model to xgboost_latency_model.pkl")

if __name__ == '__main__':
    train_xgboost_model()
