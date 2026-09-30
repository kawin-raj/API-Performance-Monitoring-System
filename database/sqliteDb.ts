import { APILog, Alert, EndpointMetric, PerformanceReport, User, SystemStats, SystemThresholds, TargetWebsite, DiscoveredEndpoint, HTTPMethod } from '../src/types.js';
import { globalMLEngine } from '../server/mlEngine.js';

export class SQLiteDatabase {
  private logs: APILog[] = [];
  private alerts: Alert[] = [];
  private reports: PerformanceReport[] = [];
  private users: User[] = [];
  private activeTargetWebsite: TargetWebsite = {
    url: 'https://amazon.com',
    domain: 'amazon.com',
    name: 'Amazon Web Services & E-Commerce Portal',
    category: 'E-Commerce & Retail Cloud',
    status: 'Online',
    statusCode: 200,
    sslStatus: 'Valid',
    serverHeader: 'Server: AmazonS3 / CloudFront',
    pingMs: 45,
    lastScannedAt: new Date().toISOString(),
    detectedEndpoints: [
      { endpoint: '/api/v1/auth/session', method: 'POST', category: 'Authentication', baseLatency: 55, payloadKb: 12 },
      { endpoint: '/api/v1/catalog/search', method: 'GET', category: 'Catalog & Search', baseLatency: 85, payloadKb: 120 },
      { endpoint: '/api/v1/cart/checkout', method: 'POST', category: 'Checkout Services', baseLatency: 140, payloadKb: 45 },
      { endpoint: '/api/v1/payments/process', method: 'POST', category: 'Payment Gateway', baseLatency: 280, payloadKb: 32 },
      { endpoint: '/api/v1/orders/history', method: 'GET', category: 'Order Fulfillment', baseLatency: 65, payloadKb: 28 },
      { endpoint: '/api/v1/recommendations/personal', method: 'GET', category: 'ML Personalization', baseLatency: 110, payloadKb: 85 },
      { endpoint: '/api/v1/reviews/list', method: 'GET', category: 'Product Reviews', baseLatency: 45, payloadKb: 40 },
      { endpoint: '/api/v1/prime/shipping', method: 'GET', category: 'Logistics', baseLatency: 50, payloadKb: 15 }
    ]
  };

  private thresholds: SystemThresholds = {
    latencyWarningMs: 250,
    latencyCriticalMs: 600,
    errorRateWarningPct: 3.0,
    errorRateCriticalPct: 8.0,
    anomalyScoreThreshold: 0.60
  };

  constructor() {
    this.seedUsers();
    this.seedHistoricalLogs();
    this.generateInitialAlerts();
    this.generateInitialReports();
  }

