import React, { useState } from 'react';
import { Activity, Play, RefreshCw, Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { EndpointMetric, APILog } from '../types.js';

interface LiveMonitoringProps {
  endpoints: EndpointMetric[];
  logs: APILog[];
  onOpenSimulator: () => void;
  onRefresh: () => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({
  endpoints,
  logs,
  onOpenSimulator,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('All');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.statusCode.toString().includes(searchQuery);
    const matchesEndpoint = selectedEndpoint === 'All' || log.endpoint === selectedEndpoint;
    return matchesSearch && matchesEndpoint;
  });

  return (
    <div className="space-y-6">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111218] p-4 rounded border border-[#24262F] shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Live API Telemetry Monitoring
          </h2>
          <p className="text-[10px] text-gray-500 font-mono">
            Real-time throughput, latency, availability, and response telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-300 border border-[#24262F] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Traffic Simulator</span>
          </button>
        </div>
      </div>

      {/* Endpoint Performance Cards Table */}
      <div className="bg-[#111218] border border-[#24262F] rounded p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">Endpoint Telemetry Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
              <tr>
                <th className="p-2.5 text-[10px] uppercase">Endpoint</th>
                <th className="p-2.5 text-[10px] uppercase">Requests</th>
                <th className="p-2.5 text-[10px] uppercase">Avg Latency</th>
                <th className="p-2.5 text-[10px] uppercase">P95 Latency</th>
                <th className="p-2.5 text-[10px] uppercase">Throughput</th>
                <th className="p-2.5 text-[10px] uppercase">Error Rate</th>
                <th className="p-2.5 text-[10px] uppercase">Availability</th>
                <th className="p-2.5 text-[10px] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {endpoints.map((ep) => (
                <tr key={ep.endpoint} className="hover:bg-[#1A1C24]/50 transition-colors">
                  <td className="p-2.5 font-mono font-bold text-white flex items-center space-x-2">
                    <span className="px-1 py-0.5 rounded text-[9px] bg-[#1A1C24] text-indigo-400 font-bold border border-[#24262F]">
                      {ep.method}
                    </span>
                    <span>{ep.endpoint}</span>
                  </td>
                  <td className="p-2.5 font-mono text-gray-300">{ep.totalRequests.toLocaleString()}</td>
                  <td className="p-2.5 font-mono text-white font-bold">{ep.avgResponseTimeMs} ms</td>
                  <td className="p-2.5 font-mono text-amber-300">{ep.p95ResponseTimeMs} ms</td>
                  <td className="p-2.5 font-mono text-cyan-400">{ep.throughputRps} rps</td>
                  <td className="p-2.5 font-mono text-red-400">{ep.errorRatePct}%</td>
                  <td className="p-2.5 font-mono text-green-400">{ep.availabilityPct}%</td>
                  <td className="p-2.5">
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

      {/* Live Stream Logs */}
      <div className="bg-[#111218] border border-[#24262F] rounded p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">Real-Time Telemetry Log Stream</h3>
            <p className="text-[10px] text-gray-500 font-mono">Stream of live API requests with Isolation Forest anomaly markers</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#1A1C24] border border-[#24262F] rounded text-xs text-white focus:outline-none focus:border-indigo-600 w-44 font-mono"
              />
            </div>

            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="px-2.5 py-1 bg-[#1A1C24] border border-[#24262F] rounded text-xs text-gray-300 focus:outline-none focus:border-indigo-600 font-mono"
            >
              <option value="All">All Endpoints</option>
              {endpoints.map((ep) => (
                <option key={ep.endpoint} value={ep.endpoint}>{ep.endpoint}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F] sticky top-0 z-10">
              <tr>
                <th className="p-2 text-[10px] uppercase">Time</th>
                <th className="p-2 text-[10px] uppercase">Endpoint</th>
                <th className="p-2 text-[10px] uppercase">Method</th>
                <th className="p-2 text-[10px] uppercase">Status</th>
                <th className="p-2 text-[10px] uppercase">Latency</th>
                <th className="p-2 text-[10px] uppercase">Payload</th>
                <th className="p-2 text-[10px] uppercase">Concurrency</th>
                <th className="p-2 text-[10px] uppercase">CPU Load</th>
                <th className="p-2 text-[10px] uppercase">ML Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {filteredLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className={`hover:bg-[#1A1C24]/50 transition-colors ${log.isAnomaly ? 'bg-red-950/20' : ''}`}>
                  <td className="p-2 font-mono text-[10px] text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 font-mono font-bold text-white">{log.endpoint}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1A1C24] text-gray-300 border border-[#24262F]">
                      {log.method}
                    </span>
                  </td>
                  <td className="p-2 font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.statusCode < 300
                          ? 'bg-green-500/10 text-green-400'
                          : log.statusCode < 500
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="p-2 font-mono font-bold text-white">{log.responseTimeMs} ms</td>
                  <td className="p-2 font-mono text-gray-400">{log.payloadSizeKb} KB</td>
                  <td className="p-2 font-mono text-gray-300">{log.concurrencyLevel} rps</td>
                  <td className="p-2 font-mono text-gray-300">{log.cpuUsagePct}%</td>
                  <td className="p-2">
                    {log.isAnomaly ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> Anomaly ({log.anomalyScore})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1A1C24] text-gray-400 flex items-center gap-1 w-max border border-[#24262F]">
                        <CheckCircle className="w-3 h-3 text-green-400" /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
