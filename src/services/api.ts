import { APILog, Alert, EndpointMetric, MLPredictionInput, MLPredictionOutput, ModelMetrics, PerformanceReport, SystemStats, SystemThresholds, User, EDAMetrics, TargetWebsite } from '../types.js';

const API_BASE = '/api';

/**
 * Robust fetch wrapper with automatic retries and exponential backoff
 * Prevents transient dev-server reload and network glitches from crashing telemetry fetches.
 */
async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delay = 600): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // If server returned 5xx status or transient error, retry
      if (res.status >= 500 && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
        continue;
      }
      const text = await res.text();
      let errorMsg = `HTTP ${res.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error) errorMsg = json.error;
      } catch {
        if (text) errorMsg = text.slice(0, 100);
      }
      throw new Error(errorMsg);
    } catch (err: any) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error(`Network request failed for ${url}`);
}

export async function fetchTargetWebsite(): Promise<TargetWebsite> {
  const res = await fetchWithRetry(`${API_BASE}/target-website`);
  return res.json();
}

export async function setTargetWebsite(url: string): Promise<{ target: TargetWebsite; stats: SystemStats; endpoints: EndpointMetric[] }> {
  const res = await fetchWithRetry(`${API_BASE}/target-website/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

export async function pingTargetWebsite(): Promise<TargetWebsite> {
  const res = await fetchWithRetry(`${API_BASE}/target-website/ping`, { method: 'POST' });
  return res.json();
}

export async function fetchDashboardStats(): Promise<{ stats: SystemStats; endpoints: EndpointMetric[] }> {
  const res = await fetchWithRetry(`${API_BASE}/dashboard/stats`);
  return res.json();
}

export async function fetchEndpointMetrics(): Promise<EndpointMetric[]> {
  const res = await fetchWithRetry(`${API_BASE}/monitoring/endpoints`);
  return res.json();
}

export async function fetchLogs(params?: { search?: string; endpoint?: string; isAnomaly?: string; limit?: number }): Promise<APILog[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.endpoint) query.append('endpoint', params.endpoint);
  if (params?.isAnomaly) query.append('isAnomaly', params.isAnomaly);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetchWithRetry(`${API_BASE}/monitoring/logs?${query.toString()}`);
  return res.json();
}

export async function simulateTraffic(data: Partial<APILog>): Promise<{ log: APILog; alertCreated?: Alert }> {
  const res = await fetchWithRetry(`${API_BASE}/monitoring/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function predictLatency(input: MLPredictionInput): Promise<MLPredictionOutput> {
  const res = await fetchWithRetry(`${API_BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return res.json();
}

export async function fetchAnomalies(): Promise<{ anomalies: APILog[]; scatterPoints: any[] }> {
  const res = await fetchWithRetry(`${API_BASE}/ml/anomalies`);
  return res.json();
}

export async function fetchMLModels(): Promise<ModelMetrics[]> {
  const res = await fetchWithRetry(`${API_BASE}/ml/models`);
  return res.json();
}

export async function retrainMLModels(): Promise<{ message: string; models: ModelMetrics[] }> {
  const res = await fetchWithRetry(`${API_BASE}/ml/retrain`, { method: 'POST' });
  return res.json();
}

export async function fetchEDA(): Promise<EDAMetrics> {
  const res = await fetchWithRetry(`${API_BASE}/ml/eda`);
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetchWithRetry(`${API_BASE}/alerts`);
  return res.json();
}

export async function updateAlertStatus(id: string, status: Alert['status'], userName = 'Admin'): Promise<Alert> {
  const res = await fetchWithRetry(`${API_BASE}/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, userName })
  });
  return res.json();
}

export async function fetchReports(): Promise<PerformanceReport[]> {
  const res = await fetchWithRetry(`${API_BASE}/reports`);
  return res.json();
}

export async function generateReport(type: PerformanceReport['type']): Promise<PerformanceReport> {
  const res = await fetchWithRetry(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetchWithRetry(`${API_BASE}/users`);
  return res.json();
}

export async function fetchThresholds(): Promise<SystemThresholds> {
  const res = await fetchWithRetry(`${API_BASE}/settings/thresholds`);
  return res.json();
}

export async function updateThresholds(t: Partial<SystemThresholds>): Promise<SystemThresholds> {
  const res = await fetchWithRetry(`${API_BASE}/settings/thresholds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t)
  });
  return res.json();
}
