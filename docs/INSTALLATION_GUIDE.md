# Installation & Setup Guide

## Intelligent API Performance Monitoring and Anomaly Detection

---

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python** (optional for standalone ML script execution): v3.9+

---

### Step-by-Step Installation

#### 1. Clone & Navigate to Project Directory
```bash
git clone https://github.com/mca-project/api-monitoring-ml.git
cd api-monitoring-ml
```

#### 2. Install Node.js Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Copy the `.env.example` file to create your local `.env` configuration:
```bash
cp .env.example .env
```

#### 4. Run Development Server
Start the Express full-stack server with Vite frontend bundling:
```bash
npm run dev
```
The application will start on **http://localhost:3000**.

#### 5. Build for Production Deployment
```bash
npm run build
npm start
```

---

### Optional: Running Standalone Python ML Scripts
If you wish to run the standalone Python dataset generator and training scripts:

```bash
cd ml_models
pip install -r requirements.txt

# Generate synthetic dataset CSV
python dataset_generator.py

# Train XGBoost Latency Model
python train_xgboost.py

# Train Isolation Forest Model
python train_isolation_forest.py
```
