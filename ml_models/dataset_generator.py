"""
API Performance & Anomaly Detection Dataset Generator
Title: Intelligent API Performance Monitoring and Anomaly Detection
Author: MCA Final Year Project
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_api_dataset(num_records=5000, output_path='../datasets/api_performance_logs.csv'):
    np.random.seed(42)
    
    endpoints = [
        '/api/v1/auth/login',
        '/api/v1/users/profile',
        '/api/v1/orders/checkout',
        '/api/v1/payments/process',
        '/api/v1/search/catalog',
        '/api/v1/analytics/report',
        '/api/v1/inventory/check',
        '/api/v1/notifications/send'
    ]
    
    methods = ['GET', 'POST', 'PUT', 'DELETE']
    
    base_latencies = {
        '/api/v1/auth/login': 50,
        '/api/v1/users/profile': 30,
        '/api/v1/orders/checkout': 120,
        '/api/v1/payments/process': 250,
        '/api/v1/search/catalog': 80,
        '/api/v1/analytics/report': 300,
        '/api/v1/inventory/check': 40,
        '/api/v1/notifications/send': 60
    }
    
    start_time = datetime.now() - timedelta(days=14)
    data = []
    
    for i in range(num_records):
        timestamp = start_time + timedelta(seconds=i * 240)
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        ep = np.random.choice(endpoints)
        method = 'POST' if 'login' in ep or 'checkout' in ep or 'process' in ep or 'send' in ep else 'GET'
        
        # Concurrency load
        is_peak = 9 <= hour <= 18
        concurrency = np.random.randint(50, 200) if is_peak else np.random.randint(10, 60)
        
        payload_kb = np.random.uniform(5, 50) if 'analytics' not in ep else np.random.uniform(100, 500)
        cpu_usage = min(99.0, max(10.0, (concurrency / 200) * 75 + np.random.normal(5, 5)))
        mem_usage = min(95.0, max(20.0, 35 + (concurrency / 200) * 45 + np.random.normal(3, 3)))
        
        base_lat = base_latencies[ep]
        latency = base_lat + (concurrency / 10) * 4 + (cpu_usage / 10) * 6 + np.random.normal(0, 10)
        latency = max(10, round(latency, 2))
        
        status_code = 200 if method == 'GET' else 201
        is_anomaly = 0
        anomaly_reason = 'Normal'
        
        # Inject deliberate anomalies (~5% of data)
        if np.random.rand() < 0.05:
            is_anomaly = 1
            if np.random.rand() < 0.5:
                latency = round(np.random.uniform(600, 1800), 2)
                anomaly_reason = 'Latency Spike'
            else:
                status_code = np.random.choice([500, 502, 503, 429])
                anomaly_reason = 'Error Cluster'
                
        data.append({
            'log_id': f'LOG_{10000+i}',
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'endpoint': ep,
            'method': method,
            'status_code': status_code,
            'response_time_ms': latency,
            'payload_size_kb': round(payload_kb, 2),
            'concurrency_level': concurrency,
            'cpu_usage_pct': round(cpu_usage, 2),
            'mem_usage_pct': round(mem_usage, 2),
            'hour_of_day': hour,
            'day_of_week': day_of_week,
            'is_anomaly': is_anomaly,
            'anomaly_reason': anomaly_reason
        })
        
    df = pd.DataFrame(data)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated successfully with {len(df)} records at {output_path}")
    return df

if __name__ == '__main__':
    generate_api_dataset()
