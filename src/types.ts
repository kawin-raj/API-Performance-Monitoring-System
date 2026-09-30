export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503 | 504;

export type HealthStatus = 'Healthy' | 'At-Risk' | 'Degraded' | 'Critical';

export type LatencyCategory = 'Fast (<100ms)' | 'Moderate (100-300ms)' | 'Slow (300-1000ms)' | 'Severe (>1000ms)';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export type UserRole = 'Admin' | 'ML Engineer' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface APILog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: HTTPMethod;
  statusCode: number;
  responseTimeMs: number;
  payloadSizeKb: number;
  concurrencyLevel: number;
  cpuUsagePct: number;
  memUsagePct: number;
  isAnomaly: boolean;
  anomalyScore: number; // -1 to 1 (lower/negative means more anomalous in Isolation Forest)
  anomalyReason?: string;
}

export interface EndpointMetric {
  endpoint: string;
  method: HTTPMethod;
  totalRequests: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  errorRatePct: number;
  throughputRps: number;
  availabilityPct: number;
  health: HealthStatus;
  lastStatusCode: number;
}

export interface DiscoveredEndpoint {
  endpoint: string;
  method: HTTPMethod;
  category: string;
  baseLatency: number;
  payloadKb: number;
}

export interface TargetWebsite {
  url: string;
  domain: string;
  name: string;
  category: string;
  status: 'Online' | 'Checking' | 'Degraded' | 'Offline';
  statusCode: number;
  sslStatus: 'Valid' | 'Expired' | 'Unknown';
  serverHeader?: string;
  pingMs: number;
  lastScannedAt: string;
  detectedEndpoints: DiscoveredEndpoint[];
}

export interface SystemStats {
  totalRequests: number;
  avgLatencyMs: number;
  errorRatePct: number;
  successRatePct: number;
  activeEndpointsCount: number;
  performanceScore: number; // 0-100
  activeAlertsCount: number;
  throughputRps: number;
  lastUpdated: string;
}

export interface MLPredictionInput {
  endpoint: string;
  method: HTTPMethod;
  concurrencyLevel: number;
  payloadSizeKb: number;
  cpuUsagePct: number;
  memUsagePct: number;
  hourOfDay: number;
  dayOfWeek: number;
}

export interface MLPredictionOutput {
  predictedLatencyMs: number;
  latencyCategory: LatencyCategory;
  healthStatus: HealthStatus;
  failureProbabilityPct: number;
  confidenceScorePct: number;
  anomalyScore: number;
  isAnomalyPredicted: boolean;
  contributingFeatures: { feature: string; impactPct: number }[];
}

export interface ModelMetrics {
  modelName: string;
  algorithm: string;
  type: 'Regression' | 'Anomaly Detection';
  lastTrained: string;
  accuracyMetrics: {
    mae?: number;
    rmse?: number;
    r2Score?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rocAuc?: number;
  };
  totalSamples: number;
  featuresUsed: string[];
  hyperparameters: Record<string, string | number | boolean>;
  featureImportance: { feature: string; importancePct: number }[];
}

export interface Alert {
  id: string;
  timestamp: string;
  endpoint: string;
  alertType: 'High Latency' | 'Error Spike' | 'Unusual Traffic' | 'Endpoint Outage' | 'Isolation Forest Anomaly';
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metricValue: string;
  thresholdValue: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface PerformanceReport {
  id: string;
  type: 'Daily' | 'Weekly' | 'Monthly';
  period: string;
  generatedAt: string;
  summary: {
    totalRequests: number;
    avgLatencyMs: number;
    p50Ms: number;
    p90Ms: number;
    p95Ms: number;
    p99Ms: number;
    errorCount: number;
    errorRatePct: number;
    availabilityPct: number;
    performanceScore: number;
  };
  topDegradingEndpoints: { endpoint: string; avgLatencyMs: number; errorRatePct: number }[];
  anomaliesDetectedCount: number;
  recommendations: string[];
}

export interface EDAMetrics {
  correlationMatrix: { feature1: string; feature2: string; correlation: number }[];
  latencyByHour: { hour: number; avgLatency: number; requestCount: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  concurrencyVsLatency: { concurrency: number; avgLatency: number }[];
}

export interface SystemThresholds {
  latencyWarningMs: number;
  latencyCriticalMs: number;
  errorRateWarningPct: number;
  errorRateCriticalPct: number;
  anomalyScoreThreshold: number;
}
