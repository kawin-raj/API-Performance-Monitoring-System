import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const SHORTCUTS_LIST = [
  { key: '⌘D / Ctrl+D', tab: 'dashboard' as NavTab, label: 'Executive Dashboard', desc: 'Overview of system telemetry, KPIs, and 24h trends' },
  { key: '⌘M / Ctrl+M', tab: 'monitoring' as NavTab, label: 'Live Monitoring', desc: 'Real-time endpoint latencies, status codes, and throughput' },
  { key: '⌘H / Ctrl+H', tab: 'ml_hub' as NavTab, label: 'Machine Learning Hub', desc: 'XGBoost latency forecasts, Isolation Forest, and accuracy curves' },
  { key: '⌘A / Ctrl+A', tab: 'alerts' as NavTab, label: 'Alerts & Incidents', desc: 'Manage active threshold violations and ML anomaly alerts' },
  { key: '⌘P / Ctrl+P', tab: 'reports' as NavTab, label: 'Automated Reports', desc: 'Daily/weekly audit summaries and PDF downloads' },
  { key: '⌘L / Ctrl+L', tab: 'logs' as NavTab, label: 'API Log Explorer', desc: 'Search and filter raw execution telemetry' },
  { key: '⌘U / Ctrl+U', tab: 'users' as NavTab, label: 'Admin & Users', desc: 'Role management and access control' },
  { key: '⌘B / Ctrl+B', tab: 'mca_docs' as NavTab, label: 'Project Documentation', desc: 'MCA architecture, algorithms, and models guide' },
  { key: '⌘K / Ctrl+K', action: 'shortcuts', label: 'Keyboard Shortcuts Sheet', desc: 'Open this navigation shortcuts modal' },
  { key: '⌘S / Ctrl+S', action: 'simulator', label: 'Traffic Simulator', desc: 'Trigger synthetic API load and chaos scenarios' }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, onSelectTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-xl bg-[#111218] border border-[#24262F] shadow-2xl p-5 space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#24262F]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-indigo-600/20 text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Global Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-gray-400">
                Navigate the entire APM platform at power-user speed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1A1C24] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS_LIST.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                if (item.tab) {
                  onSelectTab(item.tab);
                  onClose();
                }
              }}
              className={`flex items-center justify-between p-2.5 rounded border border-transparent hover:border-[#24262F] hover:bg-[#1A1C24] transition-all ${
                item.tab ? 'cursor-pointer' : ''
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">{item.label}</span>
                <span className="text-[10px] text-gray-400 font-mono">{item.desc}</span>
              </div>

              <kbd className="px-2 py-1 text-xs font-mono font-bold rounded bg-[#1A1C24] text-indigo-300 border border-[#24262F] shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-[#24262F] flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Tip: Press ESC or ⌘K at any time to close</span>
          <span className="text-indigo-400">macOS (⌘) · Windows/Linux (Ctrl)</span>
        </div>
      </div>
    </div>
  );
};
