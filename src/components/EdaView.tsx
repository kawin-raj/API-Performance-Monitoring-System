import React from 'react';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { EDAMetrics } from '../types.js';

interface EdaViewProps {
  eda: EDAMetrics;
}

export const EdaView: React.FC<EdaViewProps> = ({ eda }) => {
  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F]">
        <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Exploratory Data Analysis (EDA) & Correlations
        </h3>
        <p className="text-[10px] text-gray-500 font-mono">
          Statistical feature correlations, temporal traffic patterns, and system load impact curves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency by Hour of Day */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Peak Hour Latency Profile (00:00 - 23:00 UTC)</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eda.latencyByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#24262F" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} unit=":00" tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} unit="ms" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111218', borderColor: '#24262F', borderRadius: '4px', fontSize: '11px', color: '#e0e0e0' }} />
                <Line type="monotone" dataKey="avgLatency" name="Avg Latency (ms)" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Concurrency vs Latency Curve */}
        <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Concurrency Load Impact Curve</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eda.concurrencyVsLatency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#24262F" />
                <XAxis dataKey="concurrency" stroke="#6b7280" fontSize={10} unit=" rps" tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} unit="ms" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111218', borderColor: '#24262F', borderRadius: '4px', fontSize: '11px', color: '#e0e0e0' }} />
                <Bar dataKey="avgLatency" name="Response Latency (ms)" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Correlation Matrix Table */}
      <div className="p-4 rounded bg-[#111218] border border-[#24262F] space-y-3 shadow-sm">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Feature Pearson Correlation Matrix</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {eda.correlationMatrix.map((item) => (
            <div key={`${item.feature1}-${item.feature2}`} className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F] text-xs space-y-1">
              <div className="flex justify-between text-gray-400 text-[10px] uppercase font-bold">
                <span>{item.feature1} ↔ {item.feature2}</span>
              </div>
              <div className="text-sm font-mono font-bold text-indigo-300">
                r = {item.correlation}
              </div>
              <p className="text-[9px] text-gray-500 font-mono">
                {item.correlation > 0.75 ? '🔥 High Positive Correlation' : 'Moderate Correlation'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
