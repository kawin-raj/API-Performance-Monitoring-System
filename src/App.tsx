import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { TargetWebsiteBar } from './components/TargetWebsiteBar.js';
import { DashboardOverview } from './components/DashboardOverview.js';
import { LiveMonitoring } from './components/LiveMonitoring.js';
import { MLHub } from './components/MLHub.js';
import { AlertsManager } from './components/AlertsManager.js';
import { ReportsView } from './components/ReportsView.js';
import { LogExplorer } from './components/LogExplorer.js';
import { AdminUsers } from './components/AdminUsers.js';
import { McaDocsViewer } from './components/McaDocsViewer.js';
import { SimulatorModal } from './components/SimulatorModal.js';
import { ShortcutsModal } from './components/ShortcutsModal.js';
import {
  fetchDashboardStats,
  fetchEndpointMetrics,
  fetchLogs,
  simulateTraffic,
  predictLatency,
  fetchAnomalies,
  fetchMLModels,
  retrainMLModels,
  fetchEDA,
  fetchAlerts,
  updateAlertStatus,
  fetchReports,
  generateReport,
  fetchUsers,
  fetchThresholds,
  updateThresholds,
  fetchTargetWebsite,
  setTargetWebsite,
  pingTargetWebsite
} from './services/api.js';
import {
  SystemStats,
  EndpointMetric,
  APILog,
  Alert,
  PerformanceReport,
  User,
  ModelMetrics,
  EDAMetrics,
  SystemThresholds,
  MLPredictionInput,
  MLPredictionOutput,
  TargetWebsite
} from './types.js';

const DEFAULT_USER: User = {
  id: 'u-admin-01',
  name: 'System Admin',
  email: 'admin@apimonitor.internal',
  role: 'Admin',
  createdAt: new Date().toISOString()
};

