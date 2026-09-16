import React, { useState, useEffect } from 'react';
import {
  BarChart3, ShieldAlert, ShieldCheck, Download, GitCompare,
  FileText, Search, Filter, ArrowRight, Activity, Code
} from 'lucide-react';
import { SecurityGauge } from '../components/SecurityGauge';
import { AttackEvidenceModal } from '../components/AttackEvidenceModal';
import { api } from '../services/api';
import { SecurityReport, AttackResult } from '../types';

interface ScanResultsProps {
  scanId: string | null;
  onNavigate: (view: string, scanId?: string) => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ scanId, onNavigate }) => {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<AttackResult | null>(null);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    api.getReport(scanId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scanId]);

  if (!scanId) {
    return (
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-12 text-center space-y-4 font-mono">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base text-slate-300 font-bold">No Scan Results Selected</h2>
        <p className="text-xs text-slate-500">
          Run or select an audit scan from the dashboard to inspect security results.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
        >
          Go to Dashboard &rarr;
        </button>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
        Loading comprehensive security report...
      </div>
    );
  }

  const { scan, category_metrics, severity_metrics, results, top_vulnerabilities } = report;

  const filteredResults = results.filter((r) => {
    const matchVerdict = verdictFilter === 'ALL' || r.verdict === verdictFilter;
    const matchSeverity = severityFilter === 'ALL' || r.severity === severityFilter;
    const matchQuery =
      searchQuery === '' ||
      r.attack_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.attack_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchVerdict && matchSeverity && matchQuery;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <span>Security Audit Findings</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {scan.target_type} {scan.sandbox_mode ? `(${scan.sandbox_mode})` : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Target: <span className="text-slate-200 font-bold">{scan.target_name}</span> • Scanned on {new Date(scan.started_at).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 font-mono text-xs">
          <a
            href={api.getExportJsonUrl(scan.id)}
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </a>

          <button
            onClick={() => onNavigate('comparison', scan.id)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-purple-400" />
            <span>Compare Posture</span>
          </button>

          <button
            onClick={() => onNavigate('reports', scan.id)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition cursor-pointer shadow"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Audit Report</span>
          </button>
        </div>
      </div>

      {/* Scorecard & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Gauge */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-between shadow-xl">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">Overall Security Resilience</h2>
          <SecurityGauge score={scan.security_score} grade={scan.grade} size={180} />

          <div className="w-full mt-4 text-center font-mono text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
            Mean Evaluation Certainty: <span className="text-cyan-300 font-bold">{Math.round(scan.mean_confidence * 100)}%</span>
          </div>
        </div>

        {/* Severity Metrics Cards */}
        <div className="md:col-span-2 bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Vulnerability Severity Distribution</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {severity_metrics.map((sev) => (
              <div
                key={sev.severity}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  sev.severity === 'CRITICAL' ? 'bg-rose-950/30 border-rose-900/60 text-rose-300' :
                  sev.severity === 'HIGH' ? 'bg-orange-950/30 border-orange-900/60 text-orange-300' :
                  sev.severity === 'MEDIUM' ? 'bg-amber-950/30 border-amber-900/60 text-amber-300' :
                  'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-bold text-[11px]">{sev.severity}</div>
                <div className="mt-2">
                  <span className="text-2xl font-black">{sev.successful}</span>
                  <span className="text-slate-500 text-[10px] ml-1">/ {sev.total} breached</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category Resilience Progress Bars */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Resilience by Threat Category</h2>
            <div className="space-y-2">
              {category_metrics.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-300">{cat.category}</span>
                    <span className="text-slate-400">
                      {cat.resisted}/{cat.total} defended ({cat.resilience_rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        cat.resilience_rate >= 80 ? 'bg-emerald-500' :
                        cat.resilience_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${cat.resilience_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Findings Table with Filters */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-100">Evaluated Attack Findings</h2>
            <span className="text-xs text-slate-400 font-normal">
              Showing {filteredResults.length} of {results.length} probes
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter probes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded pl-7 pr-2.5 py-1 text-slate-200 outline-none text-xs"
              />
            </div>

            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs"
            >
              <option value="ALL">All Verdicts</option>
              <option value="SUCCESSFUL">Breached Only</option>
              <option value="RESISTED">Defended Only</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Probe ID</th>
                <th className="py-2.5 px-3">Attack Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Detection Stage & Reason</th>
                <th className="py-2.5 px-3 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {filteredResults.map((r) => {
                const isBreach = r.verdict === 'SUCCESSFUL';
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedResult(r)}
                    className="hover:bg-slate-900/60 transition cursor-pointer"
                  >
                    <td className="py-3 px-3 font-bold text-slate-200">{r.attack_id}</td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{r.attack_name}</td>
                    <td className="py-3 px-3 text-cyan-400">{r.category}</td>
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        r.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        r.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                        r.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBreach
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {r.verdict}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 truncate max-w-xs">
                      <span className="text-slate-300 font-semibold">{r.detection_stage.replace('STAGE_', 'S')}</span>: {r.rationale}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(r);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline text-[11px]"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Evidence Modal */}
      <AttackEvidenceModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};
