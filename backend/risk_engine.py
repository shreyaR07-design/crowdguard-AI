"""
Risk Analysis Engine
---------------------
Calculates crowd density and risk level per zone from live DB state.
Selects the safest evacuation route based on congestion.

⚠️  PROTOTYPE – This analysis is algorithmic and is NOT suitable for
real-world emergency planning or safety decisions.
"""
from database import SessionLocal
from models import CrowdAgent, Exit
from simulation import ZONES_DATA, EXITS_DATA

DISCLAIMER = (
    "⚠️ PROTOTYPE: This is a simulated risk analysis for demonstration "
    "purposes only. Not suitable for real-world emergency planning or safety decisions."
)

_RISK_COLOURS = {
    "LOW":      "#22c55e",
    "MODERATE": "#f59e0b",
    "HIGH":     "#f97316",
    "CRITICAL": "#ef4444",
}


def classify_risk(density: float) -> str:
    if density < 0.50:
        return "LOW"
    elif density < 0.75:
        return "MODERATE"
    elif density < 0.90:
        return "HIGH"
    return "CRITICAL"


def analyze_risk() -> dict:
    db = SessionLocal()
    try:
        # ── Per-zone stats ────────────────────────────────────────────────────
        zone_rows = []
        contributing_factors: list[str] = []

        for zd in ZONES_DATA:
            count   = db.query(CrowdAgent).filter_by(zone_id=zd["id"]).count()
            density = count / zd["capacity"]
            risk    = classify_risk(density)

            zone_rows.append({
                **zd,
                "agent_count": count,
                "density":     round(density, 4),
                "risk_level":  risk,
                "color":       _RISK_COLOURS[risk],
            })

            if density >= 0.50:
                contributing_factors.append(
                    f"{zd['name']} at {round(density * 100)}% capacity "
                    f"({count}/{zd['capacity']} people) — {risk}"
                )

        # ── Overall risk ──────────────────────────────────────────────────────
        total_agents = sum(z["agent_count"] for z in zone_rows)
        total_cap    = sum(z["capacity"]    for z in zone_rows)
        overall_density = total_agents / total_cap if total_cap else 0
        max_density     = max((z["density"] for z in zone_rows), default=0)

        # Weighted score: 60% mean density + 40% max zone density
        risk_score  = round((0.6 * overall_density + 0.4 * max_density) * 100, 1)
        overall_risk = classify_risk(max_density)

        if not contributing_factors:
            contributing_factors = ["All zones within safe capacity limits"]

        # Add special alerts for critical zones
        critical_zones = [z for z in zone_rows if z["risk_level"] == "CRITICAL"]
        if critical_zones:
            contributing_factors.insert(
                0,
                f"CRITICAL: {len(critical_zones)} zone(s) over 90% capacity — "
                "immediate action recommended"
            )

        # ── Evacuation route ──────────────────────────────────────────────────
        zone_density_map = {z["id"]: z["density"] for z in zone_rows}
        zone_name_map    = {z["id"]: z["name"]   for z in zone_rows}

        exits = db.query(Exit).all()
        if not exits:
            exits_data = EXITS_DATA
        else:
            exits_data = [
                {"id": e.id, "name": e.name, "zone_id": e.zone_id,
                 "x": e.x, "z": e.z, "capacity": e.capacity, "direction": e.direction}
                for e in exits
            ]

        # Score exits: lower congestion in associated zone = better
        best_exit = min(
            exits_data,
            key=lambda e: zone_density_map.get(e["zone_id"], 0),
        )

        zone_of_exit = next(
            (z for z in ZONES_DATA if z["id"] == best_exit["zone_id"]),
            ZONES_DATA[0],
        )
        exit_density     = zone_density_map.get(best_exit["zone_id"], 0)
        congestion_level = classify_risk(exit_density)

        # Route waypoints: campus centre → zone → exit
        waypoints = [
            [0.0,                    0.0, 0.0],
            [zone_of_exit["x"],      0.0, zone_of_exit["z"]],
            [best_exit["x"],         0.0, best_exit["z"]],
        ]

        est_time = round(total_agents / max(best_exit["capacity"], 1) * 0.5, 1)

        zone_label = zone_name_map.get(best_exit["zone_id"], "Unknown")
        description = (
            f"Recommended: Evacuate via {best_exit['name']} through {zone_label} corridor. "
            f"Current congestion: {congestion_level}. "
            f"Exit capacity: {best_exit['capacity']} people/min. "
            f"Estimated evacuation time: {est_time} min."
        )

        evacuation_route = {
            "route_id":               f"RT-{best_exit['id']:03d}",
            "exit_name":              best_exit["name"],
            "description":            description,
            "waypoints":              waypoints,
            "estimated_time_minutes": est_time,
            "congestion_level":       congestion_level,
        }

        return {
            "is_simulated":        True,
            "disclaimer":          DISCLAIMER,
            "overall_risk":        overall_risk,
            "risk_score":          risk_score,
            "zones":               zone_rows,
            "contributing_factors": contributing_factors,
            "evacuation_route":    evacuation_route,
        }
    finally:
        db.close()
