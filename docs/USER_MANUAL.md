# User Manual & Operating Guide

## Intelligent API Performance Monitoring and Anomaly Detection

---

### Module 1: Dashboard Overview
1. **Executive KPI Cards**: View Total Requests, Average Response Time (Latency in ms), Overall Error Rate (%), Success Rate (%), Active Endpoints, and the calculated **Overall Performance Score** (0-100 index).
2. **Real-Time Latency & Throughput Chart**: View live multi-line trend comparison of API Latency vs Request Throughput (req/sec).
3. **Status Breakdown & Top Degraded APIs**: Instantly see status code distributions (200, 429, 500) and endpoints experiencing response time degradation.

---

### Module 2: Live API Monitoring & Simulator
1. **Live Traffic Stream**: Inspect incoming requests in real time.
2. **Interactive Simulator**:
   - Choose target endpoint (e.g. `/api/v1/payments/process`).
   - Select HTTP Method (`POST`, `GET`).
   - Adjust Concurrency Slider (10 to 250 req/sec) and CPU Load (10% to 98%).
   - Click **"Simulate Traffic Request"** or **"Simulate Burst Traffic Spike"**.
   - Watch the ML Isolation Forest evaluate the request live and fire an alert if an anomaly is detected!

---

### Module 3: Machine Learning Hub
- **Latency Predictor Tab**: Input concurrency level, payload size, CPU/RAM usage, hour of day; click **Predict Latency** to receive XGBoost predicted response time, health status, and failure risk percentage.
- **Anomaly Detection Tab**: View Isolation Forest anomaly score scatter plot ($s \in [0, 1]$), anomaly timeline, and root cause flags.
- **Model Management Tab**: Inspect R², RMSE, MAE for XGBoost, and Precision/Recall/F1 for Isolation Forest. Click **Retrain Models Now** to fit models on newly captured logs!
- **EDA Analytics Tab**: Inspect feature correlation heatmaps and peak hour latency distributions.

---

### Module 4: Alert System & Thresholds
- View all active, acknowledged, and resolved alerts.
- Filter by severity (**Critical**, **High**, **Medium**, **Low**).
- Click **Acknowledge** or **Resolve** on active incidents.
- Configure warning and critical threshold values for latency and error rates.

---

### Module 5: Automated Performance Reports
- Select **Daily**, **Weekly**, or **Monthly** report generation.
- Click **"Generate Report"**.
- View latency percentiles (P50, P90, P95, P99), top degrading endpoints, and automated ML recommendations.
- Click **"Export / Print PDF"** or **"Export JSON"**.
