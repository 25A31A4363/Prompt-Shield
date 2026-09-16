import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, ArrowLeft, Shield, AlertTriangle, CheckCircle2, Code } from 'lucide-react';
import { api } from '../services/api';
import { SecurityReport, ScanRun } from '../types';

interface ReportsProps {
  scanId: string | null;
  onNavigate: (view: string, scanId?: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ scanId, onNavigate }) => {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRun[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>(scanId || '');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getScanHistory().then((history) => {
      setScanHistory(history);
      if (!selectedScanId && history.length > 0) {
        setSelectedScanId(history[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedScanId) return;
    setLoading(true);
    api.getReport(selectedScanId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedScanId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
        Generating security audit report...
      </div>
    );
  }

  const { scan, category_metrics, severity_metrics, results, top_vulnerabilities, remediation_summary } = report;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Controls Bar (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('results', scan.id)}
            className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-mono text-xs text-slate-400">
            <span>Select Audit Session: </span>
            <select
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none ml-2"
            >
              {scanHistory.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.target_name} ({s.grade} - {s.security_score}%) — {new Date(s.started_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 font-mono text-xs">
          <a
            href={api.getExportJsonUrl(scan.id)}
            download
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download JSON</span>
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold transition cursor-pointer shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Report Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-lg font-mono text-slate-100 tracking-wider">PROMPT<span className="text-cyan-400">SHIELD</span> AUDIT REPORT</span>
            </div>
            <p className="text-xs font-mono text-slate-400">Academic & Enterprise Prompt Injection Security Assessment</p>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
            <div>CONFIDENTIAL SECURITY EVALUATION</div>
            <div>Generated: {new Date(scan.completed_at || scan.started_at).toUTCString()}</div>
            <div className="text-[10px] text-slate-500">Audit ID: {scan.id}</div>
          </div>
        </div>

        {/* Target Profile Summary */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-2">
          <h2 className="text-slate-400 uppercase font-semibold text-[11px]">1. Target System Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <span className="text-slate-500 block text-[10px]">TARGET NAME</span>
              <span className="font-bold text-slate-200">{scan.target_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CONNECTOR TYPE</span>
              <span className="font-bold text-slate-200">{scan.target_type} {scan.sandbox_mode ? `(${scan.sandbox_mode})` : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ATTACK SUITE</span>
              <span className="font-bold text-slate-200">{scan.attack_suite}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL PROBES TESTED</span>
              <span className="font-bold text-slate-200">{scan.total_probes} probes</span>
            </div>
          </div>
        </div>

        {/* Executive Scorecard */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 font-mono space-y-4">
          <h2 className="text-slate-400 uppercase font-semibold text-[11px]">2. Executive Security Scorecard</h2>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-100">{scan.security_score}%</div>
                <div className="text-[10px] uppercase text-slate-400">Security Score</div>
              </div>
              <div className="text-center border-l border-slate-800 pl-6">
                <div className="text-3xl font-black text-cyan-400">GRADE {scan.grade}</div>
                <div className="text-[10px] uppercase text-slate-400">Posture Rating</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <span className="text-rose-400 font-bold text-xl block">{scan.successful_count}</span>
                <span className="text-slate-500 text-[10px]">BREACHES</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold text-xl block">{scan.resisted_count}</span>
                <span className="text-slate-500 text-[10px]">DEFENDED</span>
              </div>
              <div>
                <span className="text-cyan-400 font-bold text-xl block">{Math.round(scan.mean_confidence * 100)}%</span>
                <span className="text-slate-500 text-[10px]">CERTAINTY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Category Matrix */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 font-mono text-xs space-y-4">
          <h2 className="text-slate-400 uppercase font-semibold text-[11px]">3. Threat Category Resilience Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Threat Category</th>
                  <th className="py-2 px-3">Total Tested</th>
                  <th className="py-2 px-3">Breached</th>
                  <th className="py-2 px-3">Defended</th>
                  <th className="py-2 px-3 text-right">Resilience Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {category_metrics.map((c) => (
                  <tr key={c.category}>
                    <td className="py-2.5 px-3 font-semibold">{c.category}</td>
                    <td className="py-2.5 px-3">{c.total}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">{c.successful}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{c.resisted}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">{c.resilience_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Remediation Guidance */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 font-mono text-xs space-y-4">
          <h2 className="text-slate-400 uppercase font-semibold text-[11px]">4. Actionable Defensive Remediation Matrix</h2>
          {remediation_summary.length === 0 ? (
            <p className="text-slate-400">No active vulnerabilities requiring immediate patch remediation.</p>
          ) : (
            <div className="space-y-4">
              {remediation_summary.map((rem, i) => (
                <div key={i} className="p-4 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span>{rem.strategy}</span>
                    <span className="text-[10px] text-slate-400">{rem.owasp_reference}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Remediates Vector: <code className="text-slate-200">{rem.attack_id}</code> ({rem.category} - {rem.severity})
                  </div>
                  {rem.code_example && (
                    <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-emerald-300 text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {rem.code_example}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
