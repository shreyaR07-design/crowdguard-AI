https://crowdguard-ai-cyff.onrender.com/


# CrowdGuard AI — Intelligent 3D Emergency Crowd Safety System

CrowdGuard AI is a dynamic, full-stack 3D emergency crowd safety web application designed for campus venues, stadiums, and high-density environments. It combines a real-time 3D Three.js digital twin of a college campus with a Python FastAPI backend and an algorithmic AI risk analysis engine.

---

## Key Features

1. **Dynamic 3D Campus Environment (Three.js / React Three Fiber)**
   - 5 distinct campus buildings: *Auditorium*, *Library*, *Main Hall*, *Cafeteria*, *Gymnasium*.
   - Four directional emergency exits: *North Gate*, *South Gate*, *East Emergency Exit*, *West Fire Exit*.
   - Free camera orbit controls: rotate, pan, and zoom anywhere on the campus.
   - Real-time animated crowd particles with zone-based bobs and motion.
   - Dynamic 3D risk heatmaps beneath each zone that transition in opacity and hue (Green → Amber → Orange → Red) as crowd density builds.
   - Animated dynamic evacuation route with traveling light beacons guiding towards the optimal safe exit.

2. **Full-Featured Interactive Simulation Controls**
   - **Start / Pause Simulation**: Toggles agent movement and backend simulation ticks.
   - **Reset Simulation**: Restores baseline agent counts and resets positions.
   - **Simulate Crowd Surge**: Causes a mass convergence event into the selected zone, triggering critical alerts and emergency rerouting.
   - **Add / Remove People**: Incrementally injects or evacuates individuals from specific sectors.
   - **Crowd Velocity Slider**: Real-time crowd speed multiplier (0.2x – 3.0x).
   - **Target Zone Selector**: Focus commands on any specific campus sector.
   - **Instant Synchronisation**: Every user action triggers an immediate round-trip state sync with the 3D viewport and dashboard cards.

3. **Algorithmic AI Risk Engine**
   - Live density percentage calculation (`current_occupancy / rated_capacity`).
   - Four-tier hazard classification: `LOW` (<50%), `MODERATE` (50–75%), `HIGH` (75–90%), `CRITICAL` (≥90%).
   - Weighted risk index factoring in global campus occupancy and peak localized hotspots.
   - Automated identification of key contributing congestion factors.
   - *Prototype Disclosure*: Clearly labeled simulated analytical engine intended for decision support and demonstration.

4. **Dynamic Evacuation Routing System**
   - Live monitoring of all exit corridors and adjacent sector congestions.
   - Dynamic selection of the least-congested evacuation corridor.
   - Waypoint interpolation from campus core to perimeter safe zones.
   - Computed clearance time estimates based on real agent volume and exit throughput capacity.

5. **Persistent SQLite Database & REST APIs**
   - **`/api/zones`** — Live occupancy, capacities, density percentages, and risk classifications.
   - **`/api/crowd`** — Real-time coordinates and states (`idle`, `moving`, `surge`) of all agents.
   - **`/api/simulation/state`** — Engine status, tick counter, and velocity multiplier.
   - **`/api/simulation/{start|stop|reset|surge|add-people|remove-people|density}`** — Simulation commands.
   - **`/api/analysis/risk`** — Full risk index, contributing factors, and dynamic evacuation route.
   - **`/api/events`** — Historical audit trail and incident log.

---

## Project Structure

```
crowdguard-ai/
├── backend/
│   ├── database.py              # SQLite connection with WAL mode
│   ├── models.py                # SQLAlchemy ORM models (Zone, Exit, Agent, SimState, Event)
│   ├── schemas.py               # Pydantic data contracts
│   ├── simulation.py            # Simulation engine & agent movement tick loop
│   ├── risk_engine.py           # Risk calculation & dynamic evacuation pathing
│   ├── main.py                  # FastAPI application entry point with CORS
│   ├── requirements.txt         # Backend Python dependencies
│   └── routes/
│       ├── zones.py             # Zone status endpoints
│       ├── crowd.py             # Agent position streaming
│       ├── simulation_routes.py # Mutation & control endpoints
│       ├── events.py            # Event logging endpoints
│       └── analysis.py          # Risk evaluation endpoint
│
└── frontend/
    ├── package.json             # Vite + React 18 + Three.js dependencies
    ├── vite.config.ts           # Vite bundler configuration
    ├── tailwind.config.js       # Tailwind CSS theme extensions
    └── src/
        ├── App.tsx              # Application layout & status bar
        ├── api/client.ts        # Axios API client
        ├── store/simulationStore.ts # Zustand global reactive state
        ├── hooks/useSimulation.ts   # Adaptive polling hook (500ms live / 1500ms paused)
        └── components/
            ├── Canvas3D/        # Three.js / React Three Fiber views
            │   ├── CampusScene.tsx  # Main 3D viewport, lighting, and camera
            │   ├── Building.tsx     # 3D building models with density monitors
            │   ├── CrowdAgents.tsx  # Instanced crowd particle rendering
            │   ├── RiskHeatmap.tsx  # Ground risk gradient projection
            │   └── EvacRoute.tsx    # Animated 3D evacuation route & beacons
            ├── Dashboard/       # Telemetry panels
            │   ├── AlertPanel.tsx   # Urgent emergency alert banner
            │   ├── StatsCards.tsx   # Real-time metrics & occupancy bars
            │   ├── RiskPanel.tsx    # AI risk breakdown & route explanation
            │   └── EventLog.tsx     # Incident audit log
            └── Controls/
                └── SimControls.tsx  # Simulation control console
```

---

## Quick Start Guide

### 1. Backend Setup

Open a terminal in `crowdguard-ai/backend`:

```powershell
# Activate the Python virtual environment
.\venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be live at `http://localhost:8000` (interactive OpenAPI documentation available at `http://localhost:8000/docs`).

### 2. Unified Full-Stack Run (Single Service)

Build the frontend once and let FastAPI serve both the 3D web application and all APIs:

```powershell
# In frontend/:
npm run build

# In backend/:
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Open `http://127.0.0.1:8000` in your browser!

### 3. Frontend Dev Server (Optional Hot-Reload Mode)

Open a terminal in `crowdguard-ai/frontend`:

```powershell
npm install
npm run dev
```

Visit `http://localhost:5173` in any modern web browser.

---

## 🚀 Render Single-Service Deployment Guide

CrowdGuard AI is fully configured for single-service deployment on [Render](https://render.com).

### Option A: Render Blueprint (Recommended — 1-Click)

1. Push this repository to GitHub or GitLab.
2. In your Render Dashboard, click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically detect [`render.yaml`](file:///C:/Users/Shrey/.gemini/antigravity/scratch/crowdguard-ai/render.yaml).
4. Click **Apply**. Render will automatically execute `build.sh` (installing Python + Node dependencies and building the React bundle) and start the service with `start.sh` on `$PORT`.

### Option B: Manual Web Service on Render

If creating a standard Web Service manually:
- **Environment**: `Python`
- **Build Command**: `./build.sh` (or `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build && cd ..`)
- **Start Command**: `./start.sh` (or `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`)
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.11.9`
  - `NODE_VERSION`: `20.18.0`

### Option C: Docker Container on Render

Render also supports native Docker deployment with zero configuration:
- Select **New +** → **Web Service** → **Docker**.
- Render will detect the included multi-stage [`Dockerfile`](file:///C:/Users/Shrey/.gemini/antigravity/scratch/crowdguard-ai/Dockerfile), compile the React Three.js assets in Node 20, package the FastAPI server into Python 3.11, and start the unified server on port `$PORT`.

