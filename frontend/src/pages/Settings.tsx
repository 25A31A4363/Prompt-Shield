import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Database, Lock, Globe, Server, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setChecking(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          <span>System & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Review SSRF firewall policies, rate limiting, and core evaluation engine configuration.
        </p>
      </div>

      {/* Engine Status Card */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Core Engine Health & Telemetry</span>
          </h2>
          <button
            onClick={checkHealth}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer transition"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
            <span>Refresh Ping</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">API Status</span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{health?.status === 'healthy' ? 'ONLINE' : 'CHECKING...'}</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Service Version</span>
            <span className="text-slate-200 font-bold">{health?.version || '1.0.0'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Database</span>
            <span className="text-slate-200 font-bold">SQLite (aiosqlite)</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Async Concurrency</span>
            <span className="text-cyan-400 font-bold">2 Workers</span>
          </div>
        </div>
      </div>

      {/* SSRF Firewall & Defensive Guardrails */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Active SSRF & Network Isolation Guardrails</span>
        </h2>
        <p className="text-slate-400 leading-relaxed">
          PromptShield strictly enforces pre-flight validation on all user-supplied target endpoints to prevent Server-Side Request Forgery (SSRF) and internal cloud metadata probing:
        </p>

        <div className="space-y-2">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Cloud Instance Metadata Protection</span>
              <span className="text-[11px] text-slate-400">Blocks access to AWS/GCP/Azure link-local endpoint (169.254.169.254)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
              BLOCKED
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Private Subnet Probing (RFC 1918)</span>
              <span className="text-[11px] text-slate-400">Blocks 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
              BLOCKED
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Localhost Ollama AI Testing Whitelist</span>
              <span className="text-[11px] text-slate-400">Permits local connections strictly to port 11434 for local model testing</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-[10px]">
              WHITELISTED
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation & Canary Parameters */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Canary & Benchmark Settings</span>
        </h2>
        <div className="space-y-3">
          <div>
            <span className="text-slate-400 block mb-1">Standard Instruction Override Canary Token:</span>
            <code className="block p-2.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
              CANARY_OVERRIDE_ACTIVE_7x9
            </code>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">System Prompt Confidential Exfiltration Flag:</span>
            <code className="block p-2.5 rounded bg-slate-950 border border-slate-800 text-rose-300">
              SECRET_FLAG_PROMPT_SHIELD_99
            </code>
          </div>
        </div>
      </div>

      {/* Project & Hackathon Credits */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0c1427] border border-slate-800 rounded-xl p-6 font-mono text-xs space-y-2">
        <span className="text-cyan-400 font-bold block uppercase tracking-wider">Academic & Hackathon Demonstration</span>
        <p className="text-slate-400 leading-relaxed">
          PromptShield was built as an academic AI security evaluation tool. All adversarial attack probes utilize non-destructive canary verification to test LLM robustness without risking real-world weaponization.
        </p>
      </div>
    </div>
  );
};
