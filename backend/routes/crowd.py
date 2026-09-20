from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import CrowdAgent

router = APIRouter(prefix="/api/crowd", tags=["crowd"])


@router.get("")
def get_crowd(db: Session = Depends(get_db)):
    """Return positions of all agents for 3-D rendering."""
    agents = db.query(CrowdAgent).all()
    return [
        {
            "id":      a.id,
            "zone_id": a.zone_id,
            "x":       round(a.x, 3),
            "z":       round(a.z, 3),
            "state":   a.state,
        }
        for a in agents
    ]
