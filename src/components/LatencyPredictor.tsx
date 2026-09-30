import React, { useState } from 'react';
import { BrainCircuit, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react';
import { MLPredictionInput, MLPredictionOutput } from '../types.js';

interface LatencyPredictorProps {
  onPredict: (input: MLPredictionInput) => Promise<MLPredictionOutput>;
}

export const LatencyPredictor: React.FC<LatencyPredictorProps> = ({ onPredict }) => {
  const [endpoint, setEndpoint] = useState('/api/v1/payments/process');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [concurrencyLevel, setConcurrencyLevel] = useState(120);
  const [payloadSizeKb, setPayloadSizeKb] = useState(45);
  const [cpuUsagePct, setCpuUsagePct] = useState(78);
  const [memUsagePct, setMemUsagePct] = useState(65);
  const [hourOfDay, setHourOfDay] = useState(14);
  const [dayOfWeek, setDayOfWeek] = useState(2);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<MLPredictionOutput | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await onPredict({
        endpoint,
        method,
        concurrencyLevel,
        payloadSizeKb,
        cpuUsagePct,
        memUsagePct,
        hourOfDay,
        dayOfWeek
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-3.5 rounded bg-[#111218] border border-indigo-600/30 flex items-center space-x-3">
        <div className="p-2 rounded bg-indigo-600/20 text-indigo-400">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">XGBoost Latency & SLA Predictor</h3>
          <p className="text-[10px] text-gray-400 font-mono">
            Forecast API response times and SLA breaches under custom traffic loads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prediction Form */}
        <form onSubmit={handlePredict} className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 text-xs">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200 border-b border-[#24262F] pb-2">Simulation Parameters</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">API Endpoint</label>
              <select
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="/api/v1/auth/login">/api/v1/auth/login</option>
                <option value="/api/v1/users/profile">/api/v1/users/profile</option>
                <option value="/api/v1/orders/checkout">/api/v1/orders/checkout</option>
                <option value="/api/v1/payments/process">/api/v1/payments/process</option>
                <option value="/api/v1/search/catalog">/api/v1/search/catalog</option>
                <option value="/api/v1/analytics/report">/api/v1/analytics/report</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">HTTP Method</label>
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

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">
                Concurrency: <span className="text-indigo-400 font-mono font-bold">{concurrencyLevel} rps</span>
              </label>
              <input
                type="range"
                min="5"
                max="250"
                value={concurrencyLevel}
                onChange={(e) => setConcurrencyLevel(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">
                Payload Size: <span className="text-indigo-400 font-mono font-bold">{payloadSizeKb} KB</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                value={payloadSizeKb}
                onChange={(e) => setPayloadSizeKb(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">
                CPU Usage: <span className="text-indigo-400 font-mono font-bold">{cpuUsagePct}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="99"
                value={cpuUsagePct}
                onChange={(e) => setCpuUsagePct(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">
                Memory Usage: <span className="text-indigo-400 font-mono font-bold">{memUsagePct}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="99"
                value={memUsagePct}
                onChange={(e) => setMemUsagePct(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">
                Hour of Day: <span className="text-indigo-400 font-mono font-bold">{hourOfDay}:00 UTC</span>
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={hourOfDay}
                onChange={(e) => setHourOfDay(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-[#1A1C24] border border-[#24262F] rounded text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value={0}>Monday</option>
                <option value={1}>Tuesday</option>
                <option value={2}>Wednesday</option>
                <option value={3}>Thursday</option>
                <option value={4}>Friday</option>
                <option value={5}>Saturday</option>
                <option value={6}>Sunday</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm flex items-center justify-center space-x-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Running ML Inference...' : 'Run XGBoost Prediction'}</span>
          </button>
        </form>

        {/* Prediction Results Display */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200 border-b border-[#24262F] pb-2">Prediction Output</h4>

          {!prediction ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <BrainCircuit className="w-8 h-8 mx-auto text-gray-600 animate-pulse" />
              <p className="text-xs">Select parameters and click predict to generate latency forecasts.</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Predicted Latency</span>
                  <div className="text-2xl font-mono font-bold text-indigo-300">
                    {prediction.predictedLatencyMs} <span className="text-xs font-normal">ms</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{prediction.latencyCategory}</span>
                </div>

                <div className="p-3 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Failure Risk</span>
                  <div className={`text-2xl font-mono font-bold ${prediction.failureProbabilityPct > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {prediction.failureProbabilityPct}%
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Confidence: {prediction.confidenceScorePct}%</span>
                </div>
              </div>

              {/* Health Category Pill */}
              <div className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F] flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[10px] uppercase font-bold">Predicted Health:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  prediction.healthStatus === 'Healthy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  prediction.healthStatus === 'At-Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {prediction.healthStatus}
                </span>
              </div>

              {/* Feature Importance Impacts */}
              <div className="space-y-2 text-xs">
                <span className="text-gray-300 font-bold text-[10px] uppercase block">Feature Feature Importance</span>
                {prediction.contributingFeatures.map((feat) => (
                  <div key={feat.feature} className="space-y-1">
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>{feat.feature}</span>
                      <span className="font-mono text-white font-bold">{feat.impactPct}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1C24] rounded overflow-hidden border border-[#24262F]">
                      <div
                        className="h-full bg-indigo-500 rounded"
                        style={{ width: `${feat.impactPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
