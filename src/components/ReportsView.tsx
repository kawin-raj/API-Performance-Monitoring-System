import React, { useState } from 'react';
import { FileSpreadsheet, Plus, Download, Printer, CheckCircle, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PerformanceReport } from '../types.js';

interface ReportsViewProps {
  reports: PerformanceReport[];
  onGenerateReport: (type: PerformanceReport['type']) => Promise<PerformanceReport>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports, onGenerateReport }) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [generating, setGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const handleGenerate = async (type: PerformanceReport['type']) => {
    setGenerating(true);
    try {
      const newRpt = await onGenerateReport(type);
      setSelectedReportId(newRpt.id);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!activeReport) return;
    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header Banner Box
      doc.setFillColor(17, 24, 39); // Slate-900
      doc.rect(margin, y, contentWidth, 24, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('API PERFORMANCE & SLA AUDIT REPORT', margin + 6, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `${activeReport.type} Performance Report  |  Period: ${activeReport.period}  |  Report ID: ${activeReport.id}`,
        margin + 6,
        y + 17
      );

      y += 30;

      // Metadata Bar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const generatedDate = new Date(activeReport.generatedAt).toLocaleString();
      doc.text(`GENERATED: ${generatedDate.toUpperCase()}`, margin, y);
      doc.text(`AUDIT ENGINE: ISOLATION FOREST + XGBOOST REGRESSION`, pageWidth - margin, y, { align: 'right' });

      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Section 1: Executive Summary & Key Metrics
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('1. EXECUTIVE TELEMETRY SUMMARY', margin, y);
      y += 6;

      // 4 Metric Cards in a row
      const cardWidth = (contentWidth - 9) / 4;
      const cardHeight = 18;

      const kpis = [
        { label: 'TOTAL REQUESTS', val: activeReport.summary.totalRequests.toLocaleString() },
        { label: 'AVG LATENCY', val: `${activeReport.summary.avgLatencyMs} ms` },
        { label: 'AVAILABILITY', val: `${activeReport.summary.availabilityPct}%` },
        { label: 'HEALTH SCORE', val: `${activeReport.summary.performanceScore} / 100` }
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + 3, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.val, x + 3, y + 13);
      });

      y += cardHeight + 8;

      // Sub-metrics row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Error Count: ${activeReport.summary.errorCount.toLocaleString()} (${activeReport.summary.errorRatePct}% failure rate)   |   Anomalies Detected: ${activeReport.anomaliesDetectedCount}`,
        margin,
        y
      );

      y += 8;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Section 2: Latency Percentiles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('2. RESPONSE TIME PERCENTILE DISTRIBUTION', margin, y);
      y += 6;

      const percentiles = [
        { label: 'P50 (Median)', val: `${activeReport.summary.p50Ms} ms`, note: 'Nominal traffic response' },
        { label: 'P90 Latency', val: `${activeReport.summary.p90Ms} ms`, note: '90th percentile ceiling' },
        { label: 'P95 Latency', val: `${activeReport.summary.p95Ms} ms`, note: 'SLA threshold boundary' },
        { label: 'P99 Extreme', val: `${activeReport.summary.p99Ms} ms`, note: 'Tail latency outlier spike' }
      ];

      percentiles.forEach((p, idx) => {
        const x = margin + idx * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, cardWidth, cardHeight + 2, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(p.label.toUpperCase(), x + 3, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(p.val, x + 3, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(p.note, x + 3, y + 17);
      });

      y += cardHeight + 10;

      // Section 3: Top Degrading Endpoints
      if (activeReport.topDegradingEndpoints && activeReport.topDegradingEndpoints.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('3. CRITICAL & DEGRADING API ENDPOINTS', margin, y);
        y += 5;

        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('ENDPOINT ROUTE', margin + 3, y + 4.8);
        doc.text('AVG LATENCY', margin + 110, y + 4.8);
        doc.text('ERROR RATE (%)', margin + 150, y + 4.8);
        y += 7;

        activeReport.topDegradingEndpoints.forEach((ep) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(241, 245, 249);
          doc.rect(margin, y, contentWidth, 7, 'FD');

          doc.setFont('courier', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(ep.endpoint, margin + 3, y + 4.8);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(ep.avgLatencyMs > 250 ? 217 : 30, ep.avgLatencyMs > 250 ? 119 : 41, ep.avgLatencyMs > 250 ? 6 : 59);
          doc.text(`${ep.avgLatencyMs} ms`, margin + 110, y + 4.8);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(ep.errorRatePct > 3 ? 220 : 71, ep.errorRatePct > 3 ? 38 : 85, ep.errorRatePct > 3 ? 38 : 105);
          doc.text(`${ep.errorRatePct}%`, margin + 150, y + 4.8);

          y += 7;
        });

        y += 6;
      }

      // Section 4: Machine Learning Optimization Recommendations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('4. AUTOMATED ML OPTIMIZATION RECOMMENDATIONS', margin, y);
      y += 6;

      doc.setFillColor(245, 247, 255);
      doc.setDrawColor(224, 231, 255);
      const recBoxStartY = y;

      let recTextY = y + 5;
      activeReport.recommendations.forEach((rec, idx) => {
        const bullet = `${idx + 1}.`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(bullet, margin + 4, recTextY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const lines = doc.splitTextToSize(rec, contentWidth - 16);
        doc.text(lines, margin + 10, recTextY);
        recTextY += lines.length * 4.2 + 2;
      });

      const recBoxHeight = recTextY - recBoxStartY + 2;
      doc.roundedRect(margin, recBoxStartY, contentWidth, recBoxHeight, 1.5, 1.5, 'S');

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('APM Autonomous API Observability Platform  ·  Confidential Performance Telemetry', margin, pageHeight - 8);
      doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 8, { align: 'right' });

      // Save document locally
      const cleanFileName = `performance-report-${activeReport.type.toLowerCase()}-${activeReport.id}.pdf`;
      doc.save(cleanFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Automated API Performance Reports Generator
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Daily, Weekly, and Monthly telemetry breakdown with percentiles and ML recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleGenerate('Daily')}
            disabled={generating}
            className="px-3 py-1.5 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          >
            + Generate Daily
          </button>
          <button
            onClick={() => handleGenerate('Weekly')}
            disabled={generating}
            className="px-3 py-1.5 text-xs font-bold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-200 border border-[#24262F] transition-colors"
          >
            + Generate Weekly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Reports Navigation Sidebar */}
        <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] space-y-2 text-xs">
          <span className="font-bold text-gray-400 text-[10px] uppercase block mb-2">Available Reports ({reports.length})</span>
          {reports.map((rpt) => (
            <button
              key={rpt.id}
              onClick={() => setSelectedReportId(rpt.id)}
              className={`w-full text-left p-2 rounded transition-all border ${
                rpt.id === activeReport?.id
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                  : 'bg-[#1A1C24] hover:bg-[#24262F] text-gray-300 border-[#24262F]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs">{rpt.type} Report</span>
                <span className="text-[9px] opacity-80 font-mono">{rpt.period}</span>
              </div>
              <span className="text-[9px] opacity-70 font-mono block">Score: {rpt.summary.performanceScore}/100</span>
            </button>
          ))}
        </div>

        {/* Report Content View */}
        {activeReport ? (
          <div className="lg:col-span-3 p-4 rounded bg-[#111218] border border-[#24262F] space-y-4 shadow-sm text-gray-200">
            {/* Report Header Bar */}
            <div className="flex items-center justify-between border-b border-[#24262F] pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeReport.type} Report
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{activeReport.period}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">API Performance & SLA Audit Report</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors shadow-sm ${
                    downloadSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                  title="Download report as PDF file"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>PDF Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download as PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#1A1C24] hover:bg-[#24262F] text-gray-200 border border-[#24262F]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* KPI Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F]">
                <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Total Requests</span>
                <span className="text-lg font-bold font-mono text-white">{activeReport.summary.totalRequests.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F]">
                <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Avg Latency</span>
                <span className="text-lg font-bold font-mono text-indigo-300">{activeReport.summary.avgLatencyMs} ms</span>
              </div>
              <div className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F]">
                <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Availability</span>
                <span className="text-lg font-bold font-mono text-green-400">{activeReport.summary.availabilityPct}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#1A1C24] border border-[#24262F]">
                <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Health Score</span>
                <span className="text-lg font-bold font-mono text-amber-300">{activeReport.summary.performanceScore} / 100</span>
              </div>
            </div>

            {/* Latency Percentile Metrics Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">Response Time Latency Percentiles</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-[9px] text-gray-500 block font-bold uppercase">P50 (Median)</span>
                  <span className="text-sm font-bold font-mono text-white">{activeReport.summary.p50Ms} ms</span>
                </div>
                <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-[9px] text-gray-500 block font-bold uppercase">P90</span>
                  <span className="text-sm font-bold font-mono text-indigo-300">{activeReport.summary.p90Ms} ms</span>
                </div>
                <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-[9px] text-gray-500 block font-bold uppercase">P95</span>
                  <span className="text-sm font-bold font-mono text-amber-300">{activeReport.summary.p95Ms} ms</span>
                </div>
                <div className="p-2 rounded bg-[#1A1C24] border border-[#24262F]">
                  <span className="text-[9px] text-gray-500 block font-bold uppercase">P99 (Extreme)</span>
                  <span className="text-sm font-bold font-mono text-red-400">{activeReport.summary.p99Ms} ms</span>
                </div>
              </div>
            </div>

            {/* Top Degrading Endpoints */}
            {activeReport.topDegradingEndpoints && activeReport.topDegradingEndpoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">
                  Critical & Degrading API Endpoints
                </h4>
                <div className="overflow-x-auto rounded border border-[#24262F]">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
                      <tr>
                        <th className="p-2 text-[10px] uppercase">Endpoint</th>
                        <th className="p-2 text-[10px] uppercase">Avg Latency</th>
                        <th className="p-2 text-[10px] uppercase">Error Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24262F] bg-[#111218]">
                      {activeReport.topDegradingEndpoints.map((ep, i) => (
                        <tr key={i} className="hover:bg-[#1A1C24]/50 transition-colors">
                          <td className="p-2 font-mono text-white font-medium">{ep.endpoint}</td>
                          <td className="p-2 font-mono text-amber-300 font-semibold">{ep.avgLatencyMs} ms</td>
                          <td className="p-2 font-mono text-rose-400 font-semibold">{ep.errorRatePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Automated Machine Learning Optimization Recommendations */}
            <div className="p-3.5 rounded bg-[#111218] border border-indigo-600/30 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Automated ML Optimization Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300 list-disc list-inside font-mono">
                {activeReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
