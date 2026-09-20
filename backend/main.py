import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from simulation import simulation_engine
from routes import zones, crowd, simulation_routes, events, analysis


# ── Create all tables and seed initial data ────────────────────────────────────

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: initialise DB and launch the background tick loop.
    Shutdown: cancel the tick task gracefully.
    """
    simulation_engine.initialize_db()

    # Tick loop always runs; it checks is_running internally
    tick_task = asyncio.create_task(simulation_engine._run_loop())

    yield  # ← app is running

    tick_task.cancel()
    try:
        await tick_task
    except asyncio.CancelledError:
        pass


import os
from fastapi.staticfiles import StaticFiles

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CrowdGuard AI API",
    description="Backend for the CrowdGuard AI 3D Crowd Safety System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(zones.router)
app.include_router(crowd.router)
app.include_router(simulation_routes.router)
app.include_router(events.router)
app.include_router(analysis.router)


@app.get("/api/info")
def root_info():
    return {
        "name":    "CrowdGuard AI",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


# ── Mount Frontend Static Web App ──────────────────────────────────────────────

FRONTEND_DIST_CANDIDATES = [
    os.environ.get("FRONTEND_DIST"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "dist")),
]

frontend_dist = next((p for p in FRONTEND_DIST_CANDIDATES if p and os.path.exists(p)), None)

if frontend_dist:
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    def fallback_root():
        return {
            "name":    "CrowdGuard AI",
            "version": "1.0.0",
            "status":  "running",
            "docs":    "/docs",
            "notice":  "Frontend build directory not found. Please build frontend/dist.",
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)
