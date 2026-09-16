import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon, ShieldAlert, ShieldCheck, ArrowRight,
  Activity, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { LiveTerminal, TerminalLog } from '../components/LiveTerminal';
import { SecurityGauge } from '../components/SecurityGauge';
import { AttackEvidenceModal } from '../components/AttackEvidenceModal';
import { api } from '../services/api';
import { ScanRun, AttackResult } from '../types';

interface LiveScanProps {
  scanId: string | null;
  onNavigate: (view: string, scanId?: string) => void;
}

export const LiveScan: React.FC<LiveScanProps> = ({ scanId, onNavigate }) => {
  const [scan, setScan] = useState<ScanRun | null>(null);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [activeProbe, setActiveProbe] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<AttackResult | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!scanId) return;

    // Fetch initial scan state
    api.getScanStatus(scanId)
      .then((s) => {
        setScan(s);
        if (s.status === 'COMPLETED' || s.status === 'FAILED') {
          setIsStreaming(false);
          api.getScanResults(scanId).then(setResults);
        }
      })
      .catch(console.error);

    // Establish Server-Sent Events (SSE) stream
    const sseUrl = `/api/scans/${scanId}/stream`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    const addLog = (type: TerminalLog['type'], message: string, latency?: number, attackId?: string) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: timeStr,
          type,
          message,
          latency,
          attackId
        }
      ]);
    };

    addLog('INFO', `Connecting telemetry stream for scan session: ${scanId}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'SCAN_STARTED') {
          addLog('INFO', `Scan initiated against target: '${data.target_name}' (${data.total_probes} probes scheduled).`);
        } else if (data.type === 'PROBE_STARTING') {
          setActiveProbe({
            id: data.attack_id,
            name: data.attack_name,
            category: data.category,
            severity: data.severity,
            index: data.current_index,
            total: data.total_probes
          });
          addLog(
            'PROBE_START',
            `[${data.current_index}/${data.total_probes}] Injected ${data.attack_id} (${data.category} / ${data.severity})`,
            undefined,
            data.attack_id
          );
        } else if (data.type === 'PROBE_RESULT') {
          const res = data.result;
          const isBreach = res.verdict === 'SUCCESSFUL';
          addLog(
            isBreach ? 'BREACH' : 'RESISTED',
            `Probe ${res.attack_id} verdict: ${res.verdict} (Confidence: ${Math.round(res.confidence * 100)}%, Matched: ${res.matched_indicator || 'None'})`,
            res.latency_ms,
            res.attack_id
          );

          // Update scan state with progress metrics
          setScan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              completed_probes: data.completed_probes,
              security_score: data.current_score,
              grade: data.current_grade,
              successful_count: isBreach ? prev.successful_count + 1 : prev.successful_count,
              resisted_count: !isBreach ? prev.resisted_count + 1 : prev.resisted_count
            };
          });

          // Fetch full updated results list
          api.getScanResults(scanId).then(setResults);
        } else if (data.type === 'SCAN_COMPLETED') {
          setIsStreaming(false);
          setActiveProbe(null);
          addLog('COMPLETE', `Scan completed successfully! Final Score: ${data.final_score}% (Grade ${data.final_grade}).`);
          api.getScanStatus(scanId).then(setScan);
          api.getScanResults(scanId).then(setResults);
          es.close();
        } else if (data.type === 'ERROR') {
          setIsStreaming(false);
          addLog('WARNING', `Error encountered: ${data.message}`);
          es.close();
        }
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    es.onerror = () => {
      // Re-query status in case scan finished while stream closed
      api.getScanStatus(scanId).then((s) => {
        setScan(s);
        if (s.status === 'COMPLETED' || s.status === 'FAILED') {
          setIsStreaming(false);
        }
      });
    };

    return () => {
      es.close();
    };
  }, [scanId]);

  if (!scanId) {
    return (
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-12 text-center space-y-4 font-mono">
        <TerminalIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base text-slate-300 font-bold">No Active Scan Session Selected</h2>
        <p className="text-xs text-slate-500">
          Select or launch a new security scan to monitor live attack execution telemetry.
        </p>
        <button
          onClick={() => onNavigate('new-scan')}
          className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
        >
          Launch New Scan &rarr;
        </button>
      </div>
    );
  }

  const completed = scan?.completed_probes || 0;
  const total = scan?.total_probes || 14;
  const progressPercent = Math.min(100, Math.round((completed / (total || 1)) * 100));

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
              <TerminalIcon className="w-6 h-6 text-cyan-400" />
              <span>Live Telemetry Console</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
              isStreaming
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isStreaming ? 'STREAMING ACTIVE' : 'SCAN COMPLETED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Target: <span className="text-slate-200 font-bold">{scan?.target_name || 'Loading target...'}</span> • Session ID: <code className="text-cyan-400">{scanId}</code>
          </p>
        </div>

        {scan && !isStreaming && (
          <button
            onClick={() => onNavigate('results', scan.id)}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-lg shadow cursor-pointer transition"
          >
            <span>View Full Audit Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar & Current Probe Banner */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">Execution Progress</span>
          <span className="text-cyan-400 font-bold">{completed} / {total} Probes ({progressPercent}%)</span>
        </div>

        {/* Progress bar container */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Active Probe Status */}
        {activeProbe && isStreaming ? (
          <div className="flex items-center space-x-3 p-3 bg-cyan-950/40 border border-cyan-800 rounded-lg text-cyan-300">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-bold">Evaluating Probe [{activeProbe.index}/{activeProbe.total}]:</span>{' '}
              <span className="text-slate-200">{activeProbe.id} — {activeProbe.name}</span>{' '}
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 ml-2">
                {activeProbe.category}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Split: Live Scoreboard & Live Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Live Gauge & Metrics */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-between shadow-xl">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">Live Security Posture</h2>
          <SecurityGauge
            score={scan?.security_score ?? 100}
            grade={scan?.grade || 'A'}
            size={180}
          />

          <div className="w-full grid grid-cols-2 gap-2 mt-6 font-mono text-xs">
            <div className="bg-rose-950/40 border border-rose-900/60 p-3 rounded text-center">
              <span className="text-[10px] uppercase text-rose-400 font-semibold block">Breached</span>
              <span className="text-xl font-bold text-rose-300">{scan?.successful_count || 0}</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded text-center">
              <span className="text-[10px] uppercase text-emerald-400 font-semibold block">Defended</span>
              <span className="text-xl font-bold text-emerald-300">{scan?.resisted_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Right: Live Stream Terminal */}
        <div className="md:col-span-2">
          <LiveTerminal logs={logs} isScanning={isStreaming} />
        </div>
      </div>

      {/* Real-time Attack Findings Table */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 font-mono">Real-time Probe Log</h2>
          <span className="text-xs font-mono text-slate-400">Click any row to inspect forensic evidence</span>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-6 text-slate-600 font-mono text-xs">
            Awaiting probe responses...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-2 px-3">Probe ID</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Verdict</th>
                  <th className="py-2 px-3">Stage / Confidence</th>
                  <th className="py-2 px-3">Latency</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {results.map((r) => {
                  const isBreach = r.verdict === 'SUCCESSFUL';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResult(r)}
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-200">{r.attack_id}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{r.category}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          r.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          r.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                          r.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBreach
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {r.verdict}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {r.detection_stage.replace('STAGE_', 'S')} ({Math.round(r.confidence * 100)}%)
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{r.latency_ms}ms</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-cyan-400 hover:underline">Evidence &rarr;</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forensic Evidence Modal */}
      <AttackEvidenceModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};
