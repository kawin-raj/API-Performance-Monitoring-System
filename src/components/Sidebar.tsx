import React from 'react';
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  AlertTriangle,
  FileSpreadsheet,
  ListFilter,
  Users,
  BookOpen
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'monitoring'
  | 'ml_hub'
  | 'alerts'
  | 'reports'
  | 'logs'
  | 'users'
  | 'mca_docs';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertCount: number;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, activeAlertCount, onOpenShortcuts }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Executive Dashboard', icon: LayoutDashboard, shortcut: '⌘D' },
    { id: 'monitoring' as NavTab, label: 'Live Monitoring', icon: Activity, shortcut: '⌘M' },
    { id: 'ml_hub' as NavTab, label: 'Machine Learning Hub', icon: BrainCircuit, badge: 'ML', shortcut: '⌘H' },
    { id: 'alerts' as NavTab, label: 'Alerts & Incidents', icon: AlertTriangle, count: activeAlertCount, shortcut: '⌘A' },
    { id: 'reports' as NavTab, label: 'Automated Reports', icon: FileSpreadsheet, shortcut: '⌘P' },
    { id: 'logs' as NavTab, label: 'API Log Explorer', icon: ListFilter, shortcut: '⌘L' },
    { id: 'users' as NavTab, label: 'Admin & Users', icon: Users, shortcut: '⌘U' },
    { id: 'mca_docs' as NavTab, label: 'MCA Project Docs', icon: BookOpen, highlight: true, shortcut: '⌘B' },
  ];

  return (
    <aside className="w-64 bg-[#111218] border-r border-[#24262F] flex flex-col justify-between shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-2 space-y-0.5">
        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span>Core Navigation</span>
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="text-[9px] font-mono text-gray-400 hover:text-indigo-400 flex items-center gap-1"
              title="Show keyboard shortcuts (⌘K)"
            >
              <span>⌘K</span>
            </button>
          )}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-600'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1C24]'
              } ${item.highlight ? 'bg-indigo-950/20 text-indigo-300' : ''}`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : item.highlight ? 'text-indigo-400' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-red-500 text-white font-mono">
                    {item.count}
                  </span>
                )}

                <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono text-gray-500 bg-[#1A1C24] rounded border border-[#24262F]">
                  {item.shortcut}
                </kbd>
              </div>
            </button>
          );
        })}
      </div>

      {/* MCA Footer badge */}
      <div className="p-3 m-2 rounded bg-[#1A1C24] border border-[#24262F] text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-gray-200">
          <span className="uppercase text-[10px] text-gray-400">MCA Final Project</span>
          <span className="text-[10px] text-green-400 font-mono">v2.4 ML</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">
          Intelligent API Monitoring & Anomaly Detection System
        </p>
      </div>
    </aside>
  );
};
