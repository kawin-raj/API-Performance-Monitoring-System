import React, { useState } from 'react';
import { Activity, Bell, Play, Moon, Sun, ShieldCheck, Database, FileText, ChevronDown, Keyboard } from 'lucide-react';
import { User, Alert } from '../types.js';

interface NavbarProps {
  currentUser: User;
  activeAlerts: Alert[];
  onOpenSimulator: () => void;
  onNavigateToAlerts: () => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeAlerts,
  onOpenSimulator,
  onNavigateToAlerts,
  onSwitchUser,
  allUsers,
  darkMode,
  onToggleDarkMode,
  onOpenShortcuts
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const activeAlertCount = activeAlerts.filter(a => a.status === 'Active').length;

  return (
    <header className="sticky top-0 z-40 bg-[#0D0E14] border-b border-[#24262F] text-[#E0E0E0] px-4 py-2.5 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand & Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-tight text-white">
                Sentinel API<span className="text-indigo-400 font-mono text-xs ml-1">.AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                ML Intelligence
              </span>
            </div>
            <p className="text-[10px] text-gray-500 hidden sm:block uppercase tracking-wider font-medium">
              API Performance & Anomaly Detection System
            </p>
          </div>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="flex items-center space-x-3">
          {/* Traffic Simulator Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            title="Open Interactive API Traffic Simulator"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">API Simulator</span>
          </button>

          {/* Keyboard Shortcuts Sheet Button */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#111218] hover:bg-[#1A1C24] text-gray-300 border border-[#24262F] transition-colors text-xs"
              title="Keyboard Shortcuts (⌘K)"
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline text-[11px] font-mono text-gray-400">⌘K</span>
            </button>
          )}

          {/* Active Alerts Badge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded bg-[#111218] hover:bg-[#1A1C24] text-gray-300 border border-[#24262F] transition-colors"
              title="View Active Alerts"
            >
              <Bell className="w-4 h-4 text-gray-300" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500 text-white shadow-sm">
                  {activeAlertCount}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#111218] border border-[#24262F] rounded-lg shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#24262F]">
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Active Incidents ({activeAlertCount})</span>
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigateToAlerts();
                    }}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeAlerts.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No active alerts. All systems healthy!</p>
                  ) : (
                    activeAlerts.slice(0, 4).map(alert => (
                      <div key={alert.id} className="p-2 rounded bg-[#1A1C24] border border-[#24262F] text-xs">
                        <div className="flex items-center justify-between text-gray-300 mb-1">
                          <span className="font-semibold text-red-400 text-[10px] uppercase">{alert.alertType}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-300 truncate text-xs">{alert.message}</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{alert.endpoint} ({alert.metricValue})</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded bg-[#111218] hover:bg-[#1A1C24] border border-[#24262F] transition-colors"
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded object-cover" />
              <div className="text-left hidden lg:block text-xs">
                <span className="font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-indigo-400 block leading-tight uppercase font-semibold">{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#111218] border border-[#24262F] rounded-lg shadow-2xl p-2 z-50">
                <div className="px-2 py-1.5 text-xs border-b border-[#24262F] mb-1">
                  <span className="text-gray-500 block text-[10px] uppercase">Logged in as</span>
                  <span className="font-semibold text-white">{currentUser.email}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 py-1">Switch Persona</div>
                {allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                      u.id === currentUser.id ? 'bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-600' : 'hover:bg-[#1A1C24] text-gray-300'
                    }`}
                  >
                    <span>{u.name}</span>
                    <span className="text-[10px] opacity-75 uppercase">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
