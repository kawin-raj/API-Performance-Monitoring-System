import React, { useState, useMemo } from 'react';
import { ListFilter, Search, Download, AlertTriangle, CheckCircle, Filter, X } from 'lucide-react';
import { APILog } from '../types.js';

interface LogExplorerProps {
  logs: APILog[];
}

export const LogExplorer: React.FC<LogExplorerProps> = ({ logs }) => {
  const [filterText, setFilterText] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Extract unique endpoints for autocomplete suggestions
  const uniqueEndpoints = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.endpoint))).sort();
  }, [logs]);

  // Real-time filtering by endpoint or status code
  const filteredLogs = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return logs.filter((log) => {
      const matchFilter =
        !q ||
        log.endpoint.toLowerCase().includes(q) ||
        log.statusCode.toString().includes(q);

      const matchAnom = !anomalyOnly || log.isAnomaly;
      return matchFilter && matchAnom;
    });
  }, [logs, filterText, anomalyOnly]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleFilterChange = (val: string) => {
    setFilterText(val);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['ID,Timestamp,Endpoint,Method,StatusCode,LatencyMs,PayloadKb,Concurrency,CPU,Memory,IsAnomaly,AnomalyScore\n'];
    const rows = filteredLogs.map(l =>
      `"${l.id}","${l.timestamp}","${l.endpoint}","${l.method}",${l.statusCode},${l.responseTimeMs},${l.payloadSizeKb},${l.concurrencyLevel},${l.cpuUsagePct},${l.memUsagePct},${l.isAnomaly},${l.anomalyScore}`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_logs_export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-indigo-400" />
            Raw Telemetry Log Explorer
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Search, filter, and export detailed HTTP request executions and isolation scores.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-200 border border-[#24262F] transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Real-time Search & Filter Bar */}
      <div className="p-3 rounded bg-[#111218] border border-[#24262F] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-2.5 flex-1 max-w-3xl">
          {/* Real-time Filter Text Input: Endpoint or Status Code */}
          <div className="relative flex-1 min-w-[280px]">
            <Filter className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              list="endpoint-and-status-options"
              placeholder="Filter by endpoint or status code (e.g. /checkout, 200, 500)..."
              value={filterText}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-500"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => handleFilterChange('')}
                className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-white rounded transition-colors"
                title="Clear filter text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <datalist id="endpoint-and-status-options">
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="400">400 Bad Request</option>
              <option value="429">429 Rate Limit</option>
              <option value="500">500 Server Error</option>
              <option value="503">503 Service Unavailable</option>
              {uniqueEndpoints.map((ep) => (
                <option key={ep} value={ep} />
              ))}
            </datalist>
          </div>

          {/* Quick status code shortcuts */}
          <div className="flex items-center bg-[#1A1C24] p-0.5 rounded border border-[#24262F] text-[10px]">
            <button
              type="button"
              onClick={() => handleFilterChange('')}
              className={`px-2 py-1 rounded transition-colors ${
                !filterText ? 'bg-[#24262F] text-white font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('200')}
              className={`px-2 py-1 rounded transition-colors ${
                filterText === '200' ? 'bg-[#24262F] text-emerald-400 font-bold' : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              200
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('429')}
              className={`px-2 py-1 rounded transition-colors ${
                filterText === '429' ? 'bg-[#24262F] text-amber-400 font-bold' : 'text-gray-400 hover:text-amber-400'
              }`}
            >
              429
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('500')}
              className={`px-2 py-1 rounded transition-colors ${
                filterText === '500' ? 'bg-[#24262F] text-rose-400 font-bold' : 'text-gray-400 hover:text-rose-400'
              }`}
            >
              500
            </button>
          </div>

          <label className="flex items-center space-x-1.5 text-gray-300 cursor-pointer font-bold text-[10px] uppercase ml-1">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={(e) => {
                setAnomalyOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="accent-indigo-600 rounded"
            />
            <span>Anomalies Only</span>
          </label>
        </div>

        <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px]">
          {filterText && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Filter: "{filterText}"
            </span>
          )}
          <span>Showing {filteredLogs.length} of {logs.length} records</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111218] border border-[#24262F] rounded p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
              <tr>
                <th className="p-2 text-[10px] uppercase">Time</th>
                <th className="p-2 text-[10px] uppercase">Endpoint</th>
                <th className="p-2 text-[10px] uppercase">Method</th>
                <th className="p-2 text-[10px] uppercase">Status</th>
                <th className="p-2 text-[10px] uppercase">Latency</th>
                <th className="p-2 text-[10px] uppercase">Payload</th>
                <th className="p-2 text-[10px] uppercase">Concurrency</th>
                <th className="p-2 text-[10px] uppercase">CPU %</th>
                <th className="p-2 text-[10px] uppercase">Anomaly Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 font-mono text-xs">
                    No log records match endpoint or status code filter "{filterText}".
                    <button
                      type="button"
                      onClick={() => handleFilterChange('')}
                      className="block mx-auto mt-2 text-indigo-400 hover:underline text-[11px] font-bold"
                    >
                      Clear filter
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l) => (
                  <tr key={l.id} className={`hover:bg-[#1A1C24]/50 transition-colors ${l.isAnomaly ? 'bg-red-950/20' : ''}`}>
                    <td className="p-2 font-mono text-[10px] text-gray-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2 font-mono font-bold text-white">{l.endpoint}</td>
                    <td className="p-2 font-bold font-mono">{l.method}</td>
                    <td className="p-2 font-mono font-bold text-amber-400">{l.statusCode}</td>
                    <td className="p-2 font-mono font-bold text-white">{l.responseTimeMs} ms</td>
                    <td className="p-2 font-mono text-gray-400">{l.payloadSizeKb} KB</td>
                    <td className="p-2 font-mono text-gray-300">{l.concurrencyLevel} rps</td>
                    <td className="p-2 font-mono text-gray-300">{l.cpuUsagePct}%</td>
                    <td className="p-2 font-mono">
                      {l.isAnomaly ? (
                        <span className="text-red-400 font-bold">⚠️ {l.anomalyScore}</span>
                      ) : (
                        <span className="text-green-400 font-normal">{l.anomalyScore}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3 border-t border-[#24262F] text-xs text-gray-400 font-mono">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-[#1A1C24] border border-[#24262F] disabled:opacity-50 text-gray-200 font-bold hover:bg-[#24262F]"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-[#1A1C24] border border-[#24262F] disabled:opacity-50 text-gray-200 font-bold hover:bg-[#24262F]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
