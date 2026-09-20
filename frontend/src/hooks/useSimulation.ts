import { useEffect, useRef, useCallback } from 'react';
import { useSimStore } from '../store/simulationStore';
import * as api from '../api/client';

/**
 * Continuously polls all backend endpoints.
 * Interval: 500ms when simulation is running, 1500ms when stopped.
 * Uses recursive setTimeout so the interval adapts dynamically.
 */
export function useSimulationPolling() {
  const {
    setSimState, setZones, setAgents, setRisk, setEvents,
    setConnected, setLastError,
  } = useSimStore();

  const isRunningRef  = useRef(false);
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef  = useRef(true);

  const poll = useCallback(async () => {
    try {
      const [state, zones, agents, risk, events] = await Promise.all([
        api.fetchSimState(),
        api.fetchZones(),
        api.fetchAgents(),
        api.fetchRisk(),
        api.fetchEvents(),
      ]);

      if (!isMountedRef.current) return;

      isRunningRef.current = state.is_running;
      setSimState(state);
      setZones(zones);
      setAgents(agents);
      setRisk(risk);
      setEvents(events);
      setConnected(true);
      setLastError(null);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Backend unreachable';
      setConnected(false);
      setLastError(msg);
    }
  }, [setSimState, setZones, setAgents, setRisk, setEvents, setConnected, setLastError]);

  const scheduleNext = useCallback(() => {
    const interval = isRunningRef.current ? 500 : 1500;
    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      await poll();
      scheduleNext();
    }, interval);
  }, [poll]);

  useEffect(() => {
    isMountedRef.current = true;

    // Immediate first fetch
    poll().then(() => scheduleNext());

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [poll, scheduleNext]);
}
