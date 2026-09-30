import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Sliders, Filter, Bell } from 'lucide-react';
import { Alert, SystemThresholds } from '../types.js';

interface AlertsManagerProps {
  alerts: Alert[];
  thresholds: SystemThresholds;
  onUpdateAlertStatus: (id: string, status: Alert['status']) => Promise<void>;
  onUpdateThresholds: (t: Partial<SystemThresholds>) => Promise<void>;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  alerts,
  thresholds,
  onUpdateAlertStatus,
  onUpdateThresholds
}) => {
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Threshold form states
  const [latWarn, setLatWarn] = useState(thresholds.latencyWarningMs);
  const [latCrit, setLatCrit] = useState(thresholds.latencyCriticalMs);
  const [errWarn, setErrWarn] = useState(thresholds.errorRateWarningPct);
  const [errCrit, setErrCrit] = useState(thresholds.errorRateCriticalPct);

  const filteredAlerts = alerts.filter(a => {
    const matchSev = filterSeverity === 'All' || a.severity === filterSeverity;
    const matchStat = filterStatus === 'All' || a.status === filterStatus;
    return matchSev && matchStat;
  });

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateThresholds({
      latencyWarningMs: latWarn,
      latencyCriticalMs: latCrit,
      errorRateWarningPct: errWarn,
      errorRateCriticalPct: errCrit
    });
    setShowConfigModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Alerts & Incident Management System
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Real-time notifications generated when telemetry exceeds SLA thresholds or Isolation Forest flags anomalies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-200 border border-[#24262F] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Configure Threshold Rules</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded bg-[#111218] border border-[#24262F] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-[10px] uppercase font-bold">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2 py-1 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-[10px] uppercase font-bold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <span className="text-gray-500 font-mono text-[10px]">Showing {filteredAlerts.length} incidents</span>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#111218] border border-[#24262F] rounded p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
              <tr>
                <th className="p-2 text-[10px] uppercase">Time</th>
                <th className="p-2 text-[10px] uppercase">Alert Type</th>
                <th className="p-2 text-[10px] uppercase">Endpoint Path</th>
                <th className="p-2 text-[10px] uppercase">Severity</th>
                <th className="p-2 text-[10px] uppercase">Telemetry Metric</th>
                <th className="p-2 text-[10px] uppercase">Status</th>
                <th className="p-2 text-[10px] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {filteredAlerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-[#1A1C24]/50 transition-colors">
                  <td className="p-2 font-mono text-[10px] text-gray-500">
                    {new Date(alt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 font-bold text-white">{alt.alertType}</td>
                  <td className="p-2 font-mono font-bold text-gray-300">{alt.endpoint}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        alt.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : alt.severity === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {alt.severity}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-gray-300">{alt.metricValue} (SLA: {alt.thresholdValue})</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        alt.status === 'Active'
                          ? 'bg-red-500/10 text-red-400 animate-pulse'
                          : alt.status === 'Acknowledged'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {alt.status}
                    </span>
                  </td>
                  <td className="p-2">
                    {alt.status === 'Active' && (
                      <button
                        onClick={() => onUpdateAlertStatus(alt.id, 'Acknowledged')}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-600 hover:bg-amber-500 text-white mr-1"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alt.status !== 'Resolved' && (
                      <button
                        onClick={() => onUpdateAlertStatus(alt.id, 'Resolved')}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-600 hover:bg-green-500 text-white"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111218] border border-[#24262F] rounded max-w-md w-full p-4 shadow-2xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-[#24262F] pb-2">
              Configure SLA Alert Thresholds
            </h3>

            <form onSubmit={handleSaveThresholds} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Latency Warning Threshold (ms)</label>
                <input
                  type="number"
                  value={latWarn}
                  onChange={(e) => setLatWarn(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Latency Critical Threshold (ms)</label>
                <input
                  type="number"
                  value={latCrit}
                  onChange={(e) => setLatCrit(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Error Rate Warning Threshold (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={errWarn}
                  onChange={(e) => setErrWarn(parseFloat(e.target.value))}
                  className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#24262F]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 rounded bg-[#1A1C24] text-gray-300 font-bold text-xs hover:bg-[#24262F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
