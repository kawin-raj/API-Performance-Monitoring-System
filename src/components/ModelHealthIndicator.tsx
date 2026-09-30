import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ModelMetrics } from '../types.js';

export interface ModelThresholdConfig {
  r2ScoreMin: number;
  rmseMax: number;
  maeMax: number;
  f1ScoreMin: number;
  precisionMin: number;
  rocAucMin: number;
}

export const DEFAULT_ML_THRESHOLDS: ModelThresholdConfig = {
  r2ScoreMin: 0.80,
  rmseMax: 35.0,
  maeMax: 25.0,
  f1ScoreMin: 0.80,
  precisionMin: 0.80,
  rocAucMin: 0.85,
};

export interface MetricEvaluationResult {
  name: string;
  current: number;
  threshold: number;
  operator: '≥' | '≤';
  passed: boolean;
  unit?: string;
}

export function evaluateModelHealth(
  model: ModelMetrics,
  thresholds: ModelThresholdConfig = DEFAULT_ML_THRESHOLDS
): {
  isHealthy: boolean;
  results: MetricEvaluationResult[];
} {
  const m = model.accuracyMetrics;
  const results: MetricEvaluationResult[] = [];

  if (model.type === 'Regression') {
    if (m.r2Score !== undefined) {
      results.push({
        name: 'R² Score',
        current: m.r2Score,
        threshold: thresholds.r2ScoreMin,
        operator: '≥',
        passed: m.r2Score >= thresholds.r2ScoreMin,
      });
    }
    if (m.rmse !== undefined) {
      results.push({
        name: 'RMSE',
        current: m.rmse,
        threshold: thresholds.rmseMax,
        operator: '≤',
        passed: m.rmse <= thresholds.rmseMax,
        unit: 'ms'
      });
    }
    if (m.mae !== undefined) {
      results.push({
        name: 'MAE',
        current: m.mae,
        threshold: thresholds.maeMax,
        operator: '≤',
        passed: m.mae <= thresholds.maeMax,
        unit: 'ms'
      });
    }
  } else {
    if (m.f1Score !== undefined) {
      results.push({
        name: 'F1-Score',
        current: m.f1Score,
        threshold: thresholds.f1ScoreMin,
        operator: '≥',
        passed: m.f1Score >= thresholds.f1ScoreMin,
      });
    }
    if (m.precision !== undefined) {
      results.push({
        name: 'Precision',
        current: m.precision,
        threshold: thresholds.precisionMin,
        operator: '≥',
        passed: m.precision >= thresholds.precisionMin,
      });
    }
    if (m.rocAuc !== undefined) {
      results.push({
        name: 'ROC-AUC',
        current: m.rocAuc,
        threshold: thresholds.rocAucMin,
        operator: '≥',
        passed: m.rocAuc >= thresholds.rocAucMin,
      });
    }
  }

  const isHealthy = results.length > 0 && results.every((r) => r.passed);
  return { isHealthy, results };
}

interface ModelHealthIndicatorProps {
  model: ModelMetrics;
  thresholds?: ModelThresholdConfig;
  showDetails?: boolean;
}

/**
 * Visual health indicator component for an individual ML model.
 * Displays a green checkmark if all evaluation metrics meet desired thresholds,
 * or a warning icon otherwise.
 */
