import React, { useState, useEffect } from 'react';
import { PlayCircle, Server, Shield, Layers, Play, AlertCircle, Info, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { TargetConfig, SandboxMode } from '../types';

interface NewScanProps {
  onScanLaunched: (scanId: string) => void;
  onNavigate: (view: string) => void;
}

export const NewScan: React.FC<NewScanProps> = ({ onScanLaunched, onNavigate }) => {
  const [targets, setTargets] = useState<TargetConfig[]>([]);
  const [selectedTargetMode, setSelectedTargetMode] = useState<'SANDBOX_PRESET' | 'SAVED_TARGET'>('SANDBOX_PRESET');
  const [sandboxMode, setSandboxMode] = useState<SandboxMode>('MIXED');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [attackSuite, setAttackSuite] = useState<string>('ALL');
  const [enableLlmJudge, setEnableLlmJudge] = useState<boolean>(false);
  const [launching, setLaunching] = useState<boolean>(false);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const data = await api.getTargets();
      setTargets(data);
      if (data.length > 0) {
        setSelectedTargetId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLaunching(true);

      let payload: any = {
        attack_suite: attackSuite,
        enable_llm_judge: enableLlmJudge
      };

      if (selectedTargetMode === 'SAVED_TARGET' && selectedTargetId) {
        payload.target_id = selectedTargetId;
      } else {
        payload.target_config = {
          name: `Built-in Sandbox (${sandboxMode} Mode)`,
          target_type: 'SANDBOX',
          sandbox_mode: sandboxMode,
          canary_secret: 'SECRET_FLAG_PROMPT_SHIELD_99'
        };
      }

      const scan = await api.startScan(payload);
      onScanLaunched(scan.id);
    } catch (err: any) {
      alert(`Failed to launch scan: ${err.message}`);
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
          <PlayCircle className="w-6 h-6 text-cyan-400" />
          <span>Launch New Security Scan</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Select an AI target endpoint and execute a controlled prompt injection attack battery.
        </p>
      </div>

      <form onSubmit={handleLaunchScan} className="space-y-6">
        {/* Target Selection Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-slate-400 font-semibold">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Step 1: Choose Target Endpoint</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedTargetMode('SANDBOX_PRESET')}
              className={`p-4 rounded-lg border text-left cursor-pointer transition ${
                selectedTargetMode === 'SANDBOX_PRESET'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 cyber-glow-cyan'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center space-x-2 mb-1 text-slate-100">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Zero-Key Sandbox Simulator</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instant test target with configurable defense posture. No external API key required.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTargetMode('SAVED_TARGET')}
              className={`p-4 rounded-lg border text-left cursor-pointer transition ${
                selectedTargetMode === 'SAVED_TARGET'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 cyber-glow-cyan'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center space-x-2 mb-1 text-slate-100">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Saved Target Profile</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Test a configured external OpenAI endpoint or Custom Webhook.
              </p>
            </button>
          </div>

          {/* Sandbox Mode Selector */}
          {selectedTargetMode === 'SANDBOX_PRESET' ? (
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              <label className="block text-slate-300 font-semibold uppercase">
                Sandbox Posture Preset:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className={`p-3 rounded border cursor-pointer ${
                  sandboxMode === 'MIXED' ? 'bg-amber-950/50 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <input
                      type="radio"
                      name="posture"
                      value="MIXED"
                      checked={sandboxMode === 'MIXED'}
                      onChange={() => setSandboxMode('MIXED')}
                      className="text-amber-500"
                    />
                    <span>Mixed Mode (Demo)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Balanced scan with both successful breaches and resisted attacks (~60% score).</p>
                </label>

                <label className={`p-3 rounded border cursor-pointer ${
                  sandboxMode === 'VULNERABLE' ? 'bg-rose-950/50 border-rose-500 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <input
                      type="radio"
                      name="posture"
                      value="VULNERABLE"
                      checked={sandboxMode === 'VULNERABLE'}
                      onChange={() => setSandboxMode('VULNERABLE')}
                      className="text-rose-500"
                    />
                    <span>Vulnerable Mode</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Naive LLM with severe prompt leaks and override compliance (~20% score).</p>
                </label>

                <label className={`p-3 rounded border cursor-pointer ${
                  sandboxMode === 'SECURE' ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <input
                      type="radio"
                      name="posture"
                      value="SECURE"
                      checked={sandboxMode === 'SECURE'}
                      onChange={() => setSandboxMode('SECURE')}
                      className="text-emerald-500"
                    />
                    <span>Secure Mode</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Hardened target with strict refusal filters and canary scrubbing (~95% score).</p>
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              <label className="block text-slate-300 font-semibold uppercase">
                Select Saved Target:
              </label>
              {targets.length === 0 ? (
                <div className="text-slate-500 py-2">
                  No saved targets found.{' '}
                  <span
                    onClick={() => onNavigate('targets')}
                    className="text-cyan-400 underline cursor-pointer"
                  >
                    Configure a target now &rarr;
                  </span>
                </div>
              ) : (
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 outline-none"
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.target_type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Attack Suite Selection Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-slate-400 font-semibold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Step 2: Select Attack Suite</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <label className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between ${
              attackSuite === 'ALL' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-1 text-slate-100">
                <input
                  type="radio"
                  name="suite"
                  value="ALL"
                  checked={attackSuite === 'ALL'}
                  onChange={() => setAttackSuite('ALL')}
                  className="text-cyan-500"
                />
                <span>Full OWASP Battery (14 Probes)</span>
              </div>
              <p className="text-[11px] text-slate-400">Complete audit across all 7 prompt injection threat categories.</p>
            </label>

            <label className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between ${
              attackSuite === 'QUICK' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-1 text-slate-100">
                <input
                  type="radio"
                  name="suite"
                  value="QUICK"
                  checked={attackSuite === 'QUICK'}
                  onChange={() => setAttackSuite('QUICK')}
                  className="text-cyan-500"
                />
                <span>Quick Audit (7 Probes)</span>
              </div>
              <p className="text-[11px] text-slate-400">One representative test case per threat category. Fast execution.</p>
            </label>

            <label className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between ${
              attackSuite === 'CRITICAL' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-1 text-slate-100">
                <input
                  type="radio"
                  name="suite"
                  value="CRITICAL"
                  checked={attackSuite === 'CRITICAL'}
                  onChange={() => setAttackSuite('CRITICAL')}
                  className="text-cyan-500"
                />
                <span>Critical Threats Only (4 Probes)</span>
              </div>
              <p className="text-[11px] text-slate-400">Targets system prompt exfiltration and indirect data injection.</p>
            </label>
          </div>

          {/* Optional LLM Judge Toggle */}
          <div className="pt-3 border-t border-slate-800">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableLlmJudge}
                onChange={(e) => setEnableLlmJudge(e.target.checked)}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-cyan-500"
              />
              <div className="text-xs font-mono">
                <span className="font-bold text-slate-200 block">Enable Secondary LLM Judge for Ambiguous Cases</span>
                <span className="text-slate-400 leading-relaxed text-[11px]">
                  Activates Stage 5 secondary analysis for edge cases where heuristics are borderline. 
                  <strong className="text-amber-400 ml-1">Note:</strong> Deterministic evidence (Canary breaches and explicit refusals) strictly takes precedence and cannot be overridden.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={launching}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold px-8 py-3.5 rounded-xl shadow-xl hover:shadow-cyan-500/25 transition cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{launching ? 'Dispatching Probes...' : 'Launch Security Audit Scan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