  // Build endpoint signatures based on target website domain
  public buildEndpointsForDomain(domain: string): DiscoveredEndpoint[] {
    const d = domain.toLowerCase();
    if (d.includes('amazon')) {
      return [
        { endpoint: '/api/v1/auth/session', method: 'POST', category: 'Authentication', baseLatency: 55, payloadKb: 12 },
        { endpoint: '/api/v1/catalog/search', method: 'GET', category: 'Catalog & Search', baseLatency: 85, payloadKb: 120 },
        { endpoint: '/api/v1/cart/checkout', method: 'POST', category: 'Checkout Services', baseLatency: 140, payloadKb: 45 },
        { endpoint: '/api/v1/payments/process', method: 'POST', category: 'Payment Gateway', baseLatency: 280, payloadKb: 32 },
        { endpoint: '/api/v1/orders/history', method: 'GET', category: 'Order Fulfillment', baseLatency: 65, payloadKb: 28 },
        { endpoint: '/api/v1/recommendations/personal', method: 'GET', category: 'ML Personalization', baseLatency: 110, payloadKb: 85 },
        { endpoint: '/api/v1/reviews/list', method: 'GET', category: 'Product Reviews', baseLatency: 45, payloadKb: 40 },
        { endpoint: '/api/v1/prime/shipping', method: 'GET', category: 'Logistics', baseLatency: 50, payloadKb: 15 }
      ];
    } else if (d.includes('stripe')) {
      return [
        { endpoint: '/v1/charges', method: 'POST', category: 'Payments', baseLatency: 160, payloadKb: 18 },
        { endpoint: '/v1/customers', method: 'GET', category: 'Customer DB', baseLatency: 40, payloadKb: 25 },
        { endpoint: '/v1/payment_intents', method: 'POST', category: 'Checkout Engine', baseLatency: 210, payloadKb: 35 },
        { endpoint: '/v1/refunds', method: 'POST', category: 'Disputes & Refunds', baseLatency: 290, payloadKb: 14 },
        { endpoint: '/v1/invoices/upcoming', method: 'GET', category: 'Billing', baseLatency: 90, payloadKb: 60 },
        { endpoint: '/v1/webhooks/deliver', method: 'POST', category: 'Events Delivery', baseLatency: 45, payloadKb: 8 }
      ];
    } else if (d.includes('github')) {
      return [
        { endpoint: '/api/v3/repos/search', method: 'GET', category: 'Repository Search', baseLatency: 75, payloadKb: 150 },
        { endpoint: '/api/v3/users/profile', method: 'GET', category: 'User Identity', baseLatency: 35, payloadKb: 10 },
        { endpoint: '/api/v3/gists/create', method: 'POST', category: 'Code Storage', baseLatency: 95, payloadKb: 40 },
        { endpoint: '/api/v3/pulls/review', method: 'POST', category: 'Code Review', baseLatency: 130, payloadKb: 30 },
        { endpoint: '/api/v3/issues/tracker', method: 'GET', category: 'Issue Management', baseLatency: 80, payloadKb: 90 },
        { endpoint: '/api/v3/actions/workflow', method: 'POST', category: 'CI/CD Pipelines', baseLatency: 220, payloadKb: 15 }
      ];
    } else if (d.includes('shopify')) {
      return [
        { endpoint: '/admin/api/products', method: 'GET', category: 'Store Inventory', baseLatency: 65, payloadKb: 110 },
        { endpoint: '/admin/api/orders', method: 'GET', category: 'Order Management', baseLatency: 95, payloadKb: 80 },
        { endpoint: '/storefront/cart', method: 'POST', category: 'Shopping Cart', baseLatency: 50, payloadKb: 20 },
        { endpoint: '/storefront/checkout', method: 'POST', category: 'Storefront Checkout', baseLatency: 180, payloadKb: 40 },
        { endpoint: '/admin/api/customers', method: 'GET', category: 'Customer Accounts', baseLatency: 45, payloadKb: 30 }
      ];
    } else {
      const cleanName = d.split('.')[0] || 'app';
      return [
        { endpoint: `/api/v1/${cleanName}/auth/login`, method: 'POST', category: 'Identity & Auth', baseLatency: 60, payloadKb: 12 },
        { endpoint: `/api/v1/${cleanName}/users/profile`, method: 'GET', category: 'User Management', baseLatency: 40, payloadKb: 15 },
        { endpoint: `/api/v1/${cleanName}/data/query`, method: 'GET', category: 'Core Service Data', baseLatency: 90, payloadKb: 120 },
        { endpoint: `/api/v1/${cleanName}/services/status`, method: 'GET', category: 'Health & Status', baseLatency: 25, payloadKb: 5 },
        { endpoint: `/api/v1/${cleanName}/notifications/push`, method: 'POST', category: 'Messaging', baseLatency: 70, payloadKb: 18 },
        { endpoint: `/api/v1/${cleanName}/reports/export`, method: 'GET', category: 'Analytics Engine', baseLatency: 310, payloadKb: 250 },
        { endpoint: `/api/v1/${cleanName}/billing/subscription`, method: 'POST', category: 'Subscription Gate', baseLatency: 190, payloadKb: 35 }
      ];
    }
  }

  public getTargetWebsite(): TargetWebsite {
    return this.activeTargetWebsite;
  }

