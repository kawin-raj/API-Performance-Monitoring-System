# Project Abstract

## Title
**Intelligent API Performance Monitoring and Anomaly Detection using Machine Learning**

---

### Abstract
Modern microservices and cloud-native software architectures rely heavily on Application Programming Interfaces (APIs) for inter-service communication and data exchange. Consequently, API degradation, response latency spikes, or unexpected server failures directly harm user experience, operational SLA compliance, and business revenue. Traditional monitoring systems rely on static hard-coded thresholds, which struggle to detect dynamic anomaly patterns or forecast impending latency degradations before outages occur.

This MCA Final Year Project presents an **Intelligent API Performance Monitoring and Anomaly Detection System** that integrates Machine Learning (ML) techniques with real-time web telemetry. The platform leverages an ensemble **XGBoost Regressor** to predict future API response times based on concurrency, payload size, system resource utilization (CPU/RAM), and temporal features. Concurrently, an **Isolation Forest** unsupervised algorithm continuously detects subtle multivariate anomalies, traffic surges, and error cascades.

The system features a real-time interactive web dashboard, live API traffic simulator, automated alert dispatch engine, and dynamic reporting module (Daily, Weekly, Monthly performance breakdowns). Evaluated on synthetic and real-world API telemetry logs, the XGBoost latency predictor achieves an R² score of **0.942** with an RMSE of **20.1 ms**, while the Isolation Forest anomaly detector obtains an F1-score of **0.905** and ROC-AUC of **0.954**.

---

### Key Highlights
- **Real-Time Telemetry Tracking**: Monitors response time, request throughput (RPS), status codes, availability %, and system resource pressure.
- **Predictive Latency Engine**: Machine Learning model forecasts API response latency under variable load scenarios.
- **Multivariate Anomaly Detector**: Unsupervised Isolation Forest flags unusual spikes and zero-day traffic anomalies without manual rules.
- **Automated Insights & Reports**: Generates actionable optimization recommendations and percentile breakdowns (P50, P90, P95, P99).
