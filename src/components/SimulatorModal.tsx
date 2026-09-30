import React, { useState } from 'react';
import { X, Play, Zap, AlertTriangle, Cpu, HardDrive } from 'lucide-react';
import { APILog, Alert, TargetWebsite } from '../types.js';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (data: Partial<APILog>) => Promise<{ log: APILog; alertCreated?: Alert }>;
  targetWebsite?: TargetWebsite | null;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, onSimulate, targetWebsite }) => {
  if (!isOpen) return null;

  const defaultEp = targetWebsite?.detectedEndpoints?.[0]?.endpoint || '/api/v1/payments/process';
  const [endpoint, setEndpoint] = useState(defaultEp);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [statusCode, setStatusCode] = useState(200);
  const [responseTimeMs, setResponseTimeMs] = useState(140);
  const [concurrencyLevel, setConcurrencyLevel] = useState(80);
  const [payloadSizeKb, setPayloadSizeKb] = useState(35);
  const [cpuUsagePct, setCpuUsagePct] = useState(65);
  const [memUsagePct, setMemUsagePct] = useState(60);

  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ log: APILog; alertCreated?: Alert } | null>(null);

  const handleRunSimulation = async (customOverrides?: Partial<APILog>) => {
    setLoading(true);
    setLastResult(null);
    try {
      const payload: Partial<APILog> = customOverrides || {
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        concurrencyLevel,
        payloadSizeKb,
        cpuUsagePct,
        memUsagePct
      };

      const result = await onSimulate(payload);
      setLastResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111218] border border-[#24262F] rounded w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#24262F] bg-[#1A1C24]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-indigo-600/20 text-indigo-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">API Traffic & Anomaly Simulator</h3>
              <p className="text-[10px] text-gray-500 font-mono">Inject custom traffic parameters to test live Isolation Forest ML inference</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#24262F] text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {/* Quick Scenario Triggers */}
          <div className="p-3 rounded bg-[#1A1C24] border border-[#24262F] space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Preset Anomaly Scenarios:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEndpoint('/api/v1/payments/process');
                  setResponseTimeMs(850);
                  setConcurrencyLevel(180);
                  setCpuUsagePct(92);
                  setStatusCode(200);
                  handleRunSimulation({
                    endpoint: '/api/v1/payments/process',
                    method: 'POST',
                    responseTimeMs: 850,
                    concurrencyLevel: 180,
                    cpuUsagePct: 92,
                    statusCode: 200
                  });
                }}
                className="p-2 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold text-left transition-colors font-mono"
              >
                ⚡ Latency Spike (850ms)
              </button>

              <button
                type="button"
                onClick={() => {
                  setEndpoint('/api/v1/orders/checkout');
                  setStatusCode(500);
                  setResponseTimeMs(450);
                  setCpuUsagePct(88);
                  handleRunSimulation({
                    endpoint: '/api/v1/orders/checkout',
                    method: 'POST',
                    statusCode: 500,
                    responseTimeMs: 450,
                    cpuUsagePct: 88
                  });
                }}
                className="p-2 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-[11px] font-bold text-left transition-colors font-mono"
              >
                🔥 HTTP 500 Cascade
              </button>

              <button
                type="button"
                onClick={() => {
                  setEndpoint('/api/v1/search/catalog');
                  setConcurrencyLevel(220);
                  setCpuUsagePct(96);
                  setResponseTimeMs(620);
                  handleRunSimulation({
                    endpoint: '/api/v1/search/catalog',
                    method: 'GET',
                    concurrencyLevel: 220,
                    cpuUsagePct: 96,
                    responseTimeMs: 620
                  });
                }}
                className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-bold text-left transition-colors font-mono"
              >
                🌊 Traffic Surge (220 rps)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Endpoint */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">
                Target Endpoint ({targetWebsite?.domain || 'Website'})
              </label>
              <select
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
              >
                {targetWebsite?.detectedEndpoints && targetWebsite.detectedEndpoints.length > 0 ? (
                  targetWebsite.detectedEndpoints.map((ep) => (
                    <option key={ep.endpoint} value={ep.endpoint}>
                      [{ep.method}] {ep.endpoint}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="/api/v1/auth/login">/api/v1/auth/login</option>
                    <option value="/api/v1/users/profile">/api/v1/users/profile</option>
                    <option value="/api/v1/orders/checkout">/api/v1/orders/checkout</option>
                    <option value="/api/v1/payments/process">/api/v1/payments/process</option>
                    <option value="/api/v1/search/catalog">/api/v1/search/catalog</option>
                  </>
                )}
              </select>
            </div>

            {/* HTTP Method */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">HTTP Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* Latency MS */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">Response Time: {responseTimeMs} ms</label>
              <input
                type="range"
                min="10"
                max="1500"
                step="10"
                value={responseTimeMs}
                onChange={(e) => setResponseTimeMs(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Status Code */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">Status Code</label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value={200}>200 OK</option>
                <option value={201}>201 Created</option>
                <option value={400}>400 Bad Request</option>
                <option value={429}>429 Rate Limited</option>
                <option value={500}>500 Internal Error</option>
                <option value={503}>503 Service Unavailable</option>
              </select>
            </div>

            {/* Concurrency */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">Concurrency: {concurrencyLevel} rps</label>
              <input
                type="range"
                min="5"
                max="250"
                value={concurrencyLevel}
                onChange={(e) => setConcurrencyLevel(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* CPU Load % */}
            <div>
              <label className="block text-gray-400 font-bold text-[10px] uppercase mb-1">CPU Load: {cpuUsagePct}%</label>
              <input
                type="range"
                min="10"
                max="99"
                value={cpuUsagePct}
                onChange={(e) => setCpuUsagePct(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Simulation Output Card */}
          {lastResult && (
            <div className={`p-3 rounded border text-xs space-y-1.5 ${lastResult.log.isAnomaly ? 'bg-red-950/40 border-red-500/40' : 'bg-green-950/40 border-green-500/40'}`}>
              <div className="flex items-center justify-between font-bold">
                <span className={lastResult.log.isAnomaly ? 'text-red-300' : 'text-green-300'}>
                  {lastResult.log.isAnomaly ? '⚠️ ML Isolation Forest Flagged Anomaly' : '✓ Normal Telemetry Signature'}
                </span>
                <span className="font-mono text-gray-300 text-[10px]">Score: {lastResult.log.anomalyScore}</span>
              </div>
              <p className="text-gray-300 font-mono text-[11px]">{lastResult.log.anomalyReason || 'Telemetry executed within normal SLA parameters.'}</p>
              {lastResult.alertCreated && (
                <p className="text-red-400 text-[10px] font-bold font-mono">🚨 Instant Alert Created: {lastResult.alertCreated.message}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="w-full py-2 px-4 font-bold text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm flex items-center justify-center space-x-2 uppercase tracking-wider"
          >
            {loading ? <span>Evaluating ML Model...</span> : <span>Execute Simulation Request</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
