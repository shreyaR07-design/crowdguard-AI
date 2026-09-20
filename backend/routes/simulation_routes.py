from fastapi import APIRouter, Body
from simulation import simulation_engine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/state")
def get_state():
    """Return current simulation state including total agent count."""
    return simulation_engine.get_state()


@router.post("/start")
def start_sim():
    simulation_engine.set_running(True)
    return {"status": "started"}


@router.post("/stop")
def stop_sim():
    simulation_engine.set_running(False)
    return {"status": "stopped"}


@router.post("/reset")
def reset_sim():
    simulation_engine.reset()
    return {"status": "reset"}


@router.post("/surge")
def trigger_surge(body: dict = Body(...)):
    zone_id = int(body.get("zone_id", 1))
    simulation_engine.trigger_surge(zone_id)
    return {"status": "surge_triggered", "zone_id": zone_id}


@router.post("/add-people")
def add_people(body: dict = Body(...)):
    zone_id = int(body.get("zone_id", 1))
    count   = int(body.get("count", 10))
    simulation_engine.add_people(zone_id, count)
    return {"status": "added", "zone_id": zone_id, "count": count}


@router.post("/remove-people")
def remove_people(body: dict = Body(...)):
    zone_id = int(body.get("zone_id", 1))
    count   = int(body.get("count", 10))
    simulation_engine.remove_people(zone_id, count)
    return {"status": "removed", "zone_id": zone_id, "count": count}


@router.post("/density")
def set_density(body: dict = Body(...)):
    multiplier = float(body.get("multiplier", 1.0))
    simulation_engine.set_density(multiplier)
    return {"status": "updated", "multiplier": multiplier}
