import React from 'react';
import { Shield, Radio, Play, Activity } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  return (
    <header className="h-16 bg-[#0c1322] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 cyber-glow-cyan">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-wider text-slate-100 uppercase">Prompt<span className="text-cyan-400">Shield</span></span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold tracking-wide">v1.0-CYBER</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">AI Prompt Injection Audit & Evaluation Platform</p>
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-md">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">ENGINE STATUS:</span>
          <span className="text-emerald-400 font-semibold">ACTIVE DEFENSE</span>
        </div>

        <button
          onClick={() => onNavigate('new-scan')}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer font-mono uppercase tracking-wide"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Audit Scan</span>
        </button>
      </div>
    </header>
  );
};
