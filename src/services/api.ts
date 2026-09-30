import { APILog, Alert, EndpointMetric, MLPredictionInput, MLPredictionOutput, ModelMetrics, PerformanceReport, SystemStats, SystemThresholds, User, EDAMetrics, TargetWebsite } from '../types.js';

const API_BASE = '/api';

export async function fetchTargetWebsite(): Promise<TargetWebsite> {
  const res = await fetch(`${API_BASE}/target-website`);
  if (!res.ok) throw new Error('Failed to fetch target website');
  return res.json();
}

export async function setTargetWebsite(url: string): Promise<{ target: TargetWebsite; stats: SystemStats; endpoints: EndpointMetric[] }> {
  const res = await fetch(`${API_BASE}/target-website/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) throw new Error('Failed to set target website');
  return res.json();
}

export async function pingTargetWebsite(): Promise<TargetWebsite> {
  const res = await fetch(`${API_BASE}/target-website/ping`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to ping target website');
  return res.json();
}

export async function fetchDashboardStats(): Promise<{ stats: SystemStats; endpoints: EndpointMetric[] }> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchEndpointMetrics(): Promise<EndpointMetric[]> {
  const res = await fetch(`${API_BASE}/monitoring/endpoints`);
  if (!res.ok) throw new Error('Failed to fetch endpoint metrics');
  return res.json();
}

export async function fetchLogs(params?: { search?: string; endpoint?: string; isAnomaly?: string; limit?: number }): Promise<APILog[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.endpoint) query.append('endpoint', params.endpoint);
  if (params?.isAnomaly) query.append('isAnomaly', params.isAnomaly);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/monitoring/logs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function simulateTraffic(data: Partial<APILog>): Promise<{ log: APILog; alertCreated?: Alert }> {
  const res = await fetch(`${API_BASE}/monitoring/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to simulate traffic');
  return res.json();
}

export async function predictLatency(input: MLPredictionInput): Promise<MLPredictionOutput> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('Failed to run ML latency prediction');
  return res.json();
}

export async function fetchAnomalies(): Promise<{ anomalies: APILog[]; scatterPoints: any[] }> {
  const res = await fetch(`${API_BASE}/ml/anomalies`);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
}

export async function fetchMLModels(): Promise<ModelMetrics[]> {
  const res = await fetch(`${API_BASE}/ml/models`);
  if (!res.ok) throw new Error('Failed to fetch ML models metadata');
  return res.json();
}

export async function retrainMLModels(): Promise<{ message: string; models: ModelMetrics[] }> {
  const res = await fetch(`${API_BASE}/ml/retrain`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retrain ML models');
  return res.json();
}

export async function fetchEDA(): Promise<EDAMetrics> {
  const res = await fetch(`${API_BASE}/ml/eda`);
  if (!res.ok) throw new Error('Failed to fetch EDA data');
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function updateAlertStatus(id: string, status: Alert['status'], userName = 'Admin'): Promise<Alert> {
  const res = await fetch(`${API_BASE}/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, userName })
  });
  if (!res.ok) throw new Error('Failed to update alert');
  return res.json();
}

export async function fetchReports(): Promise<PerformanceReport[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function generateReport(type: PerformanceReport['type']): Promise<PerformanceReport> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchThresholds(): Promise<SystemThresholds> {
  const res = await fetch(`${API_BASE}/settings/thresholds`);
  if (!res.ok) throw new Error('Failed to fetch thresholds');
  return res.json();
}

export async function updateThresholds(t: Partial<SystemThresholds>): Promise<SystemThresholds> {
  const res = await fetch(`${API_BASE}/settings/thresholds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t)
  });
  if (!res.ok) throw new Error('Failed to update thresholds');
  return res.json();
}
