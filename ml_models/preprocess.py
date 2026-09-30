"""
Data Preprocessing & Feature Engineering Module
Title: Intelligent API Performance Monitoring and Anomaly Detection
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

class APIPreprocessPipeline:
    def __init__(self):
        self.scaler = StandardScaler()
        self.endpoint_encoder = LabelEncoder()
        self.method_encoder = LabelEncoder()
        
    def fit_transform(self, df):
        df = df.copy()
        
        # Fill missing values
        df['response_time_ms'] = df['response_time_ms'].fillna(df['response_time_ms'].median())
        df['cpu_usage_pct'] = df['cpu_usage_pct'].fillna(df['cpu_usage_pct'].mean())
        
        # Categorical Encoding
        df['endpoint_encoded'] = self.endpoint_encoder.fit_transform(df['endpoint'])
        df['method_encoded'] = self.method_encoder.fit_transform(df['method'])
        
        # Feature Engineering
        df['is_error'] = (df['status_code'] >= 400).astype(int)
        df['load_intensity'] = (df['concurrency_level'] * df['cpu_usage_pct']) / 100.0
        
        # Select Features for Latency Prediction
        feature_cols = [
            'endpoint_encoded', 'method_encoded', 'concurrency_level',
            'payload_size_kb', 'cpu_usage_pct', 'mem_usage_pct',
            'hour_of_day', 'day_of_week', 'load_intensity'
        ]
        
        X = df[feature_cols]
        y_latency = df['response_time_ms']
        y_anomaly = df['is_anomaly']
        
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y_latency, y_anomaly, feature_cols
    
    def transform_single(self, input_dict):
        endpoint_enc = self.endpoint_encoder.transform([input_dict['endpoint']])[0]
        method_enc = self.method_encoder.transform([input_dict['method']])[0]
        load_intensity = (input_dict['concurrency_level'] * input_dict['cpu_usage_pct']) / 100.0
        
        vector = np.array([[
            endpoint_enc,
            method_enc,
            input_dict['concurrency_level'],
            input_dict['payload_size_kb'],
            input_dict['cpu_usage_pct'],
            input_dict['mem_usage_pct'],
            input_dict['hour_of_day'],
            input_dict['day_of_week'],
            load_intensity
        ]])
        
        return self.scaler.transform(vector)
