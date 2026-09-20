import React from 'react';
import { useSimStore } from '../../store/simulationStore';

export const EventLog: React.FC = () => {
  const { events } = useSimStore();

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'text-red-400 bg-red-950/60 border-red-800';
      case 'warning':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      default:
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
    }
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Incident & Audit Trail</h2>
        <span className="text-[10px] text-gray-500 font-mono">{events.length} records</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
        {events.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-2">No event logs recorded yet.</div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-2 rounded bg-gray-950/40 border border-gray-800/80 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className={`px-1.5 py-0.2 rounded border font-semibold uppercase ${severityBadge(evt.severity)}`}>
                  {evt.event_type}
                </span>
                <span className="text-gray-500 font-mono">
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}
                </span>
              </div>
              <div className="text-gray-300 text-[11px] leading-snug">
                {evt.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
