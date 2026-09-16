import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'PROBE_START' | 'BREACH' | 'RESISTED' | 'WARNING' | 'COMPLETE';
  message: string;
  attackId?: string;
  latency?: number;
}

interface LiveTerminalProps {
  logs: TerminalLog[];
  isScanning: boolean;
  onClear?: () => void;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ logs, isScanning, onClear }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
      {/* Terminal Titlebar */}
      <div className="bg-[#0d1424] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center space-x-2 text-slate-400 pl-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">TELEMETRY_LOG // STREAM</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isScanning && (
            <span className="flex items-center space-x-1.5 text-[10px] text-cyan-400 animate-pulse font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>DISPATCHING LIVE</span>
            </span>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-[10px] uppercase text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 h-72 overflow-y-auto space-y-1.5 text-slate-300 leading-relaxed select-text">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            Awaiting scan initiation... Telemetry output will stream here.
          </div>
        ) : (
          logs.map((log) => {
            let badge = <span className="text-slate-500">[INFO]</span>;
            let textClass = 'text-slate-300';

            if (log.type === 'PROBE_START') {
              badge = <span className="text-cyan-400 font-bold">[PROBE]</span>;
              textClass = 'text-cyan-200';
            } else if (log.type === 'BREACH') {
              badge = <span className="text-rose-400 font-bold bg-rose-950/80 px-1 py-0.2 rounded border border-rose-900">[VULN_BREACH]</span>;
              textClass = 'text-rose-200 font-semibold';
            } else if (log.type === 'RESISTED') {
              badge = <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-900">[DEFENDED]</span>;
              textClass = 'text-emerald-200 font-semibold';
            } else if (log.type === 'COMPLETE') {
              badge = <span className="text-purple-400 font-bold">[AUDIT_DONE]</span>;
              textClass = 'text-purple-200 font-bold';
            }

            return (
              <div key={log.id} className="flex items-start space-x-2 py-0.5 hover:bg-slate-900/50 rounded px-1">
                <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                <span className="shrink-0">{badge}</span>
                <span className={`flex-1 break-all ${textClass}`}>{log.message}</span>
                {log.latency !== undefined && (
                  <span className="text-[10px] text-slate-500 shrink-0 font-normal">
                    {log.latency}ms
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
