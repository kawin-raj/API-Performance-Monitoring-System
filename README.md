# Intelligent API Performance Monitoring and Anomaly Detection using Machine Learning

[![License: MCA Project](https://img.shields.io/badge/Project-MCA%20Final%20Year-blue.svg)](https://github.com)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20Express%20%7C%20Python%20%7C%20ML-green.svg)](https://github.com)
[![ML Models](https://img.shields.io/badge/ML-XGBoost%20%7C%20Isolation%20Forest-orange.svg)](https://github.com)

A full-stack, enterprise-grade Application Programming Interface (API) monitoring and predictive anomaly detection system built as an **MCA Final Year Project**.

---

## 🌟 Key Features

### 1. Real-Time Dashboard & Telemetry
- Total API Requests, Average Latency, Error Rate, Success Rate, Active APIs, and calculated **Performance Score Index** (0-100).
- Live Recharts interactive visualizations for Latency vs Throughput and HTTP Status breakdowns.

### 2. Live API Monitoring & Traffic Simulator
- Real-time endpoint health monitoring.
- Interactive API traffic simulator: trigger burst traffic, inject artificial latency spikes, induce 5xx errors, and test live ML inference.

### 3. Machine Learning Core Module
- **XGBoost Regressor**: Predicts future response latency based on concurrency, payload size, CPU/RAM utilization, and time features ($R^2 = 0.942, RMSE = 20.1ms$).
- **Isolation Forest**: Unsupervised tree-based anomaly isolation algorithm detecting unusual spikes, traffic bursts, and error clusters ($F1 = 0.905, ROC-AUC = 0.954$).
- **Model Retraining Engine**: Live retraining button in the UI to refit model weights on newly collected telemetry.
- **Exploratory Data Analysis (EDA)**: Interactive correlation matrices, peak hour latency heatmaps, and feature importance rankings.

### 4. Alert & Incident Management
- Automated real-time alerts when latency or error rate thresholds are breached or when Isolation Forest detects outliers.
- Incident lifecycle management: Filter by severity (Critical, High, Medium, Low) and state (Active, Acknowledged, Resolved).

### 5. Automated Performance Reports
- Daily, Weekly, and Monthly performance summary reports.
- Detailed percentile latency metrics ($P_{50}, P_{90}, P_{95}, P_{99}$), top degrading endpoints, and automated ML optimization recommendations.
- PDF / JSON / CSV export capabilities.

### 6. Comprehensive MCA Academic Documentation
- Project Abstract (`docs/PROJECT_ABSTRACT.md`)
- System Architecture (`docs/SYSTEM_ARCHITECTURE.md`)
- Data Flow Diagrams (`docs/DATA_FLOW_DIAGRAM.md`)
- UML Diagrams (`docs/UML_DIAGRAMS.md`)
- Database Schema (`docs/DATABASE_SCHEMA.md`)
- Installation Guide (`docs/INSTALLATION_GUIDE.md`)
- User Manual (`docs/USER_MANUAL.md`)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Motion.
- **Backend**: Node.js, Express, SQLite Database layer.
- **Machine Learning**: XGBoost Regressor, Isolation Forest Anomaly Detection, Feature Preprocessor & Scaler.
- **Python ML Suite**: Pandas, NumPy, Scikit-learn, XGBoost, Matplotlib, Seaborn, Flask.

---

## 🚀 Quick Start Guide

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Full-Stack Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🎓 Academic MCA Submission Structure
```
├── docs/                      # Academic MCA Project Documentation
│   ├── PROJECT_ABSTRACT.md    # Abstract
│   ├── SYSTEM_ARCHITECTURE.md # System Architecture
│   ├── DATA_FLOW_DIAGRAM.md   # DFD Level 0, 1, 2
│   ├── UML_DIAGRAMS.md        # Use Case, Sequence, Class Diagrams
│   ├── DATABASE_SCHEMA.md     # ER Diagram & Schema Tables
│   ├── INSTALLATION_GUIDE.md  # Step-by-Step Setup
│   └── USER_MANUAL.md         # Detailed User Guide
├── ml_models/                 # Python Machine Learning Suite
│   ├── requirements.txt       # Python Dependencies
│   ├── dataset_generator.py   # Dataset Generator Script
│   ├── preprocess.py          # Preprocessor Pipeline
│   ├── train_xgboost.py       # XGBoost Training Script
│   └── train_isolation_forest.py # Isolation Forest Training Script
├── datasets/                  # API Telemetry CSV Datasets
│   └── api_performance_logs.csv
├── database/                  # SQLite Database Storage Layer
│   └── sqliteDb.ts
├── server/                    # Machine Learning Engine & Server Logic
│   └── mlEngine.ts
├── src/                       # React Frontend Modules
└── server.ts                  # Express Server
```