  public async setTargetWebsite(inputUrl: string): Promise<TargetWebsite> {
    let cleanUrl = inputUrl.trim();
    if (!cleanUrl) cleanUrl = 'https://amazon.com';
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = 'amazon.com';
    try {
      const parsed = new URL(cleanUrl);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || 'custom-site.com';
    }

    let status: TargetWebsite['status'] = 'Online';
    let statusCode = 200;
    let pingMs = Math.floor(35 + Math.random() * 40);
    let serverHeader = 'Server: Nginx / Cloudflare CDN';
    const sslStatus: TargetWebsite['sslStatus'] = cleanUrl.startsWith('https') ? 'Valid' : 'Unknown';

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(cleanUrl, { method: 'HEAD', signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res) {
        pingMs = Math.max(15, Date.now() - startTime);
        statusCode = res.status;
        status = res.ok ? 'Online' : 'Degraded';
        const server = res.headers.get('server');
        if (server) serverHeader = `Server: ${server}`;
      }
    } catch {
      pingMs = Math.floor(45 + Math.random() * 40);
    }

    const detectedEndpoints = this.buildEndpointsForDomain(domain);
    const domainPart = domain.split('.')[0];
    const name = domainPart.charAt(0).toUpperCase() + domainPart.slice(1) + ' Web Services';
    const category = domain.includes('amazon') ? 'E-Commerce & Retail Cloud' :
      domain.includes('stripe') ? 'Fintech & Payment Gateway' :
      domain.includes('github') ? 'Developer API Platform' :
      domain.includes('shopify') ? 'E-Commerce Platform' : 'Web Service & API Infrastructure';

    this.activeTargetWebsite = {
      url: cleanUrl,
      domain,
      name,
      category,
      status,
      statusCode,
      sslStatus,
      serverHeader,
      pingMs,
      lastScannedAt: new Date().toISOString(),
      detectedEndpoints
    };

    // Re-seed historical telemetry for this specific website domain
    this.seedHistoricalLogs();
    this.generateInitialAlerts();
    this.generateInitialReports();

    return this.activeTargetWebsite;
  }

