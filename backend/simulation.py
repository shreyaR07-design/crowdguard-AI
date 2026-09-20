"""
Crowd Simulation Engine
-----------------------
Manages all agent positions in SQLite.
A background asyncio task ticks the simulation at TICK_INTERVAL seconds.
The tick loop always runs; it checks is_running before doing work.
"""
import asyncio
import math
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CrowdAgent, Exit, SimulationState, EventLog

TICK_INTERVAL = 0.5   # seconds between simulation ticks

# ── Campus zone definitions (must mirror frontend CAMPUS_CONFIG) ──────────────
ZONES_DATA = [
    {"id": 1, "name": "Auditorium",  "capacity": 400, "x":   0.0, "z":   0.0, "width": 24.0, "depth": 18.0, "color": "#6366f1"},
    {"id": 2, "name": "Library",     "capacity": 200, "x": -35.0, "z":   0.0, "width": 16.0, "depth": 14.0, "color": "#0ea5e9"},
    {"id": 3, "name": "Main Hall",   "capacity": 300, "x":  35.0, "z":   0.0, "width": 18.0, "depth": 16.0, "color": "#f59e0b"},
    {"id": 4, "name": "Cafeteria",   "capacity": 250, "x":   0.0, "z": -32.0, "width": 20.0, "depth": 14.0, "color": "#10b981"},
    {"id": 5, "name": "Gymnasium",   "capacity": 350, "x":   0.0, "z":  32.0, "width": 22.0, "depth": 16.0, "color": "#ef4444"},
]

EXITS_DATA = [
    {"id": 1, "name": "North Gate",            "zone_id": 4, "x":   0.0, "z": -56.0, "capacity": 200, "direction": "north"},
    {"id": 2, "name": "South Gate",            "zone_id": 5, "x":   0.0, "z":  56.0, "capacity": 200, "direction": "south"},
    {"id": 3, "name": "East Emergency Exit",   "zone_id": 3, "x":  58.0, "z":   0.0, "capacity": 150, "direction": "east"},
    {"id": 4, "name": "West Fire Exit",        "zone_id": 2, "x": -58.0, "z":   0.0, "capacity": 150, "direction": "west"},
]

# Distribution of 150 default agents across zones (indices match ZONES_DATA)
DEFAULT_DISTRIBUTION = [0.35, 0.15, 0.20, 0.15, 0.15]
DEFAULT_AGENT_COUNT  = 150


def zone_agent_bounds(zone: dict) -> tuple[float, float, float, float]:
    """
    Returns (x_min, x_max, z_min, z_max) for agent walking area.
    Agents walk in a region AROUND the building footprint, not inside it,
    so they are visible on the ground plane.
    """
    hw = zone["width"]  / 2 + 4   # 4 units outside the building edge
    hd = zone["depth"]  / 2 + 4
    return (zone["x"] - hw, zone["x"] + hw, zone["z"] - hd, zone["z"] + hd)


def _classify_risk(density: float) -> str:
    if density < 0.50:
        return "LOW"
    elif density < 0.75:
        return "MODERATE"
    elif density < 0.90:
        return "HIGH"
    return "CRITICAL"


# ── Simulation Engine ─────────────────────────────────────────────────────────

