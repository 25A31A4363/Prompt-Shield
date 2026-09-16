import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Play, ArrowRight, Zap, Target,
  FileText, Activity, AlertTriangle, CheckCircle2, Server
} from 'lucide-react';
import { SecurityGauge } from '../components/SecurityGauge';
import { PromptScannerBox } from '../components/PromptScannerBox';
import { api } from '../services/api';
import { ScanRun, SecurityFinding } from '../types';

interface DashboardProps {
  onNavigate: (view: string, scanId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [recentScans, setRecentScans] = useState<ScanRun[]>([]);
  const [recentFindings, setRecentFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingDemo, setLaunchingDemo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [history, findingsData] = await Promise.all([
        api.getScanHistory(),
        api.getFindings()
      ]);
      setRecentScans(history);
      setRecentFindings(findingsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const launchQuickDemoScan = async (mode: 'MIXED' | 'VULNERABLE' | 'SECURE') => {
    try {
      setLaunchingDemo(true);
      const scan = await api.startScan({
        target_config: {
          name: `Built-in Sandbox (${mode} Mode)`,
          target_type: 'SANDBOX',
          sandbox_mode: mode,
          canary_secret: 'SECRET_FLAG_PROMPT_SHIELD_99'
        },
        attack_suite: 'ALL'
      });
      onNavigate('live-scan', scan.id);
    } catch (err) {
      alert(`Failed to launch scan: ${err}`);
      setLaunchingDemo(false);
    }
  };

  const latestScan = recentScans.length > 0 ? recentScans[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Cyber Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1427] via-[#0f1d38] to-[#0a1020] border border-cyan-900/40 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACADEMIC & HACKATHON CYBERSECURITY DEMONSTRATION</span>
            </div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              Prompt Injection <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Security Audit Platform</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Evaluate AI chatbots and LLMs against controlled prompt injection attacks. Identify instruction overrides, system prompt exfiltration, delimiter escapes, and generate actionable defensive remediation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => launchQuickDemoScan('MIXED')}
              disabled={launchingDemo}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-cyan-500/25 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{launchingDemo ? 'Starting Scan...' : 'Instant Demo Scan (Mixed Sandbox)'}</span>
            </button>
            <button
              onClick={() => onNavigate('new-scan')}
              className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs font-semibold px-4 py-3 rounded-lg transition cursor-pointer"
            >
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Configure Target Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Prompt Security Triage & Risk Analyzer Area */}
      <PromptScannerBox
        onNavigateToFindings={() => onNavigate('findings')}
        onFindingCreated={(newFinding) => {
          setRecentFindings((prev) => [newFinding, ...prev.filter(f => f.id !== newFinding.id)]);
        }}
      />

      {/* Overview Cards & Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Posture Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">Latest Security Posture</h2>
          {latestScan ? (
            <div className="cursor-pointer" onClick={() => onNavigate('results', latestScan.id)}>
              <SecurityGauge score={latestScan.security_score} grade={latestScan.grade} size={170} />
              <div className="text-center mt-3 text-[11px] font-mono text-slate-400">
                Target: <span className="text-slate-200 font-bold">{latestScan.target_name}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 font-mono text-xs">
              No audit scans recorded yet.
              <div className="mt-2 text-cyan-400 cursor-pointer" onClick={() => launchQuickDemoScan('MIXED')}>Run your first scan &rarr;</div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Total Audits Executed</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black font-mono text-slate-100">{recentScans.length}</span>
              <p className="text-xs text-slate-500 font-mono mt-1">Recorded in SQLite database</p>
            </div>
          </div>

          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Vulnerabilities Detected</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black font-mono text-rose-400">
                {latestScan ? latestScan.successful_count : 0}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-1">Exploited in latest scan</p>
            </div>
          </div>

          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Attacks Resisted</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black font-mono text-emerald-400">
                {latestScan ? latestScan.resisted_count : 0}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-1">Successfully defended</p>
            </div>
          </div>

          <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Built-in Target Modes</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-4 flex items-center space-x-1.5 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">Secure</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">Mixed</span>
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">Vuln</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Threat Categories Overview */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Covered Attack Categories (OWASP LLM01)</h2>
            <p className="text-xs text-slate-400 font-mono">Battery contains 14 structured, academic-safe attack test probes</p>
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <span>Explore Attack Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-cyan-400 font-bold mb-1">
              <span>DIR_OVR</span>
              <span className="text-[10px] text-orange-400">HIGH</span>
            </div>
            <p className="text-slate-300 text-[11px]">Direct Instruction Override</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
              <span>SYS_LEAK</span>
              <span className="text-[10px] text-rose-400">CRITICAL</span>
            </div>
            <p className="text-slate-300 text-[11px]">System Prompt Exfiltration</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-amber-400 font-bold mb-1">
              <span>DELIM_ESC</span>
              <span className="text-[10px] text-amber-400">MEDIUM</span>
            </div>
            <p className="text-slate-300 text-[11px]">Delimiter & Boundary Escape</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-cyan-400 font-bold mb-1">
              <span>ROLE_HYP</span>
              <span className="text-[10px] text-orange-400">HIGH</span>
            </div>
            <p className="text-slate-300 text-[11px]">Role-Play & Jailbreak Framing</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
              <span>IND_INJ</span>
              <span className="text-[10px] text-rose-400">CRITICAL</span>
            </div>
            <p className="text-slate-300 text-[11px]">Indirect Data Injection (Email/JSON)</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-amber-400 font-bold mb-1">
              <span>PAY_ENC</span>
              <span className="text-[10px] text-amber-400">MEDIUM</span>
            </div>
            <p className="text-slate-300 text-[11px]">Base64 / ROT13 Obfuscation</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-amber-400 font-bold mb-1">
              <span>CTX_CONF</span>
              <span className="text-[10px] text-amber-400">MEDIUM</span>
            </div>
            <p className="text-slate-300 text-[11px]">Context Distraction & Confusion</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('library')}>
            <span>+ View Full Taxonomy</span>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100">Audit Scan History</h2>
          <button
            onClick={() => onNavigate('comparison')}
            className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <span>Compare Scans Before/After Fix &rarr;</span>
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No previous scans found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Target Name</th>
                  <th className="py-2.5 px-3">Type / Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Score & Grade</th>
                  <th className="py-2.5 px-3">Breaches / Defended</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {recentScans.slice(0, 5).map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-100">{scan.target_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {scan.target_type} {scan.sandbox_mode ? `(${scan.sandbox_mode})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scan.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        scan.status === 'RUNNING' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse' :
                        'bg-rose-950 text-rose-300'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-100">{scan.security_score}%</span>
                      <span className="ml-2 font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 text-[10px]">
                        {scan.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-rose-400 font-bold">{scan.successful_count} breaches</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-emerald-400">{scan.resisted_count} defended</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(scan.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('results', scan.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold text-xs cursor-pointer hover:underline"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Team Triage Queue */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Security Team Triage Queue</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live queue of prompt security findings submitted for investigation and remediation
            </p>
          </div>
          <button
            onClick={() => onNavigate('findings')}
            className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <span>Open Full Findings Hub &rarr;</span>
          </button>
        </div>

        {recentFindings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No security findings logged yet. Use the prompt scanner above to analyze and dispatch risks to the security team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Finding ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Prompt Preview</th>
                  <th className="py-2.5 px-3">Logged Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentFindings.slice(0, 5).map((finding) => (
                  <tr key={finding.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-bold text-cyan-400">
                      #{finding.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {finding.risk_category}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        finding.severity === 'CRITICAL' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        finding.severity === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        finding.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-400" title={finding.prompt}>
                      "{finding.prompt}"
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(finding.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        finding.status === 'NEW' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                        finding.status === 'UNDER REVIEW' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        finding.status === 'CONFIRMED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {finding.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('findings')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold text-xs cursor-pointer hover:underline"
                      >
                        Triage &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
