import React from 'react';
import {
  LayoutDashboard, Server, BookOpen, PlayCircle, Terminal,
  BarChart3, AlertTriangle, FileText, GitCompare, Settings, ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  hasActiveScan?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, hasActiveScan }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Target Config', icon: Server },
    { id: 'library', label: 'Attack Library', icon: BookOpen },
    { id: 'new-scan', label: 'New Security Scan', icon: PlayCircle },
    { id: 'live-scan', label: 'Live Telemetry', icon: Terminal, pulse: hasActiveScan },
    { id: 'results', label: 'Scan Results', icon: BarChart3 },
    { id: 'vulns', label: 'Vulnerability Details', icon: AlertTriangle },
    { id: 'findings', label: 'Security Findings', icon: ShieldAlert },
    { id: 'reports', label: 'Security Reports', icon: FileText },
    { id: 'comparison', label: 'Scan Comparison', icon: GitCompare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Main Console</p>
          <nav className="space-y-1">
            {menuItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.pulse && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Analysis & Audit</p>
          <nav className="space-y-1">
            {menuItems.slice(5, 10).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Configuration</p>
          <nav className="space-y-1">
            {menuItems.slice(10).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-slate-300 font-semibold">
          <span>ZERO-KEY DEMO</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">READY</span>
        </div>
        <p className="text-[10px] text-slate-400">Built-in Sandbox active with Secure, Vulnerable & Mixed modes.</p>
      </div>
    </aside>
  );
};
