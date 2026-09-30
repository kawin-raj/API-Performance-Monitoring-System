import React, { useState } from 'react';
import { BrainCircuit, AlertTriangle, Cpu, BarChart3, TrendingUp, Flame } from 'lucide-react';
import { LatencyPredictor } from './LatencyPredictor.js';
import { AnomalyDetectionView } from './AnomalyDetectionView.js';
import { ModelManagementView } from './ModelManagementView.js';
import { EdaView } from './EdaView.js';
import { LatencyAccuracyChart } from './LatencyAccuracyChart.js';
import { MLModelsHealthOverview } from './ModelHealthIndicator.js';
import { TemporalAnomalyHeatmap } from './TemporalAnomalyHeatmap.js';
import { APILog, MLPredictionInput, MLPredictionOutput, ModelMetrics, EDAMetrics } from '../types.js';

interface MLHubProps {
  anomalies: APILog[];
  scatterPoints: any[];
  models: ModelMetrics[];
  eda: EDAMetrics;
  logs?: APILog[];
  onPredict: (input: MLPredictionInput) => Promise<MLPredictionOutput>;
  onRetrain: () => Promise<{ message: string; models: ModelMetrics[] }>;
}

export const MLHub: React.FC<MLHubProps> = ({
  anomalies,
  scatterPoints,
  models,
  eda,
  logs = [],
  onPredict,
  onRetrain
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'predict' | 'accuracy' | 'heatmap' | 'anomalies' | 'models' | 'eda'>('predict');

  const subNav = [
    { id: 'predict' as const, label: 'XGBoost Latency Predictor', icon: BrainCircuit },
    { id: 'accuracy' as const, label: 'Predicted vs Actual Accuracy', icon: TrendingUp },
    { id: 'heatmap' as const, label: 'Time-of-Day Anomaly Heatmap', icon: Flame },
    { id: 'anomalies' as const, label: 'Isolation Forest Anomalies', icon: AlertTriangle },
    { id: 'models' as const, label: 'Model Evaluation & Retraining', icon: Cpu },
    { id: 'eda' as const, label: 'EDA & Feature Correlations', icon: BarChart3 }
  ];

  const activeLogs = logs.length > 0 ? logs : anomalies;

  return (
    <div className="space-y-6">
      {/* Visual Health Indicator Component for ML Models */}
      <MLModelsHealthOverview
        models={models}
        onNavigateToModels={() => setActiveSubTab('models')}
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#24262F] pb-3 overflow-x-auto">
        {subNav.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-[#111218] text-gray-400 hover:text-white hover:bg-[#1A1C24] border-[#24262F]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeSubTab === 'predict' && <LatencyPredictor onPredict={onPredict} />}
      {activeSubTab === 'accuracy' && (
        <LatencyAccuracyChart
          logs={activeLogs}
          title="XGBoost Latency Accuracy: Predicted vs Actual & Residuals"
          subtitle="Real-time sequential evaluation tracking XGBoost model inference against actual server latency over time"
        />
      )}
      {activeSubTab === 'heatmap' && (
        <TemporalAnomalyHeatmap
          anomalies={anomalies}
          logs={activeLogs}
          scatterPoints={scatterPoints}
        />
      )}
      {activeSubTab === 'anomalies' && (
        <AnomalyDetectionView
          anomalies={anomalies}
          scatterPoints={scatterPoints}
          onNavigateToHeatmap={() => setActiveSubTab('heatmap')}
        />
      )}
      {activeSubTab === 'models' && <ModelManagementView models={models} logs={activeLogs} onRetrain={onRetrain} />}
      {activeSubTab === 'eda' && <EdaView eda={eda} />}
    </div>
  );
};

