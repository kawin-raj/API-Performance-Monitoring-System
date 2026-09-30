import React, { useState } from 'react';
import { Globe, Search, RefreshCw, CheckCircle2, ShieldCheck, Zap, Server, Activity, ArrowRight } from 'lucide-react';
import { TargetWebsite } from '../types.js';

interface TargetWebsiteBarProps {
  targetWebsite: TargetWebsite | null;
  onSetTargetWebsite: (url: string) => Promise<void>;
  onPingTargetWebsite: () => Promise<void>;
  loading: boolean;
}

export const TargetWebsiteBar: React.FC<TargetWebsiteBarProps> = ({
  targetWebsite,
  onSetTargetWebsite,
  onPingTargetWebsite,
  loading
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await onSetTargetWebsite(inputUrl.trim());
      setInputUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreset = async (url: string) => {
    setIsSubmitting(true);
    try {
      await onSetTargetWebsite(url);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePing = async () => {
    setIsPinging(true);
    try {
      await onPingTargetWebsite();
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="bg-[#111218] border-b border-[#24262F] px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* URL Input Form & Active Target Status Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Active Target Info Card */}
          <div className="flex items-center space-x-3 bg-[#1A1C24] border border-[#24262F] rounded p-2.5 min-w-[320px]">
            <div className="w-9 h-9 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monitored Target Website</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                  {targetWebsite?.status || 'Online'}
                </span>
              </div>
              <h2 className="font-bold text-sm text-white truncate font-mono">
                {targetWebsite?.domain || 'amazon.com'}
              </h2>
            </div>
            <button
              onClick={handlePing}
              disabled={isPinging || loading}
              className="px-2.5 py-1.5 text-[10px] font-bold rounded bg-[#24262F] hover:bg-[#2F323E] text-gray-200 border border-[#323542] flex items-center gap-1 transition-colors shrink-0"
              title="Ping website right now"
            >
              <RefreshCw className={`w-3 h-3 text-indigo-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span className="font-mono">{targetWebsite?.pingMs || 42}ms</span>
            </button>
          </div>

          {/* Website Link Entry Form */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-2xl flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter website link (e.g., https://amazon.com, stripe.com, api.github.com)..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1A1C24] border border-[#24262F] rounded text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !inputUrl.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors shadow-sm flex items-center space-x-1.5 shrink-0 uppercase tracking-wider"
            >
              {isSubmitting ? (
                <span>Scanning...</span>
              ) : (
                <>
                  <span>Monitor Website</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Presets & Target Telemetry Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1C1E26] text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">Quick Target Presets:</span>
            <button
              onClick={() => handlePreset('https://amazon.com')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                targetWebsite?.domain?.includes('amazon')
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-[#1A1C24] text-gray-300 border-[#24262F] hover:bg-[#24262F]'
              }`}
            >
              🛒 amazon.com
            </button>
            <button
              onClick={() => handlePreset('https://stripe.com')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                targetWebsite?.domain?.includes('stripe')
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-[#1A1C24] text-gray-300 border-[#24262F] hover:bg-[#24262F]'
              }`}
            >
              💳 stripe.com
            </button>
            <button
              onClick={() => handlePreset('https://api.github.com')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                targetWebsite?.domain?.includes('github')
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-[#1A1C24] text-gray-300 border-[#24262F] hover:bg-[#24262F]'
              }`}
            >
              🐙 github.com
            </button>
            <button
              onClick={() => handlePreset('https://shopify.com')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                targetWebsite?.domain?.includes('shopify')
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-[#1A1C24] text-gray-300 border-[#24262F] hover:bg-[#24262F]'
              }`}
            >
              🛍️ shopify.com
            </button>
          </div>

          {/* Active Target Diagnostics Badges */}
          <div className="flex items-center space-x-3 font-mono text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Ping: <strong className="text-white">{targetWebsite?.pingMs || 45}ms</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span>SSL: <strong className="text-white">{targetWebsite?.sslStatus || 'Valid'}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-amber-400" />
              <span>Endpoints: <strong className="text-white">{targetWebsite?.detectedEndpoints?.length || 8} Active</strong></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
