# UML Diagrams

## Intelligent API Performance Monitoring and Anomaly Detection

---

### 1. Use Case Diagram

```
                                  +----------------------------------------------------+
                                  |                     SYSTEM                         |
                                  |                                                    |
                                  |   ( Monitor Real-Time API Metrics )                |
   +-------------------+          |                     ^                              |
   |                   |--------->|                     |                              |
   |  DevOps Engineer  |          |   ( Predict Future Latency & Health )              |
   |                   |--------->|                     ^                              |
   +-------------------+          |                     |                              |
                                  |   ( Detect Isolation Forest Anomalies )            |
                                  |                     ^                              |
                                  |                     |                              |
   +-------------------+          |   ( Manage & Resolve Alerts )                      |
   |                   |--------->|                                                    |
   |    Admin User     |          |   ( Retrain Machine Learning Models )              |
   |                   |--------->|                                                    |
   +-------------------+          |   ( Generate Performance Reports )                 |
                                  |                                                    |
                                  +----------------------------------------------------+
```

---

### 2. Sequence Diagram (Real-Time Telemetry & Anomaly Detection Flow)

```
Client / Simulator      Express Server          ML Engine           SQLite DB         Alert Manager
       |                      |                     |                   |                   |
       |--- POST Telemetry -->|                     |                   |                   |
       |    Log               |                     |                   |                   |
       |                      |-- Evaluate Anomaly->|                   |                   |
       |                      |   (Iso Forest)      |                   |                   |
       |                      |<-- Score & Reason --|                   |                   |
       |                      |                                         |                   |
       |                      |-------------- Save Log Record --------->|                   |
       |                      |                                         |                   |
       |                      |-- Check Thresholds & Anomaly Score ------------------------>|
       |                      |                                                             |-- Dispatch Alert
       |<-- Response 200 -----|                                                             |   (If Breached)
```

---

### 3. Class Diagram

```
+------------------------------------+          +------------------------------------+
|               APILog               |          |            MLEngine                |
+------------------------------------+          +------------------------------------+
| + id: string                       |          | - xgbTrees: DecisionNode[]         |
| + endpoint: string                 |          | - iForestTrees: IsolationNode[]    |
| + method: HTTPMethod               |          | + predictLatency(input): Output    |
| + responseTimeMs: number           |          | + calculateAnomalyScore(): number  |
| + isAnomaly: boolean               |          | + retrainModels(logs): Metadata[]  |
| + anomalyScore: number             |          +------------------------------------+
+------------------------------------+                            |
                  |                                               |
                  v                                               v
+------------------------------------+          +------------------------------------+
|          SQLiteDatabase            |          |             Alert                  |
+------------------------------------+          +------------------------------------+
| - logs: APILog[]                   |          | + id: string                       |
| - alerts: Alert[]                  |          | + endpoint: string                 |
| + getSystemStats(): SystemStats    |          | + severity: AlertSeverity          |
| + addLog(data): APILog             |          | + status: AlertStatus              |
+------------------------------------+          +------------------------------------+
```
