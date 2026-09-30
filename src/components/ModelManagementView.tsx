import React, { useState } from 'react';
import { Cpu, RefreshCw, CheckCircle2, Sliders, BarChart3, ShieldCheck } from 'lucide-react';
import { ModelMetrics, APILog } from '../types.js';
import { ModelHealthIndicator } from './ModelHealthIndicator.js';
import { LatencyAccuracyChart } from './LatencyAccuracyChart.js';

interface ModelManagementViewProps {
  models: ModelMetrics[];
  logs?: APILog[];
  onRetrain: () => Promise<{ message: string; models: ModelMetrics[] }>;
}

export const ModelManagementView: React.FC<ModelManagementViewProps> = ({ models, logs = [], onRetrain }) => {
  const [retraining, setRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState<string | null>(null);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMessage(null);
    try {
      const res = await onRetrain();
      setRetrainMessage(res.message);
    } catch (err) {
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Retrain Action */}
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            ML Models & Evaluation Metrics
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Trained XGBoost Regressor and Isolation Forest model evaluation parameters.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Refitting Model Weights...' : 'Retrain Models Now'}</span>
        </button>
      </div>

      {retrainMessage && (
        <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{retrainMessage}</span>
        </div>
      )}

      {/* Models Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {models.map((m) => (
          <div key={m.modelName} className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#24262F] pb-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-400 block">
                  {m.type}
                </span>
                <h4 className="font-bold text-sm text-white">{m.modelName}</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{m.algorithm}</p>
              </div>

              {/* Visual Health Indicator: Green checkmark vs warning icon */}
              <ModelHealthIndicator model={m} showDetails={true} />
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Model Performance</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {m.type === 'Regression' ? (
                  <>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">R² Score</span>
                      <span className="text-base font-mono font-bold text-indigo-300">{m.accuracyMetrics.r2Score}</span>
                    </div>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">RMSE (ms)</span>
                      <span className="text-base font-mono font-bold text-green-400">{m.accuracyMetrics.rmse}</span>
                    </div>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">MAE (ms)</span>
                      <span className="text-base font-mono font-bold text-cyan-300">{m.accuracyMetrics.mae}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">F1-Score</span>
                      <span className="text-base font-mono font-bold text-indigo-300">{m.accuracyMetrics.f1Score}</span>
                    </div>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Precision</span>
                      <span className="text-base font-mono font-bold text-green-400">{m.accuracyMetrics.precision}</span>
                    </div>
                    <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">ROC-AUC</span>
                      <span className="text-base font-mono font-bold text-cyan-300">{m.accuracyMetrics.rocAuc}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Feature Importance Rankings */}
            <div className="space-y-1.5 pt-2 border-t border-[#24262F]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Feature Importance Weights</span>
              <div className="space-y-1.5 text-xs">
                {m.featureImportance.map((f) => (
                  <div key={f.feature} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{f.feature}</span>
                      <span className="font-mono text-white font-bold">{f.importancePct}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1C24] rounded overflow-hidden border border-[#24262F]">
                      <div
                        className="h-full bg-indigo-500 rounded"
                        style={{ width: `${f.importancePct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between text-[9px] text-gray-500 pt-2 border-t border-[#24262F] font-mono">
              <span>Samples: {m.totalSamples.toLocaleString()}</span>
              <span>Last Trained: {new Date(m.lastTrained).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Latency Accuracy Line Chart: Predicted vs Actual over Time */}
      <LatencyAccuracyChart
        logs={logs}
        title="XGBoost Accuracy: Predicted vs Actual Latency & Residual Error"
        subtitle="Live evaluation of XGBoost regression accuracy comparing predicted latency vs ground-truth actual latency"
      />
    </div>
  );
};
