import React from 'react';
import { useSimStore } from '../../store/simulationStore';

export const StatsCards: React.FC = () => {
  const { simState, zones, risk } = useSimStore();

  const totalAgents = simState?.total_agents ?? 0;
  const totalCapacity = zones.reduce((acc, z) => acc + z.capacity, 0);
  const avgDensity = totalCapacity > 0 ? Math.round((totalAgents / totalCapacity) * 100) : 0;
  const activeZoneCount = zones.filter((z) => z.agent_count > 0).length;
  const riskScore = risk?.risk_score ?? 0;

  return (
    <div className="p-4 border-b border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Campus Telemetry</h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/50">
          <div className="text-xs text-gray-400 font-medium">Total Crowd</div>
          <div className="text-xl font-bold text-white tracking-tight mt-0.5">{totalAgents}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Capacity: {totalCapacity}</div>
        </div>

        <div className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/50">
          <div className="text-xs text-gray-400 font-medium">Avg Density</div>
          <div className={`text-xl font-bold tracking-tight mt-0.5 ${
            avgDensity > 80 ? 'text-red-400' : avgDensity > 50 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {avgDensity}%
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Across 5 zones</div>
        </div>

        <div className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/50">
          <div className="text-xs text-gray-400 font-medium">Active Zones</div>
          <div className="text-xl font-bold text-white tracking-tight mt-0.5">
            {activeZoneCount} / {zones.length || 5}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Monitored sectors</div>
        </div>

        <div className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/50">
          <div className="text-xs text-gray-400 font-medium">Risk Index</div>
          <div className={`text-xl font-bold tracking-tight mt-0.5 ${
            riskScore > 75 ? 'text-red-400' : riskScore > 50 ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {riskScore}
            <span className="text-xs text-gray-500 font-normal"> / 100</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Weighted metric</div>
        </div>
      </div>

      {/* Per Zone Micro Bars */}
      <div className="mt-3 space-y-2">
        <div className="text-[11px] font-medium text-gray-400">Zone Occupancy vs Capacity</div>
        {zones.map((zone) => {
          const pct = Math.min(100, Math.round(zone.density * 100));
          const colorClass =
            zone.risk_level === 'CRITICAL' ? 'bg-red-500' :
            zone.risk_level === 'HIGH' ? 'bg-orange-500' :
            zone.risk_level === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-500';

          return (
            <div key={zone.id} className="text-xs">
              <div className="flex justify-between items-center text-gray-300 text-[11px] mb-0.5">
                <span className="truncate">{zone.name}</span>
                <span className="font-mono text-gray-400">
                  {zone.agent_count}/{zone.capacity} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
