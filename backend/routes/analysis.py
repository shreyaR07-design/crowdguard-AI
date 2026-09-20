from fastapi import APIRouter
from risk_engine import analyze_risk

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/risk")
def get_risk_analysis():
    """
    Returns full risk analysis from the simulation engine.
    ⚠️  Prototype only — not for real-world use.
    """
    return analyze_risk()
