from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)   # 3D world position
    z = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    depth = Column(Float, nullable=False)
    color = Column(String, default="#6366f1")


class Exit(Base):
    __tablename__ = "exits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    zone_id = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    z = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)   # people per minute
    direction = Column(String, nullable=False)   # north/south/east/west


class CrowdAgent(Base):
    __tablename__ = "crowd_agents"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, nullable=False, index=True)
    x = Column(Float, nullable=False)
    z = Column(Float, nullable=False)
    target_x = Column(Float, nullable=False)
    target_z = Column(Float, nullable=False)
    speed = Column(Float, default=0.3)
    state = Column(String, default="idle")   # idle | moving | surge


class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, default=1)
    is_running = Column(Boolean, default=False)
    tick = Column(Integer, default=0)
    density_multiplier = Column(Float, default=1.0)
    selected_zone_id = Column(Integer, nullable=True)


class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    event_type = Column(String, nullable=False)   # START|STOP|SURGE|ADD|REMOVE|RESET|ALERT
    message = Column(Text, nullable=False)
    severity = Column(String, default="info")     # info | warning | critical
