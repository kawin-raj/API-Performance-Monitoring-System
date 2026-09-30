# System Architecture

## Intelligent API Performance Monitoring and Anomaly Detection

### 1. High-Level Architectural Diagram

```
+-------------------------------------------------------------------------+
|                              USER / CLIENT                              |
|         (Web Dashboard / Web Browser / Mobile / MCA Examiner UI)        |
+-------------------------------------------------------------------------+
                                    | (HTTPS / REST)
                                    v
+-------------------------------------------------------------------------+
|                       FRONTEND PRESENTATION LAYER                       |
|           React 19 + Tailwind CSS + Recharts + Lucide Icons             |
|  - Real-time KPI Dashboard            - ML Prediction & Anomaly Views   |
|  - Live API Simulator                 - Automated Reports Engine        |
|  - Log Explorer & Filtering           - Alert Management & Thresholds   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        BACKEND APPLICATION LAYER                        |
|                     Node.js + Express Server (Port 3000)                |
|  - RESTful API Controller             - Alert Dispatcher & Rules        |
|  - Telemetry Log Collector            - Report Generator Module         |
|  - Authentication Controller          - Background Simulator Engine     |
+-------------------------------------------------------------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                     v                             v
+----------------------------------+ +------------------------------------+
|     MACHINE LEARNING ENGINE      | |          DATABASE LAYER            |
|       (XGBoost + Isolation)      | |         (SQLite Storage)           |
|  - Feature Preprocessor & Scaler  | |  - API Telemetry Logs Table       |
|  - XGBoost Latency Predictor     | |  - Machine Learning Predictions  |
|  - Isolation Forest Outlier Tree | |  - System Alerts & Thresholds    |
|  - Model Evaluator & Retrainer   | |  - Generated Reports & Users     |
+----------------------------------+ +------------------------------------+
```

---

### 2. Component Layer Breakdown

#### A. Presentation Layer (Frontend)
- Built with React 19 and Tailwind CSS.
- Interactive visualization using **Recharts** for real-time latency trends, status breakdown pie charts, correlation heatmaps, and Isolation Forest anomaly scatter plots.
- Responsive layout with dark/light visual modes and instant UI reactivity.

#### B. Server & API Layer (Backend)
- **Node.js & Express**: Provides lightweight REST API endpoints (`/api/dashboard`, `/api/ml/predict`, `/api/ml/anomalies`, `/api/alerts`, `/api/reports`).
- Sanitizes incoming payload and orchestrates real-time telemetry processing.

#### C. Machine Learning Engine
- **Preprocessing Pipeline**: Categorical label encoding of endpoints & HTTP methods, standard feature scaling, load intensity calculations ($Concurrency \times CPU / 100$).
- **XGBoost Regressor**: Gradient boosted tree ensemble trained on latency telemetry features ($MAE < 15ms$, $R^2 > 0.94$).
- **Isolation Forest**: Unsupervised tree-based anomaly isolation algorithm calculating anomaly scores ($s \in [0, 1]$).

#### D. Storage & Persistence
- SQLite database holding tables for `users`, `api_logs`, `predictions`, `alerts`, `reports`, and `thresholds`.
