from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ZoneOut(BaseModel):
    id: int
    name: str
    capacity: int
    x: float
    z: float
    width: float
    depth: float
    color: str
    agent_count: int
    density: float
    risk_level: str

    class Config:
        from_attributes = True


class AgentOut(BaseModel):
    id: int
    zone_id: int
    x: float
    z: float
    state: str


class SimStateOut(BaseModel):
    is_running: bool
    tick: int
    density_multiplier: float
    selected_zone_id: Optional[int]
    total_agents: int


class EvacuationRoute(BaseModel):
    route_id: str
    exit_name: str
    description: str
    waypoints: List[List[float]]          # [[x,y,z], ...]
    estimated_time_minutes: float
    congestion_level: str


class RiskAnalysisOut(BaseModel):
    is_simulated: bool
    disclaimer: str
    overall_risk: str
    risk_score: float
    zones: List[ZoneOut]
    contributing_factors: List[str]
    evacuation_route: EvacuationRoute


class EventOut(BaseModel):
    id: int
    timestamp: Optional[str]
    event_type: str
    message: str
    severity: str
