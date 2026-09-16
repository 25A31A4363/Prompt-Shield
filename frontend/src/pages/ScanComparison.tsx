import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ScanRun, ComparisonResponse } from '../types';

interface ScanComparisonProps {
  initialScanId?: string | null;
  onNavigate: (view: string, scanId?: string) => void;
}

export const ScanComparison: React.FC<ScanComparisonProps> = ({ initialScanId, onNavigate }) => {
  const [scans, setScans] = useState<ScanRun[]>([]);
  const [baseScanId, setBaseScanId] = useState<string>('');
  const [targetScanId, setTargetScanId] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      const history = await api.getScanHistory();
      setScans(history);

      if (history.length >= 2) {
        setBaseScanId(history[1].id);
        setTargetScanId(history[0].id);
        runCompare(history[1].id, history[0].id);
      } else if (history.length === 1) {
        setBaseScanId(history[0].id);
        setTargetScanId(history[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runCompare = async (bId: string, tId: string) => {
    if (!bId || !tId) return;
    try {
      setLoading(true);
      const res = await api.compareScans(bId, tId);
      setComparison(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCompare = (e: React.FormEvent) => {
    e.preventDefault();
    runCompare(baseScanId, targetScanId);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
          <GitCompare className="w-6 h-6 text-purple-400" />
          <span>Scan Comparison (Before vs. After Remediation)</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Verify defensive hardening efficacy by comparing baseline vulnerability posture with post-remediation scans.
        </p>
      </div>

      {/* Scan Selection Form */}
      <form onSubmit={handleManualCompare} className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Scan */}
          <div>
            <label className="block text-slate-400 uppercase font-semibold mb-1.5">
              1. Baseline Scan (Before Fix)
            </label>
            <select
              value={baseScanId}
              onChange={(e) => setBaseScanId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none"
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.target_name} ({s.grade} - {s.security_score}%) — {new Date(s.started_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Target Scan */}
          <div>
            <label className="block text-slate-400 uppercase font-semibold mb-1.5">
              2. Remediated Scan (After Fix)
            </label>
            <select
              value={targetScanId}
              onChange={(e) => setTargetScanId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none"
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.target_name} ({s.grade} - {s.security_score}%) — {new Date(s.started_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading || !baseScanId || !targetScanId}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold cursor-pointer transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Delta Analysis</span>
          </button>
        </div>
      </form>

      {/* Comparison Scorecard */}
      {comparison && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            {/* Score Delta */}
            <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Resilience Delta</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className={`text-3xl font-black ${
                  comparison.score_delta > 0 ? 'text-emerald-400' :
                  comparison.score_delta < 0 ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {comparison.score_delta > 0 ? `+${comparison.score_delta}` : comparison.score_delta}%
                </span>
                <span className="text-xs text-slate-400">
                  ({comparison.grade_before} &rarr; {comparison.grade_after})
                </span>
              </div>
            </div>

            {/* Fixed Flaws */}
            <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Fixed Vulnerabilities</span>
              <div className="mt-2 flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span className="text-3xl font-black text-emerald-300">{comparison.fixed_count}</span>
                <span className="text-xs text-slate-500">remediated</span>
              </div>
            </div>

            {/* Unresolved */}
            <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-[10px] text-amber-400 uppercase font-semibold block">Unresolved Flaws</span>
              <div className="mt-2 flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <span className="text-3xl font-black text-amber-300">{comparison.unresolved_count}</span>
                <span className="text-xs text-slate-500">still active</span>
              </div>
            </div>

            {/* Regressions */}
            <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-[10px] text-rose-400 uppercase font-semibold block">Regressions Alert</span>
              <div className="mt-2 flex items-center space-x-2">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
                <span className="text-3xl font-black text-rose-300">{comparison.regression_count}</span>
                <span className="text-xs text-slate-500">newly vulnerable</span>
              </div>
            </div>
          </div>

          {/* Side-by-side Attack Diff Matrix */}
          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-100 font-mono">Side-by-Side Probe Resolution Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Probe ID</th>
                    <th className="py-2.5 px-3">Attack Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Base Verdict</th>
                    <th className="py-2.5 px-3">Target Verdict</th>
                    <th className="py-2.5 px-3 text-right">Transition Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {comparison.attack_diffs.map((diff) => {
                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        UNCHANGED
                      </span>
                    );

                    if (diff.status === 'FIXED') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          &check; FIXED
                        </span>
                      );
                    } else if (diff.status === 'REGRESSED') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                          &times; REGRESSED
                        </span>
                      );
                    } else if (diff.status === 'UNCHANGED_BREACH') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          ! UNRESOLVED
                        </span>
                      );
                    }

                    return (
                      <tr key={diff.attack_id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-3 font-bold text-slate-200">{diff.attack_id}</td>
                        <td className="py-3 px-3 text-slate-300 font-semibold">{diff.attack_name}</td>
                        <td className="py-3 px-3 text-cyan-400">{diff.category}</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            diff.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            diff.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {diff.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            diff.base_verdict === 'SUCCESSFUL' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {diff.base_verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            diff.target_verdict === 'SUCCESSFUL' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {diff.target_verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">{statusBadge}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
