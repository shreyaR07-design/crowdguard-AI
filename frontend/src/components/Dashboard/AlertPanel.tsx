import React from 'react';
import { useSimStore } from '../../store/simulationStore';

export const AlertPanel: React.FC = () => {
  const { risk, zones } = useSimStore();

  if (!risk || (risk.overall_risk !== 'CRITICAL' && risk.overall_risk !== 'HIGH')) {
    return null;
  }

  const isCritical = risk.overall_risk === 'CRITICAL';
  const highZones = zones.filter((z) => z.risk_level === 'CRITICAL' || z.risk_level === 'HIGH');

  return (
    <div
      className={`p-3 border-b flex items-start gap-2.5 transition-colors duration-300 ${
        isCritical
          ? 'bg-red-950/80 border-red-800 text-red-200'
          : 'bg-amber-950/80 border-amber-800 text-amber-200'
      }`}
    >
      <div className="text-lg animate-bounce leading-none mt-0.5">
        {isCritical ? '🚨' : '⚠️'}
      </div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider">
            {isCritical ? 'CRITICAL CROWD SURGE ALERT' : 'ELEVATED CROWD DENSITY WARNING'}
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40">
            Automated Trigger
          </span>
        </div>
        <p className="text-[11px] leading-snug opacity-90">
          {highZones.length > 0 ? (
            <>
              High congestion detected in{' '}
              <strong className="underline">
                {highZones.map((z) => `${z.name} (${Math.round(z.density * 100)}%)`).join(', ')}
              </strong>
              . Recommended action: Direct flow towards{' '}
              <strong>{risk.evacuation_route.exit_name}</strong>.
            </>
          ) : (
            'High crowd densities detected across multiple zones. Please review active evacuation corridors.'
          )}
        </p>
      </div>
    </div>
  );
};
