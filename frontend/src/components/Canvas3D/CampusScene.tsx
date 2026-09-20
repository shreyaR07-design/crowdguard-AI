import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Environment } from '@react-three/drei';
import { useSimStore } from '../../store/simulationStore';
import { Building } from './Building';
import { CrowdAgents } from './CrowdAgents';
import { RiskHeatmap } from './RiskHeatmap';
import { EvacRoute } from './EvacRoute';

// Campus layout — must match backend ZONES_DATA positions exactly
export const CAMPUS_CONFIG = [
  { id: 1, name: 'Auditorium', position: [0,   0,   0  ] as [number,number,number], size: [24, 8,  18] as [number,number,number], color: '#6366f1' },
  { id: 2, name: 'Library',    position: [-35, 0,   0  ] as [number,number,number], size: [16, 5,  14] as [number,number,number], color: '#0ea5e9' },
  { id: 3, name: 'Main Hall',  position: [35,  0,   0  ] as [number,number,number], size: [18, 6,  16] as [number,number,number], color: '#f59e0b' },
  { id: 4, name: 'Cafeteria',  position: [0,   0, -32  ] as [number,number,number], size: [20, 4,  14] as [number,number,number], color: '#10b981' },
  { id: 5, name: 'Gymnasium',  position: [0,   0,  32  ] as [number,number,number], size: [22, 7,  16] as [number,number,number], color: '#ef4444' },
] as const;

const EXIT_MARKERS = [
  { x:  0,   z: -56, label: 'North Gate' },
  { x:  0,   z:  56, label: 'South Gate' },
  { x:  58,  z:   0, label: 'East Exit'  },
  { x: -58,  z:   0, label: 'West Exit'  },
];

function Paths() {
  return (
    <>
      {/* Horizontal corridor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[130, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* Vertical corridor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[6, 100]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
    </>
  );
}

function ExitMarker({ x, z, label }: { x: number; z: number; label: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* Exit gate post */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[5, 6, 1]} />
        <meshStandardMaterial color="#166534" emissive="#16a34a" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* Glow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.15} emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  const { zones, agents, risk, selectedZoneId, setSelectedZoneId } = useSimStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[60, 100, 60]} intensity={1.0} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 25, 0]} intensity={0.6} color="#818cf8" distance={80} />
      <pointLight position={[-35, 15, 0]} intensity={0.3} color="#38bdf8" distance={50} />
      <pointLight position={[35, 15, 0]}  intensity={0.3} color="#fbbf24" distance={50} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#0d1117" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[240, 240]}
        cellSize={5}
        cellThickness={0.4}
        cellColor="#1e3a5f"
        sectionSize={20}
        sectionThickness={0.8}
        sectionColor="#1e40af"
        fadeDistance={140}
        infiniteGrid={false}
      />

      <Paths />

      {/* Campus perimeter fence */}
      {[
        { pos: [0, 1.5, -70] as [number,number,number], rot: [0,0,0] as [number,number,number], w: 160, h: 3 },
        { pos: [0, 1.5,  70] as [number,number,number], rot: [0,0,0] as [number,number,number], w: 160, h: 3 },
        { pos: [-80, 1.5, 0] as [number,number,number], rot: [0, Math.PI/2,0] as [number,number,number], w: 160, h: 3 },
        { pos: [ 80, 1.5, 0] as [number,number,number], rot: [0, Math.PI/2,0] as [number,number,number], w: 160, h: 3 },
      ].map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot}>
          <boxGeometry args={[f.w, f.h, 0.4]} />
          <meshStandardMaterial color="#1e3a5f" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Buildings */}
      {CAMPUS_CONFIG.map(b => {
        const zone = zones.find(z => z.id === b.id);
        return (
          <Building
            key={b.id}
            id={b.id}
            position={b.position}
            size={b.size}
            name={b.name}
            color={b.color}
            density={zone?.density ?? 0}
            agentCount={zone?.agent_count ?? 0}
            capacity={zone?.capacity ?? 0}
            riskLevel={zone?.risk_level ?? 'LOW'}
            isSelected={selectedZoneId === b.id}
            onClick={() => setSelectedZoneId(b.id)}
          />
        );
      })}

      {/* Exit markers */}
      {EXIT_MARKERS.map((e, i) => (
        <ExitMarker key={i} x={e.x} z={e.z} label={e.label} />
      ))}

      {/* Risk heatmap overlays */}
      {zones.map(zone => (
        <RiskHeatmap key={zone.id} zone={zone} />
      ))}

      {/* Crowd agents */}
      <CrowdAgents agents={agents} />

      {/* Evacuation route */}
      {risk?.evacuation_route && <EvacRoute route={risk.evacuation_route} />}

      <Stars radius={120} depth={60} count={600} factor={3} saturation={0} fade speed={0.5} />
    </>
  );
}

export function CampusScene() {
  const controlsRef = useRef<any>(null);
  const { selectedZoneId, risk } = useSimStore();

  const setView = (camPos: [number, number, number], target: [number, number, number]) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...camPos);
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  };

  const focusTargetZone = () => {
    const b = CAMPUS_CONFIG.find(c => c.id === selectedZoneId) || CAMPUS_CONFIG[0];
    setView([b.position[0] + 25, 30, b.position[2] + 35], [b.position[0], 4, b.position[2]]);
  };

  const focusEvacRoute = () => {
    if (risk?.evacuation_route?.waypoints) {
      const pts = risk.evacuation_route.waypoints;
      const exitPt = pts[pts.length - 1];
      setView([exitPt[0] * 0.7 + 20, 45, exitPt[2] * 0.7 + 35], [exitPt[0], 0, exitPt[2]]);
    } else {
      setView([0, 50, 70], [0, 0, 50]);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating HUD Viewport Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-gray-900/85 backdrop-blur-md border border-gray-700/60 p-1 rounded-lg text-[11px] shadow-lg">
          <button
            onClick={() => setView([55, 85, 105], [0, 0, 0])}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-300 font-medium transition-colors"
          >
            🔭 Perspective
          </button>
          <button
            onClick={() => setView([0, 150, 0.1], [0, 0, 0])}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-300 font-medium transition-colors"
          >
            🗺 Satellite
          </button>
          <button
            onClick={focusTargetZone}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-300 font-medium transition-colors"
          >
            🎯 Focus Sector
          </button>
          <button
            onClick={focusEvacRoute}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-emerald-600 hover:text-white text-gray-300 font-medium transition-colors"
          >
            🧭 Focus Route
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-gray-800/80 px-2.5 py-1 rounded text-[10px] text-gray-400">
          <span>💡 Click any building to target | Left-drag orbit | Right-drag pan | Scroll zoom</span>
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [55, 85, 105], fov: 42, near: 0.5, far: 1200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#060a14' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          minDistance={20}
          maxDistance={240}
          maxPolarAngle={Math.PI / 2 - 0.04}
          enablePan
          panSpeed={0.7}
          rotateSpeed={0.6}
          zoomSpeed={0.9}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
