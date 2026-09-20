from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from models import EventLog

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
def get_events(db: Session = Depends(get_db)):
    """Return the 50 most recent events, newest first."""
    events = (
        db.query(EventLog)
        .order_by(EventLog.id.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id":         e.id,
            "timestamp":  e.timestamp.isoformat() if e.timestamp else None,
            "event_type": e.event_type,
            "message":    e.message,
            "severity":   e.severity,
        }
        for e in events
    ]


@router.post("")
def log_event(body: dict = Body(...), db: Session = Depends(get_db)):
    """Allow the frontend to log custom events."""
    event = EventLog(
        event_type=body.get("event_type", "INFO"),
        message=body.get("message", ""),
        severity=body.get("severity", "info"),
    )
    db.add(event)
    db.commit()
    return {"status": "logged", "id": event.id}
