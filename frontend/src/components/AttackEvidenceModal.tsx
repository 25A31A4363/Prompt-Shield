import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, ShieldCheck, HelpCircle, Code, ExternalLink } from 'lucide-react';
import { AttackResult } from '../types';

interface AttackEvidenceModalProps {
  result: AttackResult | null;
  onClose: () => void;
}

export const AttackEvidenceModal: React.FC<AttackEvidenceModalProps> = ({ result, onClose }) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  if (!result) return null;

  const copyToClipboard = (text: string, isPayload: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPayload) {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const isSuccess = result.verdict === 'SUCCESSFUL';
  const isResisted = result.verdict === 'RESISTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0f172a] z-10">
          <div className="flex items-center space-x-3">
            {isSuccess ? (
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : isResisted ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-100 text-base">{result.attack_id}</span>
                <span className="text-slate-400 text-sm font-medium">— {result.attack_name}</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono mt-0.5">
                <span className="text-cyan-400 uppercase font-semibold">{result.category}</span>
                <span className="text-slate-600">•</span>
                <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  result.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  result.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                  result.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-slate-800 text-slate-300'
                }`}>{result.severity}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Latency: {result.latency_ms}ms</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Forensic Classification Banner */}
          <div className={`p-4 rounded-lg border ${
            isSuccess ? 'bg-rose-950/30 border-rose-800/80 text-rose-200' :
            isResisted ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200' :
            'bg-amber-950/30 border-amber-800/80 text-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider">
                <span>Verdict:</span>
                <span className={`px-2 py-0.5 rounded ${
                  isSuccess ? 'bg-rose-900 text-rose-100' :
                  isResisted ? 'bg-emerald-900 text-emerald-100' : 'bg-amber-900 text-amber-100'
                }`}>{result.verdict}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-bold text-cyan-300">{Math.round(result.confidence * 100)}%</span>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-300">
              <span className="text-slate-400">Detection Stage:</span>{' '}
              <span className="text-cyan-400 font-semibold">{result.detection_stage}</span>
            </div>
            {result.matched_indicator && (
              <div className="text-xs font-mono mt-1 text-slate-300">
                <span className="text-slate-400">Matched Indicator:</span>{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-rose-300">
                  {result.matched_indicator}
                </code>
              </div>
            )}
            <div className="mt-3 text-xs leading-relaxed border-t border-slate-800/80 pt-2 text-slate-200">
              <strong className="text-slate-400 font-mono uppercase block mb-1">Forensic Analysis Rationale:</strong>
              {result.rationale}
            </div>
          </div>

          {/* Injected Attack Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Injected Adversarial Payload</span>
              <button
                onClick={() => copyToClipboard(result.payload_sent, true)}
                className="flex items-center space-x-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
              {result.payload_sent}
            </div>
          </div>

          {/* Target Raw Response */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Target Model Response</span>
              <button
                onClick={() => copyToClipboard(result.raw_response || '', false)}
                className="flex items-center space-x-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copiedResponse ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {result.raw_response || '<No response content received>'}
            </div>
          </div>

          {/* Remediation & Mitigation */}
          {result.remediation_advice && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Code className="w-4 h-4" />
                  <span>Recommended Defensive Mitigation</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                  {result.remediation_advice.owasp_reference}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold">
                Strategy: {result.remediation_advice.strategy}
              </p>
              {result.remediation_advice.code_example && (
                <pre className="bg-[#090d16] p-3 rounded border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {result.remediation_advice.code_example}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0c1322] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono uppercase text-slate-200 rounded cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
