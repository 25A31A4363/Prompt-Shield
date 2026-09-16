import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { TargetConfig } from './pages/TargetConfig';
import { AttackLibrary } from './pages/AttackLibrary';
import { NewScan } from './pages/NewScan';
import { LiveScan } from './pages/LiveScan';
import { ScanResults } from './pages/ScanResults';
import { VulnerabilityDetails } from './pages/VulnerabilityDetails';
import { Reports } from './pages/Reports';
import { ScanComparison } from './pages/ScanComparison';
import { Settings } from './pages/Settings';

export function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const handleNavigate = (view: string, scanId?: string) => {
    if (scanId) {
      setActiveScanId(scanId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanLaunched = (scanId: string) => {
    setActiveScanId(scanId);
    setCurrentView('live-scan');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar onNavigate={handleNavigate} currentView={currentView} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          hasActiveScan={currentView === 'live-scan'}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#080c14]">
          {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentView === 'targets' && <TargetConfig />}
          {currentView === 'library' && <AttackLibrary />}
          {currentView === 'new-scan' && (
            <NewScan onScanLaunched={handleScanLaunched} onNavigate={handleNavigate} />
          )}
          {currentView === 'live-scan' && (
            <LiveScan scanId={activeScanId} onNavigate={handleNavigate} />
          )}
          {currentView === 'results' && (
            <ScanResults scanId={activeScanId} onNavigate={handleNavigate} />
          )}
          {currentView === 'vulns' && (
            <VulnerabilityDetails scanId={activeScanId} onNavigate={handleNavigate} />
          )}
          {currentView === 'reports' && (
            <Reports scanId={activeScanId} onNavigate={handleNavigate} />
          )}
          {currentView === 'comparison' && (
            <ScanComparison initialScanId={activeScanId} onNavigate={handleNavigate} />
          )}
          {currentView === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default App;