export const ModelHealthIndicator: React.FC<ModelHealthIndicatorProps> = ({
  model,
  thresholds = DEFAULT_ML_THRESHOLDS,
  showDetails = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const { isHealthy, results } = evaluateModelHealth(model, thresholds);

  return (
    <div className="inline-flex flex-col">
      <div className="flex items-center gap-2">
        {isHealthy ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold tracking-wide shadow-sm"
            title="All evaluation metrics meet the target SLA thresholds"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Healthy</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold tracking-wide shadow-sm"
            title="Evaluation metrics below desired threshold - model retraining recommended"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span>Warning · SLA Breach</span>
          </div>
        )}

        {showDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1A1C24] transition-colors"
            title="Toggle metric threshold breakdown"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showDetails && expanded && (
        <div className="mt-2 p-2 rounded bg-[#1A1C24] border border-[#24262F] space-y-1.5 text-[10px]">
          <span className="font-bold text-gray-400 uppercase tracking-wider block">Threshold Status</span>
          <div className="space-y-1">
            {results.map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-3 font-mono">
                <span className="text-gray-300">{r.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">
                    {r.current}{r.unit ? ` ${r.unit}` : ''} ({r.operator} {r.threshold})
                  </span>
                  {r.passed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MLModelsHealthOverviewProps {
  models: ModelMetrics[];
  onNavigateToModels?: () => void;
}

/**
 * Visual Health Banner for the MLHub tab, assessing all active models
 * and displaying green checkmarks or warning icons per model and overall.
 */
export const MLModelsHealthOverview: React.FC<MLModelsHealthOverviewProps> = ({
  models,
  onNavigateToModels
}) => {
  const [thresholds, setThresholds] = useState<ModelThresholdConfig>(DEFAULT_ML_THRESHOLDS);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Evaluate all models
  const evaluations = models.map((m) => ({
    model: m,
    ...evaluateModelHealth(m, thresholds)
  }));

  const allHealthy = evaluations.length > 0 && evaluations.every((e) => e.isHealthy);
  const passedCount = evaluations.filter((e) => e.isHealthy).length;

  return (
    <div className="p-4 rounded bg-[#111218] border border-[#24262F] shadow-sm space-y-3.5">
      {/* Top row: Status header & action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24262F]">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border ${
              allHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {allHealthy ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                ML Models Health Indicator
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  allHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {allHealthy ? 'STATUS: HEALTHY' : 'STATUS: WARNING'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Verification against desired production accuracy & error thresholds ({passedCount}/{evaluations.length} Passing)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-300 border border-[#24262F] transition-colors"
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
            <span>{isCustomizing ? 'Hide Thresholds' : 'Threshold Settings'}</span>
          </button>
          {onNavigateToModels && (
            <button
              type="button"
              onClick={onNavigateToModels}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-600/30 transition-colors"
            >
              <span>Retrain View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Threshold customizer panel */}
      {isCustomizing && (
        <div className="p-3 rounded bg-[#1A1C24] border border-[#24262F] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-300 text-[11px] uppercase">
              Evaluation Metric Threshold SLA Settings
            </span>
            <button
              type="button"
              onClick={() => setThresholds(DEFAULT_ML_THRESHOLDS)}
              className="text-[10px] text-indigo-400 hover:underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">R² Min (XGBoost)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={thresholds.r2ScoreMin}
                onChange={(e) => setThresholds({ ...thresholds, r2ScoreMin: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">RMSE Max (ms)</label>
              <input
                type="number"
                step="1"
                value={thresholds.rmseMax}
                onChange={(e) => setThresholds({ ...thresholds, rmseMax: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">MAE Max (ms)</label>
              <input
                type="number"
                step="1"
                value={thresholds.maeMax}
                onChange={(e) => setThresholds({ ...thresholds, maeMax: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">F1-Score Min (iForest)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={thresholds.f1ScoreMin}
                onChange={(e) => setThresholds({ ...thresholds, f1ScoreMin: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Precision Min</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={thresholds.precisionMin}
                onChange={(e) => setThresholds({ ...thresholds, precisionMin: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">ROC-AUC Min</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={thresholds.rocAucMin}
                onChange={(e) => setThresholds({ ...thresholds, rocAucMin: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#111218] border border-[#24262F] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evaluations.map(({ model, isHealthy, results }) => (
          <div
            key={model.modelName}
            className={`p-3 rounded-lg border transition-all ${
              isHealthy
                ? 'bg-[#1A1C24]/80 border-emerald-500/20'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-400 block">
                  {model.type}
                </span>
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  {model.modelName}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono">{model.algorithm}</p>
              </div>

              {/* Visual Health Indicator Icon: Green checkmark vs Warning icon */}
              {isHealthy ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Healthy</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Threshold Warning</span>
                </div>
              )}
            </div>

            {/* Checklist of metrics evaluated against thresholds */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#24262F]">
              {results.map((r) => (
                <div
                  key={r.name}
                  className={`p-1.5 rounded border text-center ${
                    r.passed
                      ? 'bg-[#111218] border-emerald-500/20'
                      : 'bg-amber-950/30 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 mb-0.5">
                    <span>{r.name}</span>
                    {r.passed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    {r.current}{r.unit ? ` ${r.unit}` : ''}
                  </div>
                  <div className="text-[8px] font-mono text-gray-500">
                    {r.operator} {r.threshold}{r.unit ? ` ${r.unit}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
