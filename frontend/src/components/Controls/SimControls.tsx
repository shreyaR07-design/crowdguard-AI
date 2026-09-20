import React, { useState } from 'react';
import { useSimStore } from '../../store/simulationStore';
import * as api from '../../api/client';

export const SimControls: React.FC = () => {
  const {
    simState,
    zones,
    selectedZoneId,
    setSelectedZoneId,
    setSimState,
    setZones,
    setAgents,
    setRisk,
    setEvents,
  } = useSimStore();

  const [densityVal, setDensityVal] = useState<number>(1.0);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isRunning = simState?.is_running ?? false;

  // Helper to re-fetch and update store immediately after an action
  const refreshAll = async () => {
    try {
      const [state, zList, aList, riskData, evtList] = await Promise.all([
        api.fetchSimState(),
        api.fetchZones(),
        api.fetchAgents(),
        api.fetchRisk(),
        api.fetchEvents(),
      ]);
      setSimState(state);
      setZones(zList);
      setAgents(aList);
      setRisk(riskData);
      setEvents(evtList);
    } catch (e) {
      console.error('Failed to refresh data after mutation:', e);
    }
  };

  const handleStartStop = async () => {
    setLoadingAction('toggle');
    try {
      if (isRunning) {
        await api.stopSimulation();
      } else {
        await api.startSimulation();
      }
      await refreshAll();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('reset');
    try {
      await api.resetSimulation();
      setDensityVal(1.0);
      await refreshAll();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSurge = async () => {
    setLoadingAction('surge');
    try {
      await api.triggerSurge(selectedZoneId);
      await refreshAll();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddPeople = async (count: number = 25) => {
    setLoadingAction('add');
    try {
      await api.addPeople(selectedZoneId, count);
      await refreshAll();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemovePeople = async (count: number = 25) => {
    setLoadingAction('remove');
    try {
      await api.removePeople(selectedZoneId, count);
      await refreshAll();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDensityChange = async (newVal: number) => {
    setDensityVal(newVal);
    try {
      await api.setDensity(newVal);
      await refreshAll();
    } catch (e) {
      console.error('Error changing density:', e);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Simulation Play/Pause & Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleStartStop}
          disabled={loadingAction !== null}
          className={`px-3.5 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <span>{isRunning ? '⏸ Pause Sim' : '▶ Start Sim'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loadingAction !== null}
          className="px-3 py-1.5 rounded font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
        >
          🔄 Reset
        </button>
      </div>

      {/* Target Zone Selector */}
      <div className="flex items-center gap-2">
        <label className="text-gray-400 font-medium">Target Zone:</label>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(Number(e.target.value))}
          className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 font-medium focus:outline-none focus:border-indigo-500"
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} ({zone.agent_count} ppl)
            </option>
          ))}
        </select>
      </div>

      {/* Add / Remove Crowd */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAddPeople(20)}
          disabled={loadingAction !== null}
          className="px-2.5 py-1.5 rounded font-medium bg-indigo-700 hover:bg-indigo-600 text-white transition-colors"
          title="Add 20 people to target zone"
        >
          + Add People
        </button>
        <button
          onClick={() => handleRemovePeople(20)}
          disabled={loadingAction !== null}
          className="px-2.5 py-1.5 rounded font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
          title="Remove 20 people from target zone"
        >
          - Remove People
        </button>
      </div>

      {/* Crowd Surge Button */}
      <div>
        <button
          onClick={handleSurge}
          disabled={loadingAction !== null}
          className="px-3.5 py-1.5 rounded font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors animate-pulse-fast shadow-md flex items-center gap-1"
        >
          <span>🚨 Simulate Crowd Surge</span>
        </button>
      </div>

      {/* Density / Speed Multiplier Slider */}
      <div className="flex items-center gap-2 bg-gray-950/60 px-3 py-1 rounded border border-gray-800">
        <span className="text-gray-400 font-medium whitespace-nowrap">Crowd Velocity:</span>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={densityVal}
          onChange={(e) => handleDensityChange(parseFloat(e.target.value))}
          className="w-24 accent-indigo-500 cursor-pointer"
        />
        <span className="font-mono text-indigo-400 text-[11px] w-8">
          {densityVal.toFixed(1)}x
        </span>
      </div>
    </div>
  );
};
