import axios from 'axios';

const BASE_URL = typeof window !== 'undefined' && (window.location.port === '8000' || !window.location.port)
  ? ''
  : 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Reads ─────────────────────────────────────────────────────────────────────

export const fetchSimState   = () => api.get('/api/simulation/state').then(r => r.data);
export const fetchZones      = () => api.get('/api/zones').then(r => r.data);
export const fetchAgents     = () => api.get('/api/crowd').then(r => r.data);
export const fetchRisk       = () => api.get('/api/analysis/risk').then(r => r.data);
export const fetchEvents     = () => api.get('/api/events').then(r => r.data);

// ── Simulation controls ───────────────────────────────────────────────────────

export const startSimulation  = () => api.post('/api/simulation/start');
export const stopSimulation   = () => api.post('/api/simulation/stop');
export const resetSimulation  = () => api.post('/api/simulation/reset');

export const triggerSurge     = (zone_id: number) =>
  api.post('/api/simulation/surge', { zone_id });

export const addPeople        = (zone_id: number, count = 10) =>
  api.post('/api/simulation/add-people', { zone_id, count });

export const removePeople     = (zone_id: number, count = 10) =>
  api.post('/api/simulation/remove-people', { zone_id, count });

export const setDensity       = (multiplier: number) =>
  api.post('/api/simulation/density', { multiplier });

// ── Events ────────────────────────────────────────────────────────────────────

export const logEvent = (event_type: string, message: string, severity = 'info') =>
  api.post('/api/events', { event_type, message, severity });