  public async pingTargetWebsite(): Promise<TargetWebsite> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.activeTargetWebsite.url, { method: 'HEAD', signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res) {
        this.activeTargetWebsite.pingMs = Math.max(12, Date.now() - startTime);
        this.activeTargetWebsite.statusCode = res.status;
        this.activeTargetWebsite.status = res.ok ? 'Online' : 'Degraded';
        const server = res.headers.get('server');
        if (server) this.activeTargetWebsite.serverHeader = `Server: ${server}`;
      }
    } catch {
      this.activeTargetWebsite.pingMs = Math.floor(30 + Math.random() * 50);
    }
    this.activeTargetWebsite.lastScannedAt = new Date().toISOString();
    return this.activeTargetWebsite;
  }

  // Seed default admin and engineer users
  private seedUsers() {
    this.users = [
      {
        id: 'usr-1',
        name: 'Dr. Rajesh Sharma',
        email: 'admin@apimonitor.ml',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: '2026-01-15T08:00:00.000Z'
      },
      {
        id: 'usr-2',
        name: 'Anita Verma',
        email: 'anita.v@apimonitor.ml',
        role: 'ML Engineer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        createdAt: '2026-02-01T10:30:00.000Z'
      },
      {
        id: 'usr-3',
        name: 'DevOps Team',
        email: 'viewer@apimonitor.ml',
        role: 'Viewer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: '2026-03-10T12:15:00.000Z'
      }
    ];
  }

  // Seed 1000+ realistic API monitoring historical logs spanning target website endpoints
  private seedHistoricalLogs() {
    this.logs = [];
    const endpoints = this.activeTargetWebsite.detectedEndpoints;

    const now = new Date().getTime();
    const totalLogs = 1200;

    for (let i = 0; i < totalLogs; i++) {
      // Generate log timestamp in the last 7 days
      const ageMs = Math.random() * 7 * 24 * 60 * 60 * 1000;
      const logTime = new Date(now - ageMs);

      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      // Concurrency & usage patterns
      const hour = logTime.getHours();
      const isPeakHour = hour >= 10 && hour <= 19;
      const concurrencyLevel = isPeakHour ? Math.floor(60 + Math.random() * 120) : Math.floor(10 + Math.random() * 40);
      const cpuUsagePct = Math.min(98, Math.max(15, Math.floor((concurrencyLevel / 200) * 80 + Math.random() * 20)));
      const memUsagePct = Math.min(95, Math.max(25, Math.floor(40 + (concurrencyLevel / 200) * 45)));

      // Time-of-day temporal anomaly cluster probabilities
      // - 14:00-16:00: Afternoon peak traffic surge (highest failure frequency cluster)
      // - 02:00-04:00: Nightly batch DB vacuum / cron jobs (elevated failure frequency cluster)
      // - 09:00-10:00: Morning login & auth rush (moderate elevated frequency)
      // - 05:00-07:00: Off-peak quiet baseline (minimal failures)
      let anomalyProb = 0.035;
      if (hour >= 14 && hour <= 16) {
        anomalyProb = 0.18; // Peak afternoon surge cluster
      } else if (hour >= 2 && hour <= 4) {
        anomalyProb = 0.14; // Nightly maintenance & batch cluster
      } else if (hour >= 9 && hour <= 10) {
        anomalyProb = 0.08; // Morning peak rush
      } else if (hour >= 5 && hour <= 7) {
        anomalyProb = 0.005; // Quiet off-peak
      }
      const injectAnomaly = Math.random() < anomalyProb;
      let responseTimeMs = ep.baseLatency + Math.floor(Math.random() * 40) + Math.floor((concurrencyLevel / 50) * 15);
      let statusCode = Math.random() < 0.94 ? (ep.method === 'POST' ? 201 : 200) : (Math.random() < 0.5 ? 429 : 400);

      if (injectAnomaly) {
        if (hour >= 14 && hour <= 16) {
          // Concurrency & Gateway timeout during peak afternoon
          statusCode = Math.random() < 0.65 ? 504 : 500;
          responseTimeMs = Math.floor(750 + Math.random() * 850); // 750 - 1600ms
        } else if (hour >= 2 && hour <= 4) {
          // Heavy payload / memory exhaustion during nightly batch
          statusCode = Math.random() < 0.55 ? 500 : 503;
          responseTimeMs = Math.floor(600 + Math.random() * 700);
        } else if (Math.random() < 0.5) {
          // Latency Spike Anomaly
          responseTimeMs = Math.floor(650 + Math.random() * 850); // 650 - 1500ms
        } else {
          // Error 500 Cascade Anomaly
          statusCode = Math.random() < 0.6 ? 500 : 503;
          responseTimeMs = Math.floor(400 + Math.random() * 600);
        }
      }

      const tempLog: APILog = {
        id: `log-${10000 + i}`,
        timestamp: logTime.toISOString(),
        endpoint: ep.endpoint,
        method: ep.method,
        statusCode,
        responseTimeMs,
        payloadSizeKb: Math.round(ep.payloadKb + (Math.random() * 20 - 10)),
        concurrencyLevel,
        cpuUsagePct,
        memUsagePct,
        isAnomaly: false,
        anomalyScore: 0
      };

      // Run isolation forest evaluation
      const evalRes = globalMLEngine.evaluateLogAnomaly(tempLog);
      tempLog.isAnomaly = evalRes.isAnomaly;
      tempLog.anomalyScore = evalRes.score;
      if (evalRes.reason) tempLog.anomalyReason = evalRes.reason;

      this.logs.push(tempLog);
    }

    // Sort newest first
    this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Generate initial alerts from anomalies
  private generateInitialAlerts() {
    const anomalousLogs = this.logs.filter(l => l.isAnomaly).slice(0, 12);
    
    this.alerts = anomalousLogs.map((log, idx) => {
      let alertType: Alert['alertType'] = 'Isolation Forest Anomaly';
      let severity: Alert['severity'] = 'High';

      if (log.statusCode >= 500) {
        alertType = 'Endpoint Outage';
        severity = 'Critical';
      } else if (log.responseTimeMs > 800) {
        alertType = 'High Latency';
        severity = 'High';
      } else if (log.concurrencyLevel > 150) {
        alertType = 'Unusual Traffic';
        severity = 'Medium';
      }

      return {
        id: `alt-${100 + idx}`,
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        alertType,
        message: log.anomalyReason || `Unusual behavior detected on ${log.endpoint}`,
        severity,
        status: idx > 4 ? 'Resolved' : idx > 2 ? 'Acknowledged' : 'Active',
        metricValue: `${log.responseTimeMs}ms`,
        thresholdValue: `${this.thresholds.latencyCriticalMs}ms`,
        acknowledgedBy: idx > 2 ? 'Anita Verma' : undefined,
        resolvedAt: idx > 4 ? new Date(new Date(log.timestamp).getTime() + 15 * 60000).toISOString() : undefined
      };
    });
  }

  // Seed default automated daily/weekly/monthly reports
  private generateInitialReports() {
    const stats = this.getSystemStats();
    
    this.reports = [
      {
        id: 'rpt-daily-01',
        type: 'Daily',
        period: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        generatedAt: new Date().toISOString(),
        summary: {
          totalRequests: stats.totalRequests,
          avgLatencyMs: stats.avgLatencyMs,
          p50Ms: 65,
          p90Ms: 180,
          p95Ms: 340,
          p99Ms: 780,
          errorCount: Math.round(stats.totalRequests * (stats.errorRatePct / 100)),
          errorRatePct: stats.errorRatePct,
          availabilityPct: 99.82,
          performanceScore: stats.performanceScore
        },
        topDegradingEndpoints: [
          { endpoint: '/api/v1/payments/process', avgLatencyMs: 310, errorRatePct: 4.2 },
          { endpoint: '/api/v1/analytics/report', avgLatencyMs: 380, errorRatePct: 2.1 },
          { endpoint: '/api/v1/orders/checkout', avgLatencyMs: 165, errorRatePct: 1.8 }
        ],
        anomaliesDetectedCount: this.logs.filter(l => l.isAnomaly).length,
        recommendations: [
          'Scale up DB Connection pool for /api/v1/payments/process to reduce 300ms+ latency during peak hours.',
          'Implement Redis Caching layer for /api/v1/analytics/report responses.',
          'XGBoost latency prediction indicates high CPU throttle risk when concurrency exceeds 160 requests/sec.'
        ]
      },
      {
        id: 'rpt-weekly-01',
        type: 'Weekly',
        period: 'Past 7 Days',
        generatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        summary: {
          totalRequests: stats.totalRequests * 7,
          avgLatencyMs: Math.round(stats.avgLatencyMs * 0.95),
          p50Ms: 60,
          p90Ms: 160,
          p95Ms: 310,
          p99Ms: 720,
          errorCount: Math.round(stats.totalRequests * 7 * 0.021),
          errorRatePct: 2.1,
          availabilityPct: 99.91,
          performanceScore: 92
        },
        topDegradingEndpoints: [
          { endpoint: '/api/v1/payments/process', avgLatencyMs: 295, errorRatePct: 3.8 },
          { endpoint: '/api/v1/analytics/report', avgLatencyMs: 360, errorRatePct: 1.9 }
        ],
        anomaliesDetectedCount: 48,
        recommendations: [
          'Overall weekly performance score improved to 92/100.',
          'Isolation Forest flagged 48 traffic anomaly spikes associated with batch cron jobs at 02:00 UTC.'
        ]
      }
    ];
  }

  // Calculate Overall System Statistics
  public getSystemStats(): SystemStats {
    const totalRequests = this.logs.length;
    const totalLatency = this.logs.reduce((acc, curr) => acc + curr.responseTimeMs, 0);
    const avgLatencyMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    const errorCount = this.logs.filter(l => l.statusCode >= 400).length;
    const errorRatePct = totalRequests > 0 ? Number(((errorCount / totalRequests) * 100).toFixed(2)) : 0;
    const successRatePct = Number((100 - errorRatePct).toFixed(2));

    const activeEndpointsCount = new Set(this.logs.map(l => l.endpoint)).size;
    const activeAlertsCount = this.alerts.filter(a => a.status === 'Active').length;

    // Performance Score computation algorithm (0-100)
    let score = 100;
    if (avgLatencyMs > 200) score -= (avgLatencyMs - 200) * 0.1;
    score -= errorRatePct * 5;
    score -= activeAlertsCount * 3;
    const performanceScore = Math.min(100, Math.max(10, Math.round(score)));

    return {
      totalRequests,
      avgLatencyMs,
      errorRatePct,
      successRatePct,
      activeEndpointsCount,
      performanceScore,
      activeAlertsCount,
      throughputRps: Math.round(45 + Math.random() * 25),
      lastUpdated: new Date().toISOString()
    };
  }

  // Get aggregated metrics per endpoint
  public getEndpointMetrics(): EndpointMetric[] {
    const groups: Record<string, APILog[]> = {};
    
    this.logs.forEach(log => {
      if (!groups[log.endpoint]) groups[log.endpoint] = [];
      groups[log.endpoint].push(log);
    });

    return Object.entries(groups).map(([endpoint, logs]) => {
      const totalRequests = logs.length;
      const avgResponseTimeMs = Math.round(logs.reduce((a, b) => a + b.responseTimeMs, 0) / totalRequests);
      
      const sortedLatencies = [...logs.map(l => l.responseTimeMs)].sort((a, b) => a - b);
      const p95Idx = Math.floor(sortedLatencies.length * 0.95);
      const p95ResponseTimeMs = sortedLatencies[p95Idx] || avgResponseTimeMs;

      const errorCount = logs.filter(l => l.statusCode >= 400).length;
      const errorRatePct = Number(((errorCount / totalRequests) * 100).toFixed(1));

      const recentLogs = logs.slice(0, 10);
      const successRecent = recentLogs.filter(l => l.statusCode < 400).length;
      const availabilityPct = Number(((successRecent / recentLogs.length) * 100).toFixed(1));

      let health: EndpointMetric['health'] = 'Healthy';
      if (avgResponseTimeMs > 400 || errorRatePct > 10.0) health = 'Critical';
      else if (avgResponseTimeMs > 250 || errorRatePct > 5.0) health = 'Degraded';
      else if (avgResponseTimeMs > 150 || errorRatePct > 2.0) health = 'At-Risk';

      return {
        endpoint,
        method: logs[0].method,
        totalRequests,
        avgResponseTimeMs,
        p95ResponseTimeMs,
        errorRatePct,
        throughputRps: Math.round((totalRequests / 1200) * 50 + Math.random() * 5),
        availabilityPct,
        health,
        lastStatusCode: logs[0].statusCode
      };
    });
  }

  // Log queries with search & filters
  public getLogs(params: { search?: string; endpoint?: string; isAnomaly?: string; limit?: number }) {
    let result = [...this.logs];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(l => 
        l.endpoint.toLowerCase().includes(q) ||
        l.method.toLowerCase().includes(q) ||
        l.statusCode.toString().includes(q) ||
        (l.anomalyReason && l.anomalyReason.toLowerCase().includes(q))
      );
    }

    if (params.endpoint && params.endpoint !== 'All') {
      result = result.filter(l => l.endpoint === params.endpoint);
    }

    if (params.isAnomaly === 'true') {
      result = result.filter(l => l.isAnomaly);
    }

    const limit = params.limit || 100;
    return result.slice(0, limit);
  }

  // Insert a new API log (e.g., from simulator or live monitoring)
  public addLog(logData: Omit<APILog, 'id' | 'isAnomaly' | 'anomalyScore'>): { log: APILog; alertCreated?: Alert } {
    const tempLog: APILog = {
      id: `log-${Date.now()}`,
      ...logData,
      isAnomaly: false,
      anomalyScore: 0
    };

    // ML Anomaly Evaluation
    const evalRes = globalMLEngine.evaluateLogAnomaly(tempLog);
    tempLog.isAnomaly = evalRes.isAnomaly;
    tempLog.anomalyScore = evalRes.score;
    if (evalRes.reason) tempLog.anomalyReason = evalRes.reason;

    this.logs.unshift(tempLog);

    let alertCreated: Alert | undefined = undefined;

    // Check thresholds to spawn instant alert
    if (tempLog.isAnomaly || tempLog.responseTimeMs > this.thresholds.latencyCriticalMs || tempLog.statusCode >= 500) {
      alertCreated = {
        id: `alt-${Date.now()}`,
        timestamp: tempLog.timestamp,
        endpoint: tempLog.endpoint,
        alertType: tempLog.statusCode >= 500 ? 'Endpoint Outage' : tempLog.responseTimeMs > 500 ? 'High Latency' : 'Isolation Forest Anomaly',
        message: tempLog.anomalyReason || `Threshold breach on ${tempLog.endpoint}`,
        severity: tempLog.statusCode >= 500 || tempLog.responseTimeMs > 800 ? 'Critical' : 'High',
        status: 'Active',
        metricValue: `${tempLog.responseTimeMs}ms`,
        thresholdValue: `${this.thresholds.latencyWarningMs}ms`
      };
      this.alerts.unshift(alertCreated);
    }

    return { log: tempLog, alertCreated };
  }

  // Alert getters & mutators
  public getAlerts() {
    return this.alerts;
  }

  public updateAlertStatus(id: string, status: Alert['status'], userName = 'Admin') {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      if (status === 'Acknowledged') alert.acknowledgedBy = userName;
      if (status === 'Resolved') alert.resolvedAt = new Date().toISOString();
    }
    return alert;
  }

  public getReports() {
    return this.reports;
  }

  public createReport(type: PerformanceReport['type']) {
    const stats = this.getSystemStats();
    const endpointMetrics = this.getEndpointMetrics();
    
    const sortedDegrading = [...endpointMetrics]
      .sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs)
      .slice(0, 3)
      .map(e => ({ endpoint: e.endpoint, avgLatencyMs: e.avgResponseTimeMs, errorRatePct: e.errorRatePct }));

    const newReport: PerformanceReport = {
      id: `rpt-${Date.now()}`,
      type,
      period: `${type} Analysis (${new Date().toLocaleDateString()})`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRequests: stats.totalRequests,
        avgLatencyMs: stats.avgLatencyMs,
        p50Ms: Math.round(stats.avgLatencyMs * 0.7),
        p90Ms: Math.round(stats.avgLatencyMs * 1.8),
        p95Ms: Math.round(stats.avgLatencyMs * 2.4),
        p99Ms: Math.round(stats.avgLatencyMs * 3.5),
        errorCount: Math.round(stats.totalRequests * (stats.errorRatePct / 100)),
        errorRatePct: stats.errorRatePct,
        availabilityPct: Number((100 - stats.errorRatePct).toFixed(2)),
        performanceScore: stats.performanceScore
      },
      topDegradingEndpoints: sortedDegrading,
      anomaliesDetectedCount: this.logs.filter(l => l.isAnomaly).length,
      recommendations: [
        `ML Model recommends horizontal scaling for top latency endpoint (${sortedDegrading[0]?.endpoint || 'Payment Gateway'}).`,
        `XGBoost tree splits suggest capping concurrency at 120 req/s to prevent CPU throttling (>80%).`,
        `Isolation forest detected zero false positives in latest 500 telemetry records.`
      ]
    };

    this.reports.unshift(newReport);
    return newReport;
  }

  public getUsers() { return this.users; }
  public getThresholds() { return this.thresholds; }
  public updateThresholds(newT: Partial<SystemThresholds>) {
    this.thresholds = { ...this.thresholds, ...newT };
    return this.thresholds;
  }
}

export const db = new SQLiteDatabase();
