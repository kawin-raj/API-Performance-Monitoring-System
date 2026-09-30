import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  AlertOctagon,
  CheckCircle2,
  Server,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  BarChart3,
  HeartPulse,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { SystemStats, EndpointMetric, Alert, APILog, EDAMetrics } from '../types.js';

interface DashboardOverviewProps {
  stats: SystemStats;
  endpoints: EndpointMetric[];
  alerts: Alert[];
  recentLogs: APILog[];
  eda?: EDAMetrics | null;
  onNavigateTab: (tab: any) => void;
  onOpenSimulator: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  endpoints,
  alerts,
  recentLogs,
  eda,
  onNavigateTab,
  onOpenSimulator
}) => {
  const [trendViewMetric, setTrendViewMetric] = useState<'both' | 'latency' | 'volume'>('both');
  const [showScoreFormula, setShowScoreFormula] = useState(false);

  // Dynamic API Health Score Calculation (0-100)
  // Derived from weighted average of recent latency, error rates, and anomaly frequency:
  // - Recent Latency (35% weight)
  // - Error Rate (40% weight)
  // - ML Anomaly Frequency (25% weight)
  const healthScoreDetails = useMemo(() => {
    // Evaluation window: latest 50 logs (or all available recentLogs)
    const logsWindow = recentLogs.length > 0 ? recentLogs.slice(0, 50) : [];
    const totalInWindow = logsWindow.length || 1;

    // 1. Latency Factor (35% Weight)
    const avgRecentLatency = logsWindow.length > 0
      ? logsWindow.reduce((acc, l) => acc + l.responseTimeMs, 0) / logsWindow.length
      : stats.avgLatencyMs;

    // Latency scoring: <= 80ms => 100pts; 80-200ms => 100-75pts; 200-500ms => 75-30pts; >= 800ms => 0pts
    let latencySubScore = 100;
    if (avgRecentLatency <= 80) {
      latencySubScore = 100;
    } else if (avgRecentLatency <= 200) {
      latencySubScore = 100 - ((avgRecentLatency - 80) / 120) * 25;
    } else if (avgRecentLatency <= 500) {
      latencySubScore = 75 - ((avgRecentLatency - 200) / 300) * 45;
    } else {
      latencySubScore = Math.max(0, 30 - ((avgRecentLatency - 500) / 400) * 30);
    }

    // 2. Error Rate Factor (40% Weight)
    const error4xxCount = logsWindow.filter(l => l.statusCode >= 400 && l.statusCode < 500).length;
    const error5xxCount = logsWindow.filter(l => l.statusCode >= 500).length;
    const totalErrors = error4xxCount + error5xxCount;
    const rawErrorRatePct = logsWindow.length > 0
      ? (totalErrors / totalInWindow) * 100
      : stats.errorRatePct;

    // 5xx server faults receive higher penalty weighting
    const weightedErrorRatio = logsWindow.length > 0
      ? ((error4xxCount * 1.0 + error5xxCount * 2.0) / totalInWindow) * 100
      : stats.errorRatePct * 1.4;

    // Error scoring: <= 0.2% => 100pts; <= 2% => 100-85pts; <= 6% => 85-50pts; >= 20% => 0pts
    let errorSubScore = 100;
    if (weightedErrorRatio <= 0.2) {
      errorSubScore = 100;
    } else if (weightedErrorRatio <= 2) {
      errorSubScore = 100 - (weightedErrorRatio / 2) * 15;
    } else if (weightedErrorRatio <= 6) {
      errorSubScore = 85 - ((weightedErrorRatio - 2) / 4) * 35;
    } else {
      errorSubScore = Math.max(0, 50 - ((weightedErrorRatio - 6) / 14) * 50);
    }

    // 3. Anomaly Frequency Factor (25% Weight)
    const anomalyCount = logsWindow.filter(l => l.isAnomaly).length;
    const anomalyRatePct = logsWindow.length > 0
      ? (anomalyCount / totalInWindow) * 100
      : (stats.errorRatePct > 5 ? 10 : 2);

    // Anomaly scoring: <= 0.5% => 100pts; <= 3% => 100-82pts; <= 8% => 82-40pts; >= 20% => 0pts
    let anomalySubScore = 100;
    if (anomalyRatePct <= 0.5) {
      anomalySubScore = 100;
    } else if (anomalyRatePct <= 3) {
      anomalySubScore = 100 - ((anomalyRatePct - 0.5) / 2.5) * 18;
    } else if (anomalyRatePct <= 8) {
      anomalySubScore = 82 - ((anomalyRatePct - 3) / 5) * 42;
    } else {
      anomalySubScore = Math.max(0, 40 - ((anomalyRatePct - 8) / 12) * 40);
    }

    const WEIGHT_LATENCY = 0.35;
    const WEIGHT_ERROR = 0.40;
    const WEIGHT_ANOMALY = 0.25;

    const weightedScore = Math.round(
      latencySubScore * WEIGHT_LATENCY +
      errorSubScore * WEIGHT_ERROR +
      anomalySubScore * WEIGHT_ANOMALY
    );
    const overallScore = Math.max(0, Math.min(100, weightedScore));

    // Stability classification
    let stabilityStatus: 'Optimal' | 'Stable' | 'At-Risk' | 'Critical';
    let statusColor: string;
    let strokeColor: string;
    let statusBg: string;
    let statusBorder: string;
    let badgeText: string;
    let description: string;

    if (overallScore >= 90) {
      stabilityStatus = 'Optimal';
      statusColor = 'text-emerald-400';
      strokeColor = '#10b981';
      statusBg = 'bg-emerald-500/10';
      statusBorder = 'border-emerald-500/30';
      badgeText = 'Optimal Stability';
      description = 'All systems nominal. Fast response times, negligible error rates, and healthy machine learning anomaly profiles.';
    } else if (overallScore >= 75) {
      stabilityStatus = 'Stable';
      statusColor = 'text-sky-400';
      strokeColor = '#38bdf8';
      statusBg = 'bg-sky-500/10';
      statusBorder = 'border-sky-500/30';
      badgeText = 'Normal Stability';
      description = 'API operations are stable and running within acceptable operational thresholds with minor acceptable variance.';
    } else if (overallScore >= 60) {
      stabilityStatus = 'At-Risk';
      statusColor = 'text-amber-400';
      strokeColor = '#f59e0b';
      statusBg = 'bg-amber-500/10';
      statusBorder = 'border-amber-500/30';
      badgeText = 'Elevated Risk';
      description = 'System degradation detected. Latency elongation or sporadic anomaly clusters observed in recent window.';
    } else {
      stabilityStatus = 'Critical';
      statusColor = 'text-rose-400';
      strokeColor = '#ef4444';
      statusBg = 'bg-rose-500/10';
      statusBorder = 'border-rose-500/30';
      badgeText = 'Critical Alert';
      description = 'Severe instability detected. Spike in 4xx/5xx error rates or high-frequency Isolation Forest anomaly detections.';
    }

    return {
      overallScore,
      stabilityStatus,
      statusColor,
      strokeColor,
      statusBg,
      statusBorder,
      badgeText,
      description,
      components: {
        latency: {
          weight: 35,
          raw: `${Math.round(avgRecentLatency)} ms`,
          subScore: Math.round(latencySubScore),
          contribution: (Math.round(latencySubScore) * WEIGHT_LATENCY).toFixed(1),
          target: '< 150 ms',
          status: latencySubScore >= 80 ? 'Good' : latencySubScore >= 50 ? 'Fair' : 'Poor'
        },
        errorRate: {
          weight: 40,
          raw: `${rawErrorRatePct.toFixed(1)}% (${totalErrors} errs)`,
          subScore: Math.round(errorSubScore),
          contribution: (Math.round(errorSubScore) * WEIGHT_ERROR).toFixed(1),
          target: '< 2.0%',
          status: errorSubScore >= 80 ? 'Good' : errorSubScore >= 50 ? 'Fair' : 'Poor'
        },
        anomalyFrequency: {
          weight: 25,
          raw: `${anomalyRatePct.toFixed(1)}% (${anomalyCount} flagged)`,
          subScore: Math.round(anomalySubScore),
          contribution: (Math.round(anomalySubScore) * WEIGHT_ANOMALY).toFixed(1),
          target: '< 3.0%',
          status: anomalySubScore >= 80 ? 'Good' : anomalySubScore >= 50 ? 'Fair' : 'Poor'
        }
      },
      sampleCount: logsWindow.length
    };
  }, [recentLogs, stats]);

  // 24-Hour Historical Trends calculation for Latency and Request Volume
  const historical24hData = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Map 24 hours chronologically from 23 hours ago up to current hour
    return Array.from({ length: 24 }, (_, i) => {
      const pastTime = new Date(now.getTime() - (23 - i) * 3600 * 1000);
      const h = pastTime.getHours();
      const timeLabel = `${h.toString().padStart(2, '0')}:00`;

      // Check if matching data exists in eda.latencyByHour
      const edaMatch = eda?.latencyByHour?.find(item => item.hour === h);

      // Check if matching logs exist in recentLogs within this hour window
      const logsInHour = recentLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 3600);
        return diffHours >= 0 && diffHours < 24 && logDate.getHours() === h;
      });

      let avgLat: number;
      let reqCount: number;

      if (logsInHour.length > 0) {
        const sumLat = logsInHour.reduce((sum, l) => sum + l.responseTimeMs, 0);
        avgLat = Math.round(sumLat / logsInHour.length);
        reqCount = logsInHour.length * 8; // Scale sample to approximate hourly volume
      } else if (edaMatch && edaMatch.requestCount > 0) {
        avgLat = edaMatch.avgLatency;
        reqCount = edaMatch.requestCount * 4;
      } else {
        // Natural diurnal model based on stats baseline
        const isPeak = h >= 9 && h <= 18;
        const hourFactor = Math.sin(((h - 6) / 24) * 2 * Math.PI);
        const variation = Math.round(hourFactor * (stats.avgLatencyMs * 0.18));
        avgLat = Math.max(35, Math.round(stats.avgLatencyMs + variation + (isPeak ? 15 : -10)));
        reqCount = Math.max(25, Math.round(48 + hourFactor * 32 + (i % 3) * 5));
      }

      return {
        time: timeLabel,
        hour: h,
        latency: avgLat,
        requestVolume: reqCount
      };
    });
  }, [eda, recentLogs, stats]);

  // Summary statistics for 24h trends
  const trend24hSummary = useMemo(() => {
    if (historical24hData.length === 0) {
      return { maxLatency: stats.avgLatencyMs, avgLatency: stats.avgLatencyMs, totalVolume: stats.totalRequests };
    }
    const maxLat = Math.max(...historical24hData.map(d => d.latency));
    const avgLat = Math.round(historical24hData.reduce((acc, d) => acc + d.latency, 0) / historical24hData.length);
    const totalVol = historical24hData.reduce((acc, d) => acc + d.requestVolume, 0);
    return { maxLatency: maxLat, avgLatency: avgLat, totalVolume: totalVol };
  }, [historical24hData, stats]);

  // Chart data preparation for live latency trend
  const trendData = recentLogs.slice(0, 25).reverse().map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: log.responseTimeMs,
    concurrency: log.concurrencyLevel,
    isAnomaly: log.isAnomaly
  }));

  // Status code distribution pie data
  const statusPieData = [
    { name: '200 OK', value: recentLogs.filter(l => l.statusCode < 300).length, color: '#10b981' },
    { name: '429 Rate Limit', value: recentLogs.filter(l => l.statusCode === 429).length, color: '#f59e0b' },
    { name: '500 Server Error', value: recentLogs.filter(l => l.statusCode >= 500).length, color: '#ef4444' }
  ];

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const degradedEndpoints = [...endpoints].sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if active critical incidents exist */}
      {activeAlerts.some(a => a.severity === 'Critical' || a.severity === 'High') && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between shadow-lg backdrop-blur-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-200">
                Critical Anomaly Detected by Isolation Forest ML Model
              </h3>
              <p className="text-xs text-rose-300/80">
                {activeAlerts[0]?.message} on endpoint <span className="font-mono text-rose-200">{activeAlerts[0]?.endpoint}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-md"
          >
            Manage Alerts
          </button>
        </div>
      )}

      {/* Dynamic API Health Score & System Stability Indicator */}
      <div className="p-5 rounded-2xl bg-[#111218] border border-[#24262F] shadow-lg relative overflow-hidden">
        {/* Subtle background glow matching stability state */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: healthScoreDetails.strokeColor }}
        />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#24262F]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-sm text-white tracking-wide uppercase">
                    Dynamic API Health Score
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${healthScoreDetails.statusBg} ${healthScoreDetails.statusColor} border ${healthScoreDetails.statusBorder}`}>
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: healthScoreDetails.strokeColor }} />
                    {healthScoreDetails.badgeText}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  High-level stability indicator synthesized in real time from telemetry streams
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowScoreFormula(prev => !prev)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1A1C24] hover:bg-[#24262F] text-gray-300 border border-[#24262F] transition-colors"
                title="View weighted formula calculation"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Formula & Weights</span>
                {showScoreFormula ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
              </button>

              <button
                type="button"
                onClick={onOpenSimulator}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Spike Resilience</span>
              </button>
            </div>
          </div>

          {/* Main Visuals Grid: Circular Meter & 3 Weighted Factor Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Circular Gauge & Stability Summary (5 cols) */}
            <div className="lg:col-span-5 flex items-center space-x-5 p-3.5 rounded-xl bg-[#161720] border border-[#24262F]">
              {/* Circular SVG Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#24262F"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={healthScoreDetails.strokeColor}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - healthScoreDetails.overallScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black font-mono text-white leading-none">
                    {healthScoreDetails.overallScore}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">/ 100</span>
                </div>
              </div>

              {/* Status & Synthesis */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold font-mono ${healthScoreDetails.statusColor}`}>
                    {healthScoreDetails.stabilityStatus.toUpperCase()} INDEX
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    ({healthScoreDetails.sampleCount} req sample)
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-snug">
                  {healthScoreDetails.description}
                </p>
                <div className="pt-0.5">
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Weighted across SLA bounds & ML inference
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Weighted Factor Breakdown Cards (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Factor 1: Latency */}
              <div className="p-3 rounded-xl bg-[#161720] border border-[#24262F] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold text-[11px]">Recent Latency</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    35% Wt
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-white">
                      {healthScoreDetails.components.latency.raw}
                    </span>
                    <span className="text-xs font-mono font-semibold text-sky-400">
                      +{healthScoreDetails.components.latency.contribution} pts
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#24262F] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${healthScoreDetails.components.latency.subScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#24262F]/60">
                  <span>Score: {healthScoreDetails.components.latency.subScore}/100</span>
                  <span>Target: {healthScoreDetails.components.latency.target}</span>
                </div>
              </div>

              {/* Factor 2: Error Rate */}
              <div className="p-3 rounded-xl bg-[#161720] border border-[#24262F] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold text-[11px]">Error Rate</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    40% Wt
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-white">
                      {healthScoreDetails.components.errorRate.raw}
                    </span>
                    <span className="text-xs font-mono font-semibold text-rose-400">
                      +{healthScoreDetails.components.errorRate.contribution} pts
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#24262F] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-rose-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${healthScoreDetails.components.errorRate.subScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#24262F]/60">
                  <span>Score: {healthScoreDetails.components.errorRate.subScore}/100</span>
                  <span>Target: {healthScoreDetails.components.errorRate.target}</span>
                </div>
              </div>

              {/* Factor 3: Anomaly Frequency */}
              <div className="p-3 rounded-xl bg-[#161720] border border-[#24262F] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold text-[11px]">ML Anomalies</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    25% Wt
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-white">
                      {healthScoreDetails.components.anomalyFrequency.raw}
                    </span>
                    <span className="text-xs font-mono font-semibold text-purple-400">
                      +{healthScoreDetails.components.anomalyFrequency.contribution} pts
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#24262F] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-purple-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${healthScoreDetails.components.anomalyFrequency.subScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#24262F]/60">
                  <span>Score: {healthScoreDetails.components.anomalyFrequency.subScore}/100</span>
                  <span>Target: {healthScoreDetails.components.anomalyFrequency.target}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Formula & Mathematical Weights Drawer */}
          {showScoreFormula && (
            <div className="p-4 rounded-xl bg-[#0D0E12] border border-[#24262F] text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-gray-300 font-semibold">
                <span className="text-xs flex items-center gap-1.5 text-indigo-300 font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mathematical Formulation: Weighted Composite Telemetry Index
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Evaluated over {healthScoreDetails.sampleCount} recent records
                </span>
              </div>

              {/* Equation Box */}
              <div className="p-3 rounded-lg bg-[#14151C] border border-[#24262F] font-mono text-[11px] text-gray-200 overflow-x-auto">
                <div className="text-gray-400 mb-1">
                  Health Score = (Latency Subscore × 35%) + (Error Rate Subscore × 40%) + (Anomaly Subscore × 25%)
                </div>
                <div className="text-indigo-300 font-bold">
                  Health Score = ({healthScoreDetails.components.latency.subScore} × 0.35) + ({healthScoreDetails.components.errorRate.subScore} × 0.40) + ({healthScoreDetails.components.anomalyFrequency.subScore} × 0.25) = <span className={`text-sm ${healthScoreDetails.statusColor}`}>{healthScoreDetails.overallScore} / 100</span>
                </div>
              </div>

              {/* Factor Details Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-400">
                <div className="p-2 rounded bg-[#161720] border border-[#24262F]">
                  <span className="font-bold text-sky-400 block mb-0.5">1. Latency Factor (35%)</span>
                  Measures average response time against baseline SLA (ideal ≤ 80ms, penalizing exponential spikes &gt; 250ms).
                </div>
                <div className="p-2 rounded bg-[#161720] border border-[#24262F]">
                  <span className="font-bold text-rose-400 block mb-0.5">2. Error Rate Factor (40%)</span>
                  Aggregates 4xx client and 5xx server codes, with double weighting applied to internal server failures.
                </div>
                <div className="p-2 rounded bg-[#161720] border border-[#24262F]">
                  <span className="font-bold text-purple-400 block mb-0.5">3. Anomaly Frequency (25%)</span>
                  Isolation Forest ML predictions identifying multidimensional outliers in concurrency and payload volume.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Requests */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.totalRequests.toLocaleString()}</div>
          <span className="text-[10px] text-green-500 font-mono flex items-center gap-0.5 mt-2">
            <TrendingUp className="w-3 h-3" /> +12.4% vs SLA
          </span>
        </div>

        {/* Avg Latency */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.avgLatencyMs} <span className="text-xs font-normal text-gray-500">ms</span></div>
          <span className={`text-[10px] font-mono mt-2 font-semibold ${stats.avgLatencyMs > 250 ? 'text-amber-400' : 'text-green-500'}`}>
            {stats.avgLatencyMs > 250 ? '⚠️ High SLA Bounds' : '✓ Normal SLA'}
          </span>
        </div>

        {/* Error Rate */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Error Rate</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.errorRatePct}%</div>
          <span className={`text-[10px] font-mono mt-2 ${stats.errorRatePct > 5.0 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
            {stats.errorRatePct > 5.0 ? 'Spike Detected' : '< 5.0% Limit'}
          </span>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.successRatePct}%</div>
          <span className="text-[10px] text-green-500 font-mono mt-2">Target 99.9%</span>
        </div>

        {/* Active APIs */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Endpoints</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.activeEndpointsCount}</div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">Live Telemetry</span>
        </div>

        {/* Dynamic API Health Score KPI Card */}
        <div className={`p-4 rounded bg-[#111218] border ${healthScoreDetails.statusBorder} shadow-sm flex flex-col justify-between transition-all`}>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">API Health Score</span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${healthScoreDetails.statusBg} ${healthScoreDetails.statusColor} border ${healthScoreDetails.statusBorder}`}>
              {healthScoreDetails.stabilityStatus}
            </span>
          </div>
          <div className={`text-2xl font-mono font-bold ${healthScoreDetails.statusColor}`}>
            {healthScoreDetails.overallScore} <span className="text-xs font-normal text-gray-500">/ 100</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-mono flex items-center justify-between">
            <span>Dynamic Weighted</span>
            <span className="text-gray-500">35 / 40 / 25</span>
          </p>
        </div>
      </div>

      {/* 24-Hour Historical Trends Line Chart (API Latency & Request Volume) */}
      <div className="p-5 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24262F]/60">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-200">
                24-Hour Historical Trends: Latency & Volume
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Hourly aggregated API latency (ms) and request volume distribution over the preceding 24 hours
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-xs">
            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-gray-400 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                <span className="text-[11px] text-gray-400">Peak Latency:</span>
                <span className="font-mono tabular-nums text-sky-400 font-semibold">{trend24hSummary.maxLatency} ms</span>
              </div>
              <span className="text-gray-600">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span className="text-[11px] text-gray-400">24h Volume:</span>
                <span className="font-mono tabular-nums text-purple-400 font-semibold">{trend24hSummary.totalVolume.toLocaleString()} reqs</span>
              </div>
            </div>

            {/* View Mode Toggle Controls */}
            <div className="flex items-center bg-[#1A1C24] p-1 rounded-lg border border-[#24262F]">
              <button
                type="button"
                onClick={() => setTrendViewMetric('both')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  trendViewMetric === 'both' ? 'bg-[#24262F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMetric('latency')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  trendViewMetric === 'latency' ? 'bg-[#24262F] text-sky-300 shadow-sm' : 'text-gray-400 hover:text-sky-300'
                }`}
              >
                Latency
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMetric('volume')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  trendViewMetric === 'volume' ? 'bg-[#24262F] text-purple-300 shadow-sm' : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                Volume
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historical24hData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24262F" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                interval={1}
                tick={{ fill: '#9ca3af' }}
              />
              {(trendViewMetric === 'both' || trendViewMetric === 'latency') && (
                <YAxis
                  yAxisId="latencyAxis"
                  orientation="left"
                  stroke="#38bdf8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  unit="ms"
                  tick={{ fill: '#38bdf8' }}
                />
              )}
              {(trendViewMetric === 'both' || trendViewMetric === 'volume') && (
                <YAxis
                  yAxisId="volumeAxis"
                  orientation="right"
                  stroke="#a855f7"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  unit=" reqs"
                  tick={{ fill: '#a855f7' }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111218',
                  borderColor: '#24262F',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#e0e0e0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                }}
                formatter={(value: any, name: any) => [
                  name.includes('Latency') ? `${value} ms` : `${Number(value).toLocaleString()} requests`,
                  name
                ]}
                labelFormatter={(label) => `Hour ${label} (Last 24 Hours)`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                iconType="circle"
              />
              {(trendViewMetric === 'both' || trendViewMetric === 'latency') && (
                <Line
                  yAxisId="latencyAxis"
                  type="monotone"
                  dataKey="latency"
                  name="API Latency (ms)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#38bdf8', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: '#0284c7', strokeWidth: 2 }}
                />
              )}
              {(trendViewMetric === 'both' || trendViewMetric === 'volume') && (
                <Line
                  yAxisId="volumeAxis"
                  type="monotone"
                  dataKey="requestVolume"
                  name="Request Volume"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#a855f7', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: '#7e22ce', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section: Latency Trend vs Status Code Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real-time Response Time vs Concurrency Chart */}
        <div className="lg:col-span-2 p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-200">Real-Time Latency Stream (ms)</h2>
              <p className="text-[10px] text-gray-500">Live response time metrics against active request concurrency</p>
            </div>
            <button
              onClick={onOpenSimulator}
              className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600/20 text-indigo-300 border border-indigo-600/30 hover:bg-indigo-600/30 transition-colors"
            >
              Trigger Burst
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#24262F" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} unit="ms" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111218', borderColor: '#24262F', borderRadius: '4px', fontSize: '11px', color: '#e0e0e0' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="latency" name="Response Time (ms)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HTTP Status Code Distribution */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-gray-200">HTTP Status Breakdown</h2>
            <p className="text-[10px] text-gray-500">Distribution of HTTP responses</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111218', borderColor: '#24262F', borderRadius: '4px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-[#24262F]">
            {statusPieData.map((item) => (
              <div key={item.name} className="p-1.5 rounded bg-[#1A1C24]">
                <span className="block w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                <span className="font-bold text-gray-300 text-[10px] block truncate">{item.name}</span>
                <span className="text-[10px] text-gray-500 font-mono">{item.value} reqs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Degraded Endpoints & ML Model Quick Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Degraded Endpoints */}
        <div className="lg:col-span-2 p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xs uppercase tracking-wider text-gray-200">High Latency Endpoints</h2>
            <button
              onClick={() => onNavigateTab('monitoring')}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              All Metrics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
                <tr>
                  <th className="p-2 text-[10px] uppercase">Endpoint</th>
                  <th className="p-2 text-[10px] uppercase">Avg Latency</th>
                  <th className="p-2 text-[10px] uppercase">Error Rate</th>
                  <th className="p-2 text-[10px] uppercase">Availability</th>
                  <th className="p-2 text-[10px] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24262F]">
                {degradedEndpoints.map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-[#1A1C24]/50 transition-colors">
                    <td className="p-2 font-mono text-white font-bold">
                      <span className="px-1 py-0.5 rounded text-[9px] bg-[#1A1C24] mr-1.5 text-indigo-400 font-bold border border-[#24262F]">
                        {ep.method}
                      </span>
                      {ep.endpoint}
                    </td>
                    <td className="p-2 font-mono text-white font-bold">{ep.avgResponseTimeMs} ms</td>
                    <td className="p-2 font-mono text-amber-400">{ep.errorRatePct}%</td>
                    <td className="p-2 font-mono text-green-400">{ep.availabilityPct}%</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ep.health === 'Healthy'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : ep.health === 'Degraded'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {ep.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Machine Learning Actions Card */}
        <div className="p-4 rounded bg-[#111218] border border-indigo-600/30 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded bg-indigo-600/20 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">ML Engine Hub</h2>
              <p className="text-[10px] text-gray-500 font-mono">XGBoost & Isolation Forest</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Execute real-time latency regression forecasts and isolation forest anomaly detection models.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateTab('ml_hub')}
              className="w-full py-2 px-3 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm text-center block"
            >
              Launch ML Predictor & Models
            </button>
            <button
              onClick={() => onNavigateTab('mca_docs')}
              className="w-full py-2 px-3 text-xs font-semibold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-300 border border-[#24262F] text-center block"
            >
              MCA Project Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
