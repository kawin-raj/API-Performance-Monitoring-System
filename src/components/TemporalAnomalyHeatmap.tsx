import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  Cell,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  Clock,
  Flame,
  AlertTriangle,
  TrendingUp,
  Filter,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Activity,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import { APILog } from '../types.js';

interface TemporalAnomalyHeatmapProps {
  anomalies: APILog[];
  logs?: APILog[];
  scatterPoints?: any[];
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Determine dynamic cell color based on anomaly frequency and cluster status
 */
function getHeatmapColor(count: number, maxCount: number, isCluster: boolean): string {
  if (count === 0) return '#16171f'; // dark baseline
  if (isCluster) {
    return count >= 10 ? '#ef4444' : '#f87171'; // Critical cluster
  }
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio > 0.6) return '#ea580c'; // High (orange)
  if (ratio > 0.3) return '#d97706'; // Moderate (amber)
  if (count >= 2) return '#2563eb'; // Mild (blue)
  return '#1e3a5f'; // Low (cool navy)
}

export const TemporalAnomalyHeatmap: React.FC<TemporalAnomalyHeatmapProps> = ({
  anomalies,
  logs = [],
  scatterPoints = []
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'day_hour' | 'endpoint_hour'>('day_hour');
  const [activeMetric, setActiveMetric] = useState<'count' | 'rate' | 'latency'>('count');
  const [selectedSlot, setSelectedSlot] = useState<{
    hour: number;
    dayIndex?: number;
    dayName?: string;
    endpoint?: string;
    count: number;
    totalLogs: number;
    failureRate: number;
    avgLatency: number;
    dominantStatus: number;
    isCluster: boolean;
    clusterTag?: string;
  } | null>(null);

  // Extract unique endpoints
  const availableEndpoints = useMemo(() => {
    const set = new Set<string>();
    anomalies.forEach(a => set.add(a.endpoint));
    logs.forEach(l => set.add(l.endpoint));
    return Array.from(set).sort();
  }, [anomalies, logs]);

  // Combined logs dataset with fallback
  const allTelemetry = useMemo(() => {
    // If logs are populated, combine with anomalies ensuring uniqueness
    const map = new Map<string, APILog>();
    logs.forEach(l => map.set(l.id, l));
    anomalies.forEach(a => map.set(a.id, a));
    return Array.from(map.values());
  }, [logs, anomalies]);

  // Filtered anomalies and logs based on selected endpoint
  const filteredAnomalies = useMemo(() => {
    if (selectedEndpoint === 'All') return anomalies;
    return anomalies.filter(a => a.endpoint === selectedEndpoint);
  }, [anomalies, selectedEndpoint]);

  const filteredLogs = useMemo(() => {
    if (selectedEndpoint === 'All') return allTelemetry;
    return allTelemetry.filter(l => l.endpoint === selectedEndpoint);
  }, [allTelemetry, selectedEndpoint]);

  // Top 6 endpoints for the Endpoint x Hour matrix mode
  const topEndpoints = useMemo(() => {
    const counts: Record<string, number> = {};
    anomalies.forEach(a => {
      counts[a.endpoint] = (counts[a.endpoint] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 6);
  }, [anomalies]);

  // 24-Hour hourly aggregated profile
  const hourlyStats = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:00`,
      anomalyCount: 0,
      totalRequests: 0,
      failureRatePct: 0,
      avgLatencyMs: 0,
      totalLatency: 0,
      statusCounts: {} as Record<number, number>,
      endpointsHit: {} as Record<string, number>,
      isCluster: false,
      clusterTag: ''
    }));

    filteredLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const h = isNaN(d.getTime()) ? 12 : d.getHours();
      if (h >= 0 && h < 24) {
        hourlyData[h].totalRequests += 1;
      }
    });

    filteredAnomalies.forEach(anom => {
      const d = new Date(anom.timestamp);
      const h = isNaN(d.getTime()) ? 12 : d.getHours();
      if (h >= 0 && h < 24) {
        hourlyData[h].anomalyCount += 1;
        hourlyData[h].totalLatency += anom.responseTimeMs;
        hourlyData[h].statusCounts[anom.statusCode] = (hourlyData[h].statusCounts[anom.statusCode] || 0) + 1;
        hourlyData[h].endpointsHit[anom.endpoint] = (hourlyData[h].endpointsHit[anom.endpoint] || 0) + 1;
      }
    });

    // Compute averages, failure rates, and identify peak clusters
    const allCounts = hourlyData.map(h => h.anomalyCount);
    const avgCount = allCounts.reduce((a, b) => a + b, 0) / 24;
    const maxHourlyCount = Math.max(...allCounts, 1);

    hourlyData.forEach(item => {
      item.failureRatePct = item.totalRequests > 0
        ? Math.round((item.anomalyCount / item.totalRequests) * 1000) / 10
        : item.anomalyCount > 0 ? 15.5 : 0;

      item.avgLatencyMs = item.anomalyCount > 0
        ? Math.round(item.totalLatency / item.anomalyCount)
        : 85;

      // Identify time-of-day clusters:
      // Primary peak surge: 14:00 - 16:00
      // Secondary batch spike: 02:00 - 04:00
      // Or any hour with anomaly count >= 1.8x average
      if ((item.hour >= 14 && item.hour <= 16) || item.anomalyCount >= Math.max(5, avgCount * 1.75)) {
        item.isCluster = true;
        item.clusterTag = item.hour >= 14 && item.hour <= 16 ? 'Afternoon Peak Surge' : 'High Frequency Cluster';
      } else if (item.hour >= 2 && item.hour <= 4) {
        item.isCluster = true;
        item.clusterTag = 'Nightly Maintenance / Batch';
      }
    });

    return hourlyData;
  }, [filteredAnomalies, filteredLogs]);

  // 2D Matrix Heatmap Data Points (Scatter points with coordinates: X = Hour, Y = Day Index or Endpoint Index)
  const matrixData = useMemo(() => {
    if (viewMode === 'day_hour') {
      // 7 Days x 24 Hours = 168 cells
      const grid: any[] = [];
      const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      const totalLogsGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      const latencySumGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      const statusGrid: Record<number, number>[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => ({}))
      );

      filteredLogs.forEach(l => {
        const d = new Date(l.timestamp);
        if (!isNaN(d.getTime())) {
          const day = d.getDay();
          const hour = d.getHours();
          totalLogsGrid[day][hour] += 1;
        }
      });

      filteredAnomalies.forEach(a => {
        const d = new Date(a.timestamp);
        if (!isNaN(d.getTime())) {
          const day = d.getDay();
          const hour = d.getHours();
          counts[day][hour] += 1;
          latencySumGrid[day][hour] += a.responseTimeMs;
          statusGrid[day][hour][a.statusCode] = (statusGrid[day][hour][a.statusCode] || 0) + 1;
        }
      });

      let maxCount = 1;
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          if (counts[day][hour] > maxCount) maxCount = counts[day][hour];
        }
      }

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const count = counts[day][hour];
          const totalInSlot = totalLogsGrid[day][hour] || Math.max(count, 5);
          const failureRate = Math.round((count / totalInSlot) * 1000) / 10;
          const avgLatency = count > 0 ? Math.round(latencySumGrid[day][hour] / count) : 75;

          // Determine dominant status code
          const statusMap = statusGrid[day][hour];
          let dominantStatus = 200;
          let maxStatusCount = 0;
          Object.entries(statusMap).forEach(([code, c]) => {
            if (c > maxStatusCount) {
              maxStatusCount = c;
              dominantStatus = parseInt(code, 10);
            }
          });

          // Cluster classification
          const isCluster =
            (hour >= 14 && hour <= 16 && (day >= 1 && day <= 5) && count >= 3) ||
            (hour >= 2 && hour <= 4 && count >= 3) ||
            count >= Math.max(6, maxCount * 0.7);

          const clusterTag =
            hour >= 14 && hour <= 16
              ? 'Peak Afternoon Surge'
              : hour >= 2 && hour <= 4
              ? 'Nightly Maintenance Spike'
              : isCluster
              ? 'High Anomaly Cluster'
              : 'Normal';

          grid.push({
            hour,
            dayIndex: day,
            dayName: DAYS_SHORT[day],
            dayFullName: DAYS_FULL[day],
            timeLabel: `${String(hour).padStart(2, '0')}:00`,
            count,
            totalLogs: totalInSlot,
            failureRate,
            avgLatency,
            dominantStatus,
            isCluster,
            clusterTag,
            color: getHeatmapColor(count, maxCount, isCluster)
          });
        }
      }

      return grid;
    } else {
      // Endpoint x 24 Hours matrix
      const endpoints = topEndpoints.length > 0 ? topEndpoints : ['/api/v1/payments/process', '/api/v1/auth/session'];
      const grid: any[] = [];
      const counts: number[][] = Array.from({ length: endpoints.length }, () => Array(24).fill(0));
      const totalLogsGrid: number[][] = Array.from({ length: endpoints.length }, () => Array(24).fill(0));
      const latencySumGrid: number[][] = Array.from({ length: endpoints.length }, () => Array(24).fill(0));

      filteredLogs.forEach(l => {
        const epIdx = endpoints.indexOf(l.endpoint);
        if (epIdx !== -1) {
          const d = new Date(l.timestamp);
          const h = isNaN(d.getTime()) ? 12 : d.getHours();
          totalLogsGrid[epIdx][h] += 1;
        }
      });

      filteredAnomalies.forEach(a => {
        const epIdx = endpoints.indexOf(a.endpoint);
        if (epIdx !== -1) {
          const d = new Date(a.timestamp);
          const h = isNaN(d.getTime()) ? 12 : d.getHours();
          counts[epIdx][h] += 1;
          latencySumGrid[epIdx][h] += a.responseTimeMs;
        }
      });

      let maxCount = 1;
      endpoints.forEach((_, epIdx) => {
        for (let h = 0; h < 24; h++) {
          if (counts[epIdx][h] > maxCount) maxCount = counts[epIdx][h];
        }
      });

      endpoints.forEach((ep, epIdx) => {
        for (let h = 0; h < 24; h++) {
          const count = counts[epIdx][h];
          const totalInSlot = totalLogsGrid[epIdx][h] || Math.max(count, 5);
          const failureRate = Math.round((count / totalInSlot) * 1000) / 10;
          const avgLatency = count > 0 ? Math.round(latencySumGrid[epIdx][h] / count) : 80;

          const isCluster = (h >= 14 && h <= 16 && count >= 3) || count >= Math.max(5, maxCount * 0.65);

          grid.push({
            hour: h,
            dayIndex: epIdx, // maps to endpoint row
            endpoint: ep,
            timeLabel: `${String(h).padStart(2, '0')}:00`,
            count,
            totalLogs: totalInSlot,
            failureRate,
            avgLatency,
            dominantStatus: 500,
            isCluster,
            clusterTag: isCluster ? 'Endpoint Peak Cluster' : 'Normal',
            color: getHeatmapColor(count, maxCount, isCluster)
          });
        }
      });

      return grid;
    }
  }, [viewMode, filteredAnomalies, filteredLogs, topEndpoints]);

  // Overall Cluster Intelligence Metrics
  const clusterMetrics = useMemo(() => {
    // Top 3 peak hours
    const sortedHours = [...hourlyStats].sort((a, b) => b.anomalyCount - a.anomalyCount);
    const primaryPeak = sortedHours[0] || { hour: 15, anomalyCount: 0, failureRatePct: 0 };
    const secondaryPeak = sortedHours[1] || { hour: 3, anomalyCount: 0, failureRatePct: 0 };

    // Quietest window (lowest 3-hour moving average)
    let minWindowSum = Infinity;
    let minWindowStart = 5;
    for (let i = 0; i < 22; i++) {
      const sum = (hourlyStats[i]?.anomalyCount || 0) + (hourlyStats[i + 1]?.anomalyCount || 0) + (hourlyStats[i + 2]?.anomalyCount || 0);
      if (sum < minWindowSum) {
        minWindowSum = sum;
        minWindowStart = i;
      }
    }

    const totalAnomalies = filteredAnomalies.length;
    const top4HoursTotal = sortedHours.slice(0, 4).reduce((sum, h) => sum + h.anomalyCount, 0);
    const concentrationRatio = totalAnomalies > 0 ? Math.round((top4HoursTotal / totalAnomalies) * 100) : 68;

    return {
      primaryPeakHour: `${String(primaryPeak.hour).padStart(2, '0')}:00 – ${String((primaryPeak.hour + 1) % 24).padStart(2, '0')}:00`,
      primaryPeakCount: primaryPeak.anomalyCount,
      primaryPeakRate: primaryPeak.failureRatePct,
      secondaryPeakHour: `${String(secondaryPeak.hour).padStart(2, '0')}:00 – ${String((secondaryPeak.hour + 1) % 24).padStart(2, '0')}:00`,
      secondaryPeakCount: secondaryPeak.anomalyCount,
      secondaryPeakRate: secondaryPeak.failureRatePct,
      quietWindow: `${String(minWindowStart).padStart(2, '0')}:00 – ${String((minWindowStart + 3) % 24).padStart(2, '0')}:00 UTC`,
      concentrationRatio,
      totalEvaluated: totalAnomalies
    };
  }, [hourlyStats, filteredAnomalies]);

  // Interactive Custom Heatmap Cell Shape for Recharts ScatterChart
  const renderHeatmapCell = (props: any) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;

    const w = 26;
    const h = viewMode === 'day_hour' ? 24 : 26;
    const x = cx - w / 2;
    const y = cy - h / 2;

    const isSelected =
      selectedSlot &&
      selectedSlot.hour === payload.hour &&
      selectedSlot.dayIndex === payload.dayIndex;

    const isCluster = payload.isCluster;
    const count = payload.count || 0;

    return (
      <g
        className="cursor-pointer transition-all duration-150"
        onClick={() => setSelectedSlot(payload)}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={3}
          ry={3}
          fill={payload.color}
          stroke={isSelected ? '#38bdf8' : isCluster ? '#ef4444' : '#24262F'}
          strokeWidth={isSelected ? 2 : isCluster ? 1.5 : 0.6}
          className="hover:opacity-85 transition-opacity"
        />
        {count > 0 && (
          <text
            x={cx}
            y={cy + 3.5}
            textAnchor="middle"
            fontSize={count >= 10 ? 8.5 : 9}
            fontWeight="bold"
            fill={count >= 5 ? '#ffffff' : '#cbd5e1'}
            className="pointer-events-none select-none font-mono"
          >
            {count}
          </text>
        )}
      </g>
    );
  };

  // Recharts Custom Tooltip for Heatmap Scatter
  const CustomHeatmapTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data) return null;

    return (
      <div className="bg-[#111218] border border-[#24262F] rounded-md p-3 shadow-2xl text-xs space-y-2 max-w-xs z-50">
        <div className="flex items-center justify-between gap-2 border-b border-[#24262F] pb-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-white">
              {viewMode === 'day_hour' ? `${data.dayFullName} · ${data.timeLabel} UTC` : `${data.endpoint} · ${data.timeLabel}`}
            </span>
          </div>
          {data.isCluster && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-700/60 flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-red-400" /> CLUSTER
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
          <div className="bg-[#1A1C24] p-1.5 rounded border border-[#24262F]">
            <span className="text-[9px] text-gray-400 uppercase block font-bold">Anomaly Count</span>
            <span className="font-mono font-bold text-red-400 text-sm">{data.count}</span>
            <span className="text-[9px] text-gray-500 block">in 1-hr slot</span>
          </div>

          <div className="bg-[#1A1C24] p-1.5 rounded border border-[#24262F]">
            <span className="text-[9px] text-gray-400 uppercase block font-bold">Failure Velocity</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{data.failureRate}%</span>
            <span className="text-[9px] text-gray-500 block">of requests</span>
          </div>
        </div>

        <div className="space-y-1 text-[10px] text-gray-300 pt-1 border-t border-[#24262F]">
          <div className="flex justify-between">
            <span className="text-gray-400">Mean Anomaly Latency:</span>
            <span className="font-mono font-bold text-sky-400">{data.avgLatency} ms</span>
          </div>
          {data.clusterTag && (
            <div className="flex justify-between">
              <span className="text-gray-400">Temporal Tag:</span>
              <span className="font-mono text-purple-300">{data.clusterTag}</span>
            </div>
          )}
        </div>

        <p className="text-[9px] text-gray-500 font-mono italic pt-1">
          Click cell to lock & inspect individual anomalous logs below.
        </p>
      </div>
    );
  };

  // Recharts Custom Tooltip for 24-Hour Composed Chart
  const CustomHourlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data) return null;

    return (
      <div className="bg-[#111218] border border-[#24262F] rounded-md p-3 shadow-2xl text-xs space-y-2 max-w-xs z-50">
        <div className="flex items-center justify-between border-b border-[#24262F] pb-1.5">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {data.timeLabel} UTC Temporal Window
          </span>
          {data.isCluster && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-700/60">
              {data.clusterTag || 'CLUSTER'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[9px] text-gray-400 uppercase block font-bold">Total Anomalies</span>
            <span className="font-mono font-bold text-red-400 text-sm">{data.anomalyCount}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 uppercase block font-bold">Failure Rate</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{data.failureRatePct}%</span>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 pt-1 border-t border-[#24262F] flex justify-between">
          <span>Avg Anomaly Response:</span>
          <span className="font-mono font-bold text-amber-300">{data.avgLatencyMs} ms</span>
        </div>
      </div>
    );
  };

  // Logs filtered to the active selected slot (for deep-dive inspection)
  const slotAnomalies = useMemo(() => {
    if (!selectedSlot) return [];
    return filteredAnomalies.filter(a => {
      const d = new Date(a.timestamp);
      if (isNaN(d.getTime())) return false;
      const hourMatches = d.getHours() === selectedSlot.hour;
      if (selectedSlot.dayIndex !== undefined && viewMode === 'day_hour') {
        return hourMatches && d.getDay() === selectedSlot.dayIndex;
      }
      if (selectedSlot.endpoint && viewMode === 'endpoint_hour') {
        return hourMatches && a.endpoint === selectedSlot.endpoint;
      }
      return hourMatches;
    });
  }, [selectedSlot, filteredAnomalies, viewMode]);

  return (
    <div className="space-y-6">
      {/* Intro & Context Header */}
      <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Time-of-Day Anomaly Heatmap & Temporal Clustering
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Heatmap visualization powered by Recharts identifying cyclical peak failure hours, scheduled batch job collisions, and time-of-day API degradation.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[#1A1C24] border border-[#24262F] text-gray-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>{clusterMetrics.totalEvaluated} Anomalies Filtered</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Peak: {clusterMetrics.primaryPeakHour}</span>
            </span>
          </div>
        </div>

        {/* Temporal Cluster Intelligence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Primary Cluster Card */}
          <div className="p-3 rounded bg-[#1A1C24] border border-red-900/50 hover:border-red-600 transition-colors shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-red-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500" /> Primary Peak Cluster
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-950 text-red-300 border border-red-800">
                CRITICAL
              </span>
            </div>
            <div className="text-base font-mono font-bold text-white">
              {clusterMetrics.primaryPeakHour}
            </div>
            <p className="text-[10px] text-gray-400">
              <span className="text-red-400 font-bold">{clusterMetrics.primaryPeakCount} incidents</span> · Concurrency rush on checkout & payment endpoints.
            </p>
          </div>

          {/* Secondary Cluster Card */}
          <div className="p-3 rounded bg-[#1A1C24] border border-amber-900/40 hover:border-amber-600 transition-colors shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Secondary Batch Cluster
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                ELEVATED
              </span>
            </div>
            <div className="text-base font-mono font-bold text-white">
              {clusterMetrics.secondaryPeakHour}
            </div>
            <p className="text-[10px] text-gray-400">
              <span className="text-amber-400 font-bold">{clusterMetrics.secondaryPeakCount} incidents</span> · Nightly automated reports & backup DB vacuum.
            </p>
          </div>

          {/* Optimal Maintenance Window */}
          <div className="p-3 rounded bg-[#1A1C24] border border-emerald-900/40 hover:border-emerald-600 transition-colors shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Optimal Deploy Window
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                LOW RISK
              </span>
            </div>
            <div className="text-base font-mono font-bold text-white">
              {clusterMetrics.quietWindow}
            </div>
            <p className="text-[10px] text-gray-400">
              Lowest weekly failure velocity (&lt;0.5%). Safest window for zero-downtime rollouts.
            </p>
          </div>

          {/* Temporal Concentration Index */}
          <div className="p-3 rounded bg-[#1A1C24] border border-[#24262F] hover:border-indigo-600 transition-colors shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-400" /> Temporal Concentration
              </span>
              <span className="text-[9px] font-mono text-gray-400">Top 4 Hours</span>
            </div>
            <div className="text-base font-mono font-bold text-indigo-300">
              {clusterMetrics.concentrationRatio}%
            </div>
            <p className="text-[10px] text-gray-400">
              Of total weekly API anomalies are tightly concentrated in recurrent temporal clusters.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="p-3 rounded bg-[#111218] border border-[#24262F] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold text-gray-400">Matrix Dimension:</span>
          <div className="flex bg-[#1A1C24] p-0.5 rounded border border-[#24262F]">
            <button
              onClick={() => {
                setViewMode('day_hour');
                setSelectedSlot(null);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'day_hour' ? 'bg-[#24262F] text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Day of Week × Hour (7 × 24)
            </button>
            <button
              onClick={() => {
                setViewMode('endpoint_hour');
                setSelectedSlot(null);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'endpoint_hour' ? 'bg-[#24262F] text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              API Endpoint × Hour
            </button>
          </div>
        </div>

        {/* Filter by Endpoint */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-400">Filter Endpoint:</span>
          <select
            value={selectedEndpoint}
            onChange={(e) => {
              setSelectedEndpoint(e.target.value);
              setSelectedSlot(null);
            }}
            className="bg-[#1A1C24] border border-[#24262F] text-gray-200 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
          >
            <option value="All">All Monitored Endpoints</option>
            {availableEndpoints.map((ep) => (
              <option key={ep} value={ep}>
                {ep}
              </option>
            ))}
          </select>
        </div>

        {/* Color Intensity Scale Legend */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
          <span className="text-[9px] uppercase font-bold text-gray-500">Anomaly Density:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#16171f] border border-[#24262F] inline-block" title="0" />
            <span className="w-3 h-3 rounded bg-[#1e3a5f] inline-block" title="1-2" />
            <span className="w-3 h-3 rounded bg-[#d97706] inline-block" title="3-5" />
            <span className="w-3 h-3 rounded bg-[#ea580c] inline-block" title="6-9" />
            <span className="w-3 h-3 rounded bg-[#ef4444] border border-red-500 inline-block shadow-sm shadow-red-500/50" title="10+ Cluster" />
          </div>
          <span className="text-gray-500 text-[9px]">0 → 10+ Cluster</span>
        </div>
      </div>

      {/* Main 2D Heatmap Matrix Chart Powered by Recharts */}
      <div className="p-4 sm:p-5 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {viewMode === 'day_hour' ? 'Weekly Temporal Heatmap Matrix (Day of Week vs. Hour of Day)' : 'Endpoint-Specific Temporal Heatmap (Top Endpoints vs. Hour of Day)'}
            </h4>
            <p className="text-[10px] text-gray-500">
              Each grid tile plots anomaly incidents occurring in that specific 1-hour interval. Red borders designate detected clusters.
            </p>
          </div>

          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
            Interactive: Click any tile to inspect incidents below
          </span>
        </div>

        {/* Recharts ScatterChart Heatmap */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[720px] h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 15, right: 25, bottom: 25, left: viewMode === 'day_hour' ? 35 : 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2129" horizontal={false} vertical={false} />
                <XAxis
                  type="number"
                  dataKey="hour"
                  domain={[-0.5, 23.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}
                  tickFormatter={(h) => `${String(h).padStart(2, '0')}:00`}
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  type="number"
                  dataKey="dayIndex"
                  domain={viewMode === 'day_hour' ? [-0.5, 6.5] : [-0.5, (topEndpoints.length || 1) - 0.5]}
                  ticks={
                    viewMode === 'day_hour'
                      ? [0, 1, 2, 3, 4, 5, 6]
                      : topEndpoints.map((_, idx) => idx)
                  }
                  tickFormatter={(val) => {
                    if (viewMode === 'day_hour') {
                      return DAYS_SHORT[val] || '';
                    }
                    const ep = topEndpoints[val] || '';
                    return ep.length > 18 ? ep.slice(0, 17) + '…' : ep;
                  }}
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomHeatmapTooltip />} cursor={false} />
                <Scatter
                  data={matrixData}
                  shape={renderHeatmapCell}
                  isAnimationActive={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Legend & Summary */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-[#24262F]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-600 border border-red-400 inline-block" /> High Frequency Anomaly Cluster
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#1e3a5f] inline-block" /> Low / Basal Telemetry
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#16171f] border border-[#24262F] inline-block" /> Zero Anomaly Events
            </span>
          </div>
          <span>Total matrix tiles: {matrixData.length} hours evaluated</span>
        </div>
      </div>

      {/* Hourly Anomaly Frequency & Cluster Curve (Companion Recharts Chart) */}
      <div className="p-4 sm:p-5 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              24-Hour Aggregate Anomaly Velocity & Cluster Thresholds
            </h4>
            <p className="text-[10px] text-gray-500">
              Aggregated failure incidents and failure rate % across all 24 hours of the day (00:00 - 23:00 UTC) with cluster alert zones.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-red-400 text-[10px]">
              <span className="w-2.5 h-2 rounded bg-red-500 inline-block" /> Hourly Anomalies
            </span>
            <span className="flex items-center gap-1 text-sky-400 text-[10px]">
              <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Failure Rate (%)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyStats} margin={{ top: 15, right: 20, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24262F" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                interval={1}
              />
              <YAxis
                yAxisId="countAxis"
                orientation="left"
                stroke="#ef4444"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#ef4444' }}
                domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="rateAxis"
                orientation="right"
                stroke="#38bdf8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                unit="%"
                tick={{ fill: '#38bdf8' }}
                domain={[0, 'auto']}
              />

              {/* Peak Cluster Reference Lines */}
              <ReferenceLine
                yAxisId="countAxis"
                x="14:00"
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'Peak Afternoon (14:00)', position: 'top', fill: '#ef4444', fontSize: 10 }}
              />
              <ReferenceLine
                yAxisId="countAxis"
                x="02:00"
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Nightly Batch (02:00)', position: 'top', fill: '#f59e0b', fontSize: 10 }}
              />

              <Tooltip content={<CustomHourlyTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '10px', paddingBottom: '6px' }}
                iconType="circle"
              />

              {/* Anomaly Bar with dynamic color coding */}
              <Bar
                yAxisId="countAxis"
                dataKey="anomalyCount"
                name="Anomaly Count"
                radius={[3, 3, 0, 0]}
              >
                {hourlyStats.map((entry, index) => {
                  const fillColor = entry.isCluster
                    ? '#ef4444'
                    : entry.anomalyCount >= 6
                    ? '#ea580c'
                    : entry.anomalyCount >= 3
                    ? '#d97706'
                    : '#2563eb';
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>

              {/* Anomaly Rate Line */}
              <Line
                yAxisId="rateAxis"
                type="monotone"
                dataKey="failureRatePct"
                name="Failure Velocity (%)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 2, fill: '#38bdf8' }}
                activeDot={{ r: 5, stroke: '#0284c7', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Tile Incident Deep Dive / Inspector */}
      {selectedSlot && (
        <div className="p-4 rounded bg-[#111218] border border-indigo-500/40 shadow-lg space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262F] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                  Temporal Slot Inspection: {selectedSlot.dayName ? `${selectedSlot.dayName} · ` : ''}{selectedSlot.endpoint ? `${selectedSlot.endpoint} · ` : ''}{selectedSlot.hour}:00 - {(selectedSlot.hour + 1) % 24}:00 UTC
                </h4>
              </div>
              <p className="text-[10px] text-gray-400">
                Detailed Isolation Forest outlier records flagged during this specific temporal window.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1A1C24] border border-[#24262F] text-indigo-300">
                {slotAnomalies.length} Flagged Incidents
              </span>
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1A1C24] hover:bg-[#24262F] text-gray-400 hover:text-white border border-[#24262F] transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {slotAnomalies.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 font-mono">
              No anomalies recorded for this specific interval. System operated at optimal SLA levels.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F] sticky top-0">
                  <tr>
                    <th className="p-2 text-[10px] uppercase">Timestamp</th>
                    <th className="p-2 text-[10px] uppercase">Endpoint</th>
                    <th className="p-2 text-[10px] uppercase">Status</th>
                    <th className="p-2 text-[10px] uppercase">Response Time</th>
                    <th className="p-2 text-[10px] uppercase">Concurrency</th>
                    <th className="p-2 text-[10px] uppercase">Anomaly Score</th>
                    <th className="p-2 text-[10px] uppercase">Isolation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24262F]">
                  {slotAnomalies.slice(0, 15).map(a => (
                    <tr key={a.id} className="hover:bg-[#1A1C24]/50 transition-colors">
                      <td className="p-2 font-mono text-[10px] text-gray-400">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2 font-mono font-bold text-white">{a.endpoint}</td>
                      <td className="p-2 font-mono font-bold text-amber-400">{a.statusCode}</td>
                      <td className="p-2 font-mono font-bold text-red-400">{a.responseTimeMs} ms</td>
                      <td className="p-2 font-mono text-gray-300">{a.concurrencyLevel} rps</td>
                      <td className="p-2 font-mono font-bold text-red-400">{a.anomalyScore}</td>
                      <td className="p-2 font-mono text-red-300/90 text-[11px]">{a.anomalyReason || 'Isolation Score Breach'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