class SimulationEngine:
    def __init__(self):
        self._zones_by_id: dict[int, dict] = {z["id"]: z for z in ZONES_DATA}

    # ── Initialisation ────────────────────────────────────────────────────────

    def initialize_db(self) -> None:
        """Seed zones, exits, and initial agents if the DB is empty."""
        from database import engine, Base
        from models import Zone, Exit, CrowdAgent, SimulationState, EventLog
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        try:

            # Zones
            for zd in ZONES_DATA:
                if not db.query(Zone).filter_by(id=zd["id"]).first():
                    db.add(Zone(**zd))

            # Exits
            for ed in EXITS_DATA:
                if not db.query(Exit).filter_by(id=ed["id"]).first():
                    db.add(Exit(**ed))

            # Simulation state (singleton row, id=1)
            state = db.query(SimulationState).filter_by(id=1).first()
            if not state:
                db.add(SimulationState(
                    id=1, is_running=False, tick=0, density_multiplier=1.0
                ))
            else:
                # Reset running state on restart
                state.is_running = False

            # Seed default agents if none exist
            if db.query(CrowdAgent).count() == 0:
                self._seed_agents(db, DEFAULT_AGENT_COUNT)

            db.commit()
        finally:
            db.close()

    def _seed_agents(self, db: Session, total: int) -> None:
        per_zone = [max(1, int(total * frac)) for frac in DEFAULT_DISTRIBUTION]
        for zone, n in zip(ZONES_DATA, per_zone):
            x_min, x_max, z_min, z_max = zone_agent_bounds(zone)
            for _ in range(n):
                x  = random.uniform(x_min, x_max)
                z  = random.uniform(z_min, z_max)
                tx = random.uniform(x_min, x_max)
                tz = random.uniform(z_min, z_max)
                db.add(CrowdAgent(
                    zone_id=zone["id"],
                    x=x, z=z,
                    target_x=tx, target_z=tz,
                    speed=random.uniform(0.25, 0.55),
                    state="idle",
                ))

    # ── Tick ─────────────────────────────────────────────────────────────────

    def _do_tick(self, db: Session) -> None:
        state = db.query(SimulationState).filter_by(id=1).first()
        if not state or not state.is_running:
            return

        state.tick += 1
        speed_mult = max(0.1, state.density_multiplier)
        agents = db.query(CrowdAgent).all()

        for agent in agents:
            zone = self._zones_by_id.get(agent.zone_id)
            if not zone:
                continue

            x_min, x_max, z_min, z_max = zone_agent_bounds(zone)

            dx   = agent.target_x - agent.x
            dz   = agent.target_z - agent.z
            dist = math.sqrt(dx * dx + dz * dz)

            if dist < 0.6:
                # Reached target – pick a new one
                if agent.state == "surge":
                    # During surge, orbit the zone centre
                    agent.target_x = zone["x"] + random.uniform(-4, 4)
                    agent.target_z = zone["z"] + random.uniform(-4, 4)
                else:
                    agent.target_x = random.uniform(x_min, x_max)
                    agent.target_z = random.uniform(z_min, z_max)
                    agent.state = "moving"
            else:
                step = agent.speed * speed_mult
                agent.x += (dx / dist) * min(step, dist)
                agent.z += (dz / dist) * min(step, dist)
                # Clamp inside zone bounds
                agent.x = max(x_min, min(x_max, agent.x))
                agent.z = max(z_min, min(z_max, agent.z))

        db.commit()

    async def _run_loop(self) -> None:
        """Infinite async loop – runs regardless of is_running flag."""
        while True:
            try:
                db = SessionLocal()
                try:
                    self._do_tick(db)
                finally:
                    db.close()
            except Exception as exc:
                print(f"[SimEngine] tick error: {exc}")
            await asyncio.sleep(TICK_INTERVAL)

    # ── Public control methods (called by API routes) ─────────────────────────

    def set_running(self, running: bool) -> None:
        db = SessionLocal()
        try:
            state = db.query(SimulationState).filter_by(id=1).first()
            state.is_running = running
            db.commit()
            evt = "START" if running else "STOP"
            msg = "Simulation started" if running else "Simulation stopped"
            sev = "info"
            self._log(db, evt, msg, sev)
        finally:
            db.close()

    def reset(self) -> None:
        db = SessionLocal()
        try:
            db.query(CrowdAgent).delete()
            self._seed_agents(db, DEFAULT_AGENT_COUNT)
            state = db.query(SimulationState).filter_by(id=1).first()
            state.tick = 0
            state.is_running = False
            state.density_multiplier = 1.0
            db.commit()
            self._log(db, "RESET", "Simulation reset to default state", "info")
        finally:
            db.close()

    def trigger_surge(self, zone_id: int) -> None:
        db = SessionLocal()
        try:
            zone = self._zones_by_id.get(zone_id, ZONES_DATA[0])
            all_agents = db.query(CrowdAgent).all()

            # Redirect half of agents from other zones into the surge zone
            outsiders = [a for a in all_agents if a.zone_id != zone_id]
            random.shuffle(outsiders)
            redirect_count = max(1, len(outsiders) // 2)
            for agent in outsiders[:redirect_count]:
                agent.zone_id = zone_id
                agent.target_x = zone["x"] + random.uniform(-6, 6)
                agent.target_z = zone["z"] + random.uniform(-6, 6)
                agent.state = "surge"

            # Mark existing zone agents as surge
            for agent in all_agents:
                if agent.zone_id == zone_id:
                    agent.state = "surge"
                    agent.target_x = zone["x"] + random.uniform(-5, 5)
                    agent.target_z = zone["z"] + random.uniform(-5, 5)

            # Inject additional surge agents to reach critical density
            surge_inrush = int(zone["capacity"] * 0.75)
            x_min, x_max, z_min, z_max = zone_agent_bounds(zone)
            for _ in range(surge_inrush):
                db.add(CrowdAgent(
                    zone_id=zone_id,
                    x=random.uniform(x_min, x_max),
                    z=random.uniform(z_min, z_max),
                    target_x=zone["x"] + random.uniform(-4, 4),
                    target_z=zone["z"] + random.uniform(-4, 4),
                    speed=random.uniform(0.4, 0.75),
                    state="surge",
                ))

            db.commit()
            self._log(db, "SURGE",
                      f"Crowd surge triggered in {zone['name']} — {redirect_count + surge_inrush} people converged",
                      "critical")
        finally:
            db.close()

    def add_people(self, zone_id: int, count: int = 10) -> None:
        db = SessionLocal()
        try:
            zone = self._zones_by_id.get(zone_id, ZONES_DATA[0])
            x_min, x_max, z_min, z_max = zone_agent_bounds(zone)
            for _ in range(count):
                db.add(CrowdAgent(
                    zone_id=zone_id,
                    x=random.uniform(x_min, x_max),
                    z=random.uniform(z_min, z_max),
                    target_x=random.uniform(x_min, x_max),
                    target_z=random.uniform(z_min, z_max),
                    speed=random.uniform(0.25, 0.55),
                    state="idle",
                ))
            db.commit()
            self._log(db, "ADD", f"Added {count} people to {zone['name']}", "info")
        finally:
            db.close()

    def remove_people(self, zone_id: int, count: int = 10) -> None:
        db = SessionLocal()
        try:
            to_delete = (
                db.query(CrowdAgent)
                .filter_by(zone_id=zone_id)
                .limit(count)
                .all()
            )
            removed = len(to_delete)
            for a in to_delete:
                db.delete(a)
            db.commit()
            zone = self._zones_by_id.get(zone_id, ZONES_DATA[0])
            self._log(db, "REMOVE", f"Removed {removed} people from {zone['name']}", "info")
        finally:
            db.close()

    def set_density(self, multiplier: float) -> None:
        db = SessionLocal()
        try:
            state = db.query(SimulationState).filter_by(id=1).first()
            state.density_multiplier = round(max(0.1, min(3.0, multiplier)), 2)
            db.commit()
        finally:
            db.close()

    def get_state(self) -> dict:
        db = SessionLocal()
        try:
            state = db.query(SimulationState).filter_by(id=1).first()
            total = db.query(CrowdAgent).count()
            return {
                "is_running":        state.is_running,
                "tick":              state.tick,
                "density_multiplier": state.density_multiplier,
                "selected_zone_id":  state.selected_zone_id,
                "total_agents":      total,
            }
        finally:
            db.close()

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _log(db: Session, event_type: str, message: str, severity: str) -> None:
        db.add(EventLog(event_type=event_type, message=message, severity=severity))
        db.commit()


# Singleton instance used by all route handlers
simulation_engine = SimulationEngine()
