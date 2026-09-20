import { Suspense } from 'react';
import { CampusScene }  from './components/Canvas3D/CampusScene';
import { StatsCards }   from './components/Dashboard/StatsCards';
import { RiskPanel }    from './components/Dashboard/RiskPanel';
import { EventLog }     from './components/Dashboard/EventLog';
import { AlertPanel }   from './components/Dashboard/AlertPanel';
import { SimControls }  from './components/Controls/SimControls';
import { useSimulationPolling } from './hooks/useSimulation';
import { useSimStore }  from './store/simulationStore';

function StatusBar() {
  const { simState, risk, isConnected, lastError } = useSimStore();
  const level = risk?.overall_risk ?? 'LOW';

  const riskBadge: Record<string, string> = {
    LOW:      'bg-green-500/20  text-green-400  border-green-500/30',
    MODERATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    HIGH:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20    text-red-400    border-red-500/30',
  };

  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-gray-900/95 border-b border-gray-800 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-black text-white select-none">
          CG
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">CrowdGuard AI</h1>
          <p className="text-xs text-gray-500 leading-none mt-0.5">Intelligent 3D Crowd Safety System</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-3">
        {!isConnected && (
          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
            ⚠ {lastError ?? 'Backend offline'}
          </span>
        )}

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          simState?.is_running
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-gray-700/50 text-gray-400 border-gray-700'
        }`}>
          {simState?.is_running ? '● LIVE' : '○ STOPPED'}
        </span>

        <span className="text-xs text-gray-600 font-mono">
          tick&nbsp;{simState?.tick ?? 0}
        </span>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskBadge[level]}`}>
          {level} RISK
        </span>
      </div>
    </header>
  );
}

export default function App() {
  useSimulationPolling();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <StatusBar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 3-D Canvas + Controls ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 relative">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Loading 3D campus…
              </div>
            }>
              <CampusScene />
            </Suspense>
          </div>

          {/* Controls bar */}
          <div className="shrink-0 px-4 py-2.5 bg-gray-900/90 border-t border-gray-800">
            <SimControls />
          </div>
        </div>

        {/* ── Dashboard sidebar ─────────────────────────────────────────────── */}
        <aside className="w-80 xl:w-96 shrink-0 flex flex-col bg-gray-900/80 border-l border-gray-800 overflow-y-auto">
          <AlertPanel />
          <StatsCards />
          <RiskPanel />
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
