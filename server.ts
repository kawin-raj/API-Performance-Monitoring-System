import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './database/sqliteDb.js';
import { globalMLEngine } from './server/mlEngine.js';
import { MLPredictionInput } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Target Website Monitoring Endpoints
  app.get('/api/target-website', (req, res) => {
    try {
      const target = db.getTargetWebsite();
      res.json(target);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/target-website/set', async (req, res) => {
    try {
      const { url } = req.body;
      const target = await db.setTargetWebsite(url);
      const stats = db.getSystemStats();
      const endpoints = db.getEndpointMetrics();
      res.json({ target, stats, endpoints });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/target-website/ping', async (req, res) => {
    try {
      const target = await db.pingTargetWebsite();
      res.json(target);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1. Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const stats = db.getSystemStats();
      const endpoints = db.getEndpointMetrics();
      res.json({ stats, endpoints });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Monitoring Endpoints & Logs
  app.get('/api/monitoring/endpoints', (req, res) => {
    try {
      const metrics = db.getEndpointMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/monitoring/logs', (req, res) => {
    try {
      const search = req.query.search as string;
      const endpoint = req.query.endpoint as string;
      const isAnomaly = req.query.isAnomaly as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const logs = db.getLogs({ search, endpoint, isAnomaly, limit });
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Simulate API Traffic
  app.post('/api/monitoring/simulate', (req, res) => {
    try {
      const { endpoint, method, statusCode, responseTimeMs, concurrencyLevel, payloadSizeKb, cpuUsagePct, memUsagePct } = req.body;

      const newLogData = {
        timestamp: new Date().toISOString(),
        endpoint: endpoint || '/api/v1/orders/checkout',
        method: method || 'POST',
        statusCode: statusCode || 200,
        responseTimeMs: responseTimeMs || Math.floor(40 + Math.random() * 80),
        payloadSizeKb: payloadSizeKb || 25,
        concurrencyLevel: concurrencyLevel || 50,
        cpuUsagePct: cpuUsagePct || 45,
        memUsagePct: memUsagePct || 55
      };

      const result = db.addLog(newLogData);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Machine Learning API Endpoints
  app.post('/api/ml/predict', (req, res) => {
    try {
      const input: MLPredictionInput = req.body;
      const prediction = globalMLEngine.predictLatency(input);
      res.json(prediction);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ml/anomalies', (req, res) => {
    try {
      const allAnomalies = db.getLogs({ isAnomaly: 'true', limit: 800 });
      const recentLogs = db.getLogs({ limit: 400 });
      const anomalies = allAnomalies.length > 0 ? allAnomalies : recentLogs.filter(l => l.isAnomaly);
      const scatterPoints = recentLogs.map(l => ({
        id: l.id,
        endpoint: l.endpoint,
        latencyMs: l.responseTimeMs,
        concurrency: l.concurrencyLevel,
        anomalyScore: l.anomalyScore,
        isAnomaly: l.isAnomaly,
        statusCode: l.statusCode,
        timestamp: l.timestamp
      }));

      res.json({ anomalies, scatterPoints });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ml/models', (req, res) => {
    try {
      const metadata = globalMLEngine.getModelMetadata();
      res.json(metadata);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ml/retrain', (req, res) => {
    try {
      const logs = db.getLogs({ limit: 2000 });
      const updatedMetadata = globalMLEngine.retrainModels(logs);
      res.json({ message: 'Models successfully retrained on latest API telemetry logs!', models: updatedMetadata });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ml/eda', (req, res) => {
    try {
      const logs = db.getLogs({ limit: 1000 });
      const eda = globalMLEngine.generateEDA(logs);
      res.json(eda);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Alerts API
  app.get('/api/alerts', (req, res) => {
    try {
      const alerts = db.getAlerts();
      res.json(alerts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/alerts/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, userName } = req.body;
      const updated = db.updateAlertStatus(id, status, userName);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Reports API
  app.get('/api/reports', (req, res) => {
    try {
      const reports = db.getReports();
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reports/generate', (req, res) => {
    try {
      const { type } = req.body;
      const report = db.createReport(type || 'Daily');
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Users & System Settings
  app.get('/api/users', (req, res) => {
    try {
      const users = db.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/settings/thresholds', (req, res) => {
    try {
      res.json(db.getThresholds());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/thresholds', (req, res) => {
    try {
      const newT = db.updateThresholds(req.body);
      res.json(newT);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup for Development vs Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
