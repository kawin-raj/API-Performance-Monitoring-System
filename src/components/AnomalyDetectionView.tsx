import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Activity, Search, Info, Flame, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from 'recharts';
import { APILog } from '../types.js';

interface AnomalyDetectionViewProps {
  anomalies: APILog[];
  scatterPoints: any[];
  onNavigateToHeatmap?: () => void;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({
  anomalies,
  scatterPoints,
  onNavigateToHeatmap
}) => {
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.60);

  const normalPoints = scatterPoints.filter(p => !p.isAnomaly && p.anomalyScore < anomalyThreshold);
  const outlierPoints = scatterPoints.filter(p => p.isAnomaly || p.anomalyScore >= anomalyThreshold);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Isolation Forest Outlier Detection
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Unsupervised tree ensemble isolates multivariate telemetry anomalies without static threshold rules.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-300">
          <span className="font-bold text-[10px] uppercase text-gray-400">Sensitivity:</span>
          <input
            type="range"
            min="0.40"
            max="0.80"
            step="0.05"
            value={anomalyThreshold}
            onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
            className="w-20 accent-indigo-600"
          />
          <span className="font-mono font-bold text-indigo-400 text-xs">{anomalyThreshold}</span>
        </div>
      </div>

      {/* Temporal Pattern Heatmap Discovery Banner */}
      {onNavigateToHeatmap && (
        <div className="p-3.5 rounded bg-gradient-to-r from-red-950/40 via-[#111218] to-indigo-950/40 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-red-900/30 border border-red-700/50 text-red-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Temporal Failure Patterns Identified
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-900/50 text-red-300 border border-red-700">
                  Time-of-Day Clusters
                </span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Isolation Forest detected recurrence spikes during afternoon peak hours (14:00-16:00 UTC) and nightly maintenance (02:00-04:00 UTC).
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToHeatmap}
            className="px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm hover:shadow-red-900/50"
          >
            <span>Explore Time-of-Day Heatmap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scatter Plot: Latency vs Concurrency with Anomaly Color Coding */}
      <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Multivariate Scatter Plot</h4>
            <p className="text-[10px] text-gray-500">Latency (ms) vs Concurrency (rps) with Isolation Forest outlier bounds</p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-green-400 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Normal
            </span>
            <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Flagged Outlier
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#24262F" />
              <XAxis dataKey="concurrency" name="Concurrency" stroke="#6b7280" fontSize={10} unit=" rps" tickLine={false} />
              <YAxis dataKey="latencyMs" name="Latency" stroke="#6b7280" fontSize={10} unit=" ms" tickLine={false} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#111218', borderColor: '#24262F', borderRadius: '4px', fontSize: '11px', color: '#e0e0e0' }}
              />
              <Scatter name="Normal" data={normalPoints} fill="#10b981" opacity={0.6} />
              <Scatter name="Outliers" data={outlierPoints} fill="#ef4444" opacity={0.9} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Records List */}
      <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Isolation Forest Flagged Incidents ({anomalies.length})</h4>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F] sticky top-0">
              <tr>
                <th className="p-2 text-[10px] uppercase">Time</th>
                <th className="p-2 text-[10px] uppercase">Endpoint</th>
                <th className="p-2 text-[10px] uppercase">Status</th>
                <th className="p-2 text-[10px] uppercase">Latency</th>
                <th className="p-2 text-[10px] uppercase">Concurrency</th>
                <th className="p-2 text-[10px] uppercase">CPU Load</th>
                <th className="p-2 text-[10px] uppercase">Anomaly Score</th>
                <th className="p-2 text-[10px] uppercase">Root Cause Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-[#1A1C24]/50 transition-colors">
                  <td className="p-2 font-mono text-[10px] text-gray-500">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 font-mono font-bold text-white">{a.endpoint}</td>
                  <td className="p-2 font-mono font-bold text-amber-400">{a.statusCode}</td>
                  <td className="p-2 font-mono font-bold text-red-400">{a.responseTimeMs} ms</td>
                  <td className="p-2 font-mono text-gray-300">{a.concurrencyLevel} rps</td>
                  <td className="p-2 font-mono text-gray-300">{a.cpuUsagePct}%</td>
                  <td className="p-2 font-mono font-bold text-red-400">{a.anomalyScore}</td>
                  <td className="p-2 font-mono text-red-300/90 text-[11px]">{a.anomalyReason || 'Isolation Score Breach'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