const DEFAULT_THRESHOLDS: SystemThresholds = {
  latencyWarningMs: 250,
  latencyCriticalMs: 600,
  errorRateWarningPct: 3.0,
  errorRateCriticalPct: 8.0,
  anomalyScoreThreshold: 0.60
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<{ label: string; key: string } | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Core Data States
  const [targetWebsite, setTargetWebsiteState] = useState<TargetWebsite | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([]);
  const [logs, setLogs] = useState<APILog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [anomalies, setAnomalies] = useState<APILog[]>([]);
  const [scatterPoints, setScatterPoints] = useState<any[]>([]);
  const [eda, setEda] = useState<EDAMetrics | null>(null);
  const [thresholds, setThresholds] = useState<SystemThresholds | null>(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initial Data Fetch with Graceful Degradation
  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        fetchTargetWebsite(),
        fetchDashboardStats(),
        fetchLogs({ limit: 200 }),
        fetchAlerts(),
        fetchReports(),
        fetchUsers(),
        fetchMLModels(),
        fetchAnomalies(),
        fetchEDA(),
        fetchThresholds()
      ]);

      const [
        targetRes,
        dashRes,
        logsRes,
        alertsRes,
        reportsRes,
        usersRes,
        modelsRes,
        anomRes,
        edaRes,
        threshRes
      ] = results;

      if (targetRes.status === 'fulfilled') setTargetWebsiteState(targetRes.value);
      if (dashRes.status === 'fulfilled') {
        setStats(dashRes.value.stats);
        setEndpoints(dashRes.value.endpoints);
      }
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value);
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
        if (!currentUser && usersRes.value.length > 0) setCurrentUser(usersRes.value[0]);
      }
      if (modelsRes.status === 'fulfilled') setModels(modelsRes.value);
      if (anomRes.status === 'fulfilled') {
        setAnomalies(anomRes.value.anomalies);
        setScatterPoints(anomRes.value.scatterPoints);
      }
      if (edaRes.status === 'fulfilled') setEda(edaRes.value);
      if (threshRes.status === 'fulfilled') setThresholds(threshRes.value);

      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (rejected.length > 0) {
        console.warn(`${rejected.length} API endpoint(s) failed:`, rejected[0].reason);
        // Only set apiError if essential dashboard data was unable to load
        if (dashRes.status === 'rejected') {
          setApiError(rejected[0].reason?.message || 'Failed to fetch API data');
        }
      } else {
        setApiError(null);
      }
    } catch (err: any) {
      console.error('Error loading API data:', err);
      setApiError(err?.message || 'Failed to fetch API data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll telemetry data every 10 seconds for real-time feel
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const showShortcutToast = (label: string, key: string) => {
    setShortcutToast({ label, key });
    setTimeout(() => {
      setShortcutToast((current) => (current?.key === key ? null : current));
    }, 1800);
  };

  // Global Keyboard Shortcuts for Tab Navigation & Actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      // Escape always closes any open modals
      if (e.key === 'Escape') {
        setIsSimulatorOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+K / Ctrl+K: Toggle Shortcuts Sheet
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // If user is actively typing inside an input/textarea, do not intercept editing keystrokes
      if (isInput) return;

      // Cmd+D or Alt+1: Executive Dashboard (Explicitly requested)
      if ((isMod && (e.key === 'd' || e.key === 'D')) || (e.altKey && e.key === '1')) {
        e.preventDefault();
        setActiveTab('dashboard');
        showShortcutToast('Executive Dashboard', '⌘D');
        return;
      }

      // Cmd+L or Alt+6: API Log Explorer (Explicitly requested)
      if ((isMod && (e.key === 'l' || e.key === 'L')) || (e.altKey && e.key === '6')) {
        e.preventDefault();
        setActiveTab('logs');
        showShortcutToast('API Log Explorer', '⌘L');
        return;
      }

      // Cmd+M or Alt+2: Live Monitoring
      if ((isMod && (e.key === 'm' || e.key === 'M')) || (e.altKey && e.key === '2')) {
        e.preventDefault();
        setActiveTab('monitoring');
        showShortcutToast('Live Monitoring', '⌘M');
        return;
      }

      // Cmd+H or Alt+3: Machine Learning Hub
      if ((isMod && (e.key === 'h' || e.key === 'H')) || (e.altKey && e.key === '3')) {
        e.preventDefault();
        setActiveTab('ml_hub');
        showShortcutToast('Machine Learning Hub', '⌘H');
        return;
      }

      // Cmd+A or Alt+4: Alerts & Incidents
      if ((isMod && (e.key === 'a' || e.key === 'A')) || (e.altKey && e.key === '4')) {
        e.preventDefault();
        setActiveTab('alerts');
        showShortcutToast('Alerts & Incidents', '⌘A');
        return;
      }

      // Cmd+P or Alt+5: Automated Reports
      if ((isMod && (e.key === 'p' || e.key === 'P')) || (e.altKey && e.key === '5')) {
        e.preventDefault();
        setActiveTab('reports');
        showShortcutToast('Automated Reports', '⌘P');
        return;
      }

      // Cmd+U or Alt+7: Admin & Users
      if ((isMod && (e.key === 'u' || e.key === 'U')) || (e.altKey && e.key === '7')) {
        e.preventDefault();
        setActiveTab('users');
        showShortcutToast('Admin & Users', '⌘U');
        return;
      }

      // Cmd+B or Alt+8: MCA Project Docs
      if ((isMod && (e.key === 'b' || e.key === 'B')) || (e.altKey && e.key === '8')) {
        e.preventDefault();
        setActiveTab('mca_docs');
        showShortcutToast('Project Documentation', '⌘B');
        return;
      }

      // Cmd+S: Open Simulator
      if (isMod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsSimulatorOpen(true);
        showShortcutToast('API Traffic Simulator', '⌘S');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSetTargetWebsite = async (url: string) => {
    setLoading(true);
    try {
      const res = await setTargetWebsite(url);
      setTargetWebsiteState(res.target);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePingTargetWebsite = async () => {
    try {
      const target = await pingTargetWebsite();
      setTargetWebsiteState(target);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers
  const handleSimulateTraffic = async (data: Partial<APILog>) => {
    const result = await simulateTraffic(data);
    await loadData();
    return result;
  };

  const handlePredictLatency = async (input: MLPredictionInput): Promise<MLPredictionOutput> => {
    return await predictLatency(input);
  };

  const handleRetrainModels = async () => {
    const res = await retrainMLModels();
    setModels(res.models);
    await loadData();
    return res;
  };

  const handleUpdateAlertStatus = async (id: string, status: Alert['status']) => {
    await updateAlertStatus(id, status, currentUser?.name || 'Admin');
    const updatedAlerts = await fetchAlerts();
    setAlerts(updatedAlerts);
  };

  const handleGenerateReport = async (type: PerformanceReport['type']) => {
    const newReport = await generateReport(type);
    const updatedReports = await fetchReports();
    setReports(updatedReports);
    return newReport;
  };

  const handleUpdateThresholds = async (t: Partial<SystemThresholds>) => {
    const updated = await updateThresholds(t);
    setThresholds(updated);
  };

  // Provide resilient active objects so missing individual endpoints do not blank out the dashboard
  const activeUser: User = currentUser || (users.length > 0 ? users[0] : DEFAULT_USER);
  const activeThresholds: SystemThresholds = thresholds || DEFAULT_THRESHOLDS;
  const activeStats: SystemStats = stats || {
    totalRequests: logs.length,
    avgLatencyMs: 120,
    errorRatePct: 1.5,
    successRatePct: 98.5,
    activeEndpointsCount: Math.max(1, endpoints.length),
    performanceScore: 95,
    activeAlertsCount: alerts.filter(a => a.status === 'Active').length,
    throughputRps: 52,
    lastUpdated: new Date().toISOString()
  };
  const activeEda: EDAMetrics = eda || {
    datasetSummary: {
      totalSamples: logs.length,
      timeSpanHours: 168,
      uniqueEndpoints: Math.max(1, endpoints.length),
      anomalyCount: anomalies.length,
      anomalyRatePct: 4.8
    },
    latencyDistribution: {
      min: 25,
      p25: 65,
      median: 110,
      p75: 195,
      p95: 380,
      max: 1250,
      mean: 135,
      stdDev: 92
    },
    concurrencyStats: {
      avgConcurrency: 45,
      peakConcurrency: 240,
      concurrencyLatencyCorrelation: 0.68
    },
    topFailingEndpoints: [],
    temporalPeakHours: ['14:00 - 16:00', '02:00 - 04:00']
  };

  // If initial load is still in progress and no stats are available
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-sm font-bold text-slate-300">Initializing ML Monitoring System...</h2>
        <p className="text-xs text-slate-500">Connecting to telemetry stream & ML models</p>
      </div>
    );
  }

  // If initial load failed completely
  if (apiError && !stats) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40">
          <WifiOff className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Failed to Connect to API Telemetry Backend</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          The telemetry service was temporarily unreachable ({apiError}). The dev server or backend process may still be initializing.
        </p>
        <button
          onClick={() => {
            setLoading(true);
            setApiError(null);
            loadData();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E0E0] flex flex-col font-sans antialiased">
      {/* Background sync error alert banner (if telemetry sync fails while app is running) */}
      {apiError && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Telemetry sync warning: {apiError}. Background auto-poll paused.</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 rounded bg-rose-800 hover:bg-rose-700 text-rose-100 font-medium text-xs ml-4 cursor-pointer transition-colors"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={activeUser}
        activeAlerts={alerts}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onNavigateToAlerts={() => setActiveTab('alerts')}
        onSwitchUser={(u) => setCurrentUser(u)}
        allUsers={users.length > 0 ? users : [activeUser]}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Target Website Selector & Live Ping Bar */}
      <TargetWebsiteBar
        targetWebsite={targetWebsite}
        onSetTargetWebsite={handleSetTargetWebsite}
        onPingTargetWebsite={handlePingTargetWebsite}
        loading={loading}
      />

      {/* Main Body */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          activeAlertCount={alerts.filter(a => a.status === 'Active').length}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              stats={activeStats}
              endpoints={endpoints}
              alerts={alerts}
              recentLogs={logs}
              eda={activeEda}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
            />
          )}

          {activeTab === 'monitoring' && (
            <LiveMonitoring
              endpoints={endpoints}
              logs={logs}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'ml_hub' && (
            <MLHub
              anomalies={anomalies}
              scatterPoints={scatterPoints}
              models={models}
              eda={activeEda}
              logs={logs}
              onPredict={handlePredictLatency}
              onRetrain={handleRetrainModels}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsManager
              alerts={alerts}
              thresholds={activeThresholds}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onUpdateThresholds={handleUpdateThresholds}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              reports={reports}
              onGenerateReport={handleGenerateReport}
            />
          )}

          {activeTab === 'logs' && (
            <LogExplorer logs={logs} />
          )}

          {activeTab === 'users' && (
            <AdminUsers users={users} currentUser={activeUser} />
          )}

          {activeTab === 'mca_docs' && (
            <McaDocsViewer />
          )}
        </main>
      </div>

      {/* Interactive API Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulateTraffic}
        targetWebsite={targetWebsite}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          showShortcutToast(tab, '');
        }}
      />

      {/* Floating Keyboard Shortcut Execution Toast Feedback */}
      {shortcutToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-3.5 py-2 rounded-lg bg-[#111218] border border-indigo-500/40 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-gray-300">
            Navigated to <strong className="text-white font-semibold">{shortcutToast.label}</strong>
          </span>
          {shortcutToast.key && (
            <kbd className="px-1.5 py-0.5 font-mono text-[10px] rounded bg-[#1A1C24] text-indigo-300 border border-[#24262F]">
              {shortcutToast.key}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
