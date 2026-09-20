// ── Zone ──────────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Zone {
  id:          number;
  name:        string;
  capacity:    number;
  x:           number;
  z:           number;
  width:       number;
  depth:       number;
  color:       string;
  agent_count: number;
  density:     number;
  risk_level:  RiskLevel;
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export type AgentState = 'idle' | 'moving' | 'surge';

export interface Agent {
  id:      number;
  zone_id: number;
  x:       number;
  z:       number;
  state:   AgentState;
}

// ── Simulation state ──────────────────────────────────────────────────────────

export interface SimState {
  is_running:         boolean;
  tick:               number;
  density_multiplier: number;
  selected_zone_id:   number | null;
  total_agents:       number;
}

// ── Risk analysis ─────────────────────────────────────────────────────────────

export interface EvacRoute {
  route_id:               string;
  exit_name:              string;
  description:            string;
  waypoints:              [number, number, number][];
  estimated_time_minutes: number;
  congestion_level:       string;
}

export interface RiskAnalysis {
  is_simulated:        boolean;
  disclaimer:          string;
  overall_risk:        RiskLevel;
  risk_score:          number;
  zones:               Zone[];
  contributing_factors: string[];
  evacuation_route:    EvacRoute;
}

// ── Event ─────────────────────────────────────────────────────────────────────

export type Severity = 'info' | 'warning' | 'critical';

export interface EventItem {
  id:         number;
  timestamp:  string | null;
  event_type: string;
  message:    string;
  severity:   Severity;
}
