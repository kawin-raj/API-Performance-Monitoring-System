# Data Flow Diagrams (DFD)

## Intelligent API Performance Monitoring and Anomaly Detection

---

### DFD Level 0 (Context Diagram)

```
                       +---------------------------------------+
                       |              ADMIN USER               |
                       +---------------------------------------+
                           |                              ^
                           | (1) Set Alert Thresholds     | (4) Real-Time Alerts
                           |     & Retrain ML Models      |     & Reports
                           v                              |
            +-------------------------------------------------------------+
            |                                                             |
            |   INTELLIGENT API PERFORMANCE MONITORING SYSTEM (0.0)       |
            |                                                             |
            +-------------------------------------------------------------+
                           ^                              ^
                           |                              |
                           | (2) Raw API Telemetry        | (3) Predict Requests
                           |     Logs & Metrics           |     & Queries
                           |                              |
         +-------------------+                          +-------------------+
         |   CLIENT APIS     |                          |   DEVOPS ENGINEER |
         +-------------------+                          +-------------------+
```

---

### DFD Level 1 (Detailed Sub-Processes)

```
                 +--------------------------------------------------+
                 | 1.0 TELEMETRY INGESTION & DATA PREPROCESSING     |
                 +--------------------------------------------------+
                                          |
                                          | Preprocessed Vector
                                          v
                 +--------------------------------------------------+
                 | 2.0 MACHINE LEARNING INFERENCE ENGINE            |
                 |     - 2.1 XGBoost Latency Prediction             |
                 |     - 2.2 Isolation Forest Anomaly Detection     |
                 +--------------------------------------------------+
                                          |
                                          | Anomaly Score & Prediction
                                          v
                 +--------------------------------------------------+
                 | 3.0 ALERT DISPATCH & THRESHOLD CHECK             |
                 +--------------------------------------------------+
                                          |
                                          | Store Alert & Log
                                          v
                 +--------------------------------------------------+
                 | 4.0 REPORT GENERATOR & ANALYTICS DASHBOARD       |
                 +--------------------------------------------------+
```
