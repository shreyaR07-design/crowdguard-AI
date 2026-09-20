import React from 'react';
import { useSimStore } from '../../store/simulationStore';

export const RiskPanel: React.FC = () => {
  const { risk } = useSimStore();

  if (!risk) {
    return (
      <div className="p-4 border-b border-gray-800 text-xs text-gray-500">
        Waiting for AI risk assessment data...
      </div>
    );
  }

  const badgeStyles: Record<string, string> = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MODERATE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
  };

  const route = risk.evacuation_route;

  return (
    <div className="p-4 border-b border-gray-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">AI Risk Analysis Engine</h2>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
            badgeStyles[risk.overall_risk] ?? badgeStyles.LOW
          }`}
        >
          {risk.overall_risk}
        </span>
      </div>

      {/* Prototype notice */}
      <div className="bg-blue-950/40 border border-blue-800/40 rounded p-2 text-[10px] text-blue-300 leading-tight">
        {risk.disclaimer}
      </div>

      {/* Contributing Factors */}
      <div>
        <div className="text-[11px] font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
          <span className="text-indigo-400">⚡</span> Key Contributing Factors
        </div>
        <ul className="space-y-1 text-xs">
          {risk.contributing_factors.map((factor, index) => (
            <li
              key={index}
              className="text-[11px] text-gray-400 bg-gray-950/50 p-1.5 rounded border border-gray-800/80 flex items-start gap-1.5"
            >
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Dynamic Evacuation Route */}
      {route && (
        <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <span>🧭</span> Dynamic Evacuation Plan
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              {route.route_id}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 leading-relaxed">
            {route.description}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-emerald-800/20">
            <span>Exit Point: <b className="text-emerald-300">{route.exit_name}</b></span>
            <span>Est. Clearance: <b className="text-emerald-300">{route.estimated_time_minutes} min</b></span>
          </div>
        </div>
      )}
    </div>
  );
};
