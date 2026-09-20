from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import CrowdAgent
from simulation import ZONES_DATA

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _risk(density: float) -> str:
    if density < 0.50:  return "LOW"
    if density < 0.75:  return "MODERATE"
    if density < 0.90:  return "HIGH"
    return "CRITICAL"


def _color(risk: str) -> str:
    return {"LOW": "#22c55e", "MODERATE": "#f59e0b", "HIGH": "#f97316", "CRITICAL": "#ef4444"}.get(risk, "#22c55e")


@router.get("")
def get_zones(db: Session = Depends(get_db)):
    """Return all zones with live agent counts, density and risk level."""
    zones = []
    for zd in ZONES_DATA:
        count   = db.query(CrowdAgent).filter_by(zone_id=zd["id"]).count()
        density = round(count / zd["capacity"], 4)
        risk    = _risk(density)
        zones.append({
            **zd,
            "agent_count": count,
            "density":     density,
            "risk_level":  risk,
            "color":       _color(risk),
        })
    return zones
