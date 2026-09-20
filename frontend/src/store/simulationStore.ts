import { create } from 'zustand';
import type { SimState, Zone, Agent, RiskAnalysis, EventItem } from '../types';

interface SimulationStore {
  // ── Data from API ──────────────────────────────────────────────────────────
  simState:       SimState | null;
  zones:          Zone[];
  agents:         Agent[];
  risk:           RiskAnalysis | null;
  events:         EventItem[];

  // ── UI state ───────────────────────────────────────────────────────────────
  selectedZoneId: number;
  isConnected:    boolean;
  lastError:      string | null;

  // ── Setters ────────────────────────────────────────────────────────────────
  setSimState:      (s: SimState)      => void;
  setZones:         (z: Zone[])        => void;
  setAgents:        (a: Agent[])       => void;
  setRisk:          (r: RiskAnalysis)  => void;
  setEvents:        (e: EventItem[])   => void;
  setSelectedZoneId:(id: number)       => void;
  setConnected:     (c: boolean)       => void;
  setLastError:     (e: string | null) => void;
}

export const useSimStore = create<SimulationStore>((set) => ({
  simState:       null,
  zones:          [],
  agents:         [],
  risk:           null,
  events:         [],
  selectedZoneId: 1,
  isConnected:    false,
  lastError:      null,

  setSimState:       (simState)       => set({ simState }),
  setZones:          (zones)          => set({ zones }),
  setAgents:         (agents)         => set({ agents }),
  setRisk:           (risk)           => set({ risk }),
  setEvents:         (events)         => set({ events }),
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  setConnected:      (isConnected)    => set({ isConnected }),
  setLastError:      (lastError)      => set({ lastError }),
}));
