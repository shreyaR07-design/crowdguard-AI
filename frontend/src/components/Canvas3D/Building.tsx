import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface BuildingProps {
  id:         number;
  position:   [number, number, number];
  size:       [number, number, number];
  name:       string;
  color:      string;
  density:    number;
  agentCount: number;
  capacity:   number;
  riskLevel:  string;
  isSelected: boolean;
  onClick:    () => void;
}

const EMISSIVE_MAP: Record<string, number> = {
  LOW:      0.04,
  MODERATE: 0.14,
  HIGH:     0.28,
  CRITICAL: 0.50,
};

export function Building({
  id,
  position,
  size,
  name,
  color,
  density,
  agentCount,
  capacity,
  riskLevel,
  isSelected,
  onClick,
}: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = size;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (riskLevel === 'CRITICAL') {
        mat.emissiveIntensity = 0.35 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
      } else if (riskLevel === 'HIGH') {
        mat.emissiveIntensity = 0.20 + Math.sin(clock.getElapsedTime() * 2) * 0.08;
      } else if (isSelected) {
        mat.emissiveIntensity = 0.25 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
      } else {
        mat.emissiveIntensity = EMISSIVE_MAP[riskLevel] ?? 0.04;
      }
    }

    if (ringRef.current && isSelected) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.08;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  const pct = Math.round(density * 100);
  const labelColor =
    riskLevel === 'CRITICAL' ? '#f87171' :
    riskLevel === 'HIGH'     ? '#fb923c' :
    riskLevel === 'MODERATE' ? '#fbbf24' : '#4ade80';

  // Window rows — clamp to 3 columns
  const winCols = Math.min(3, Math.floor(w / 6));
  const winRows = Math.min(2, Math.floor(h / 3));

  return (
    <group
      position={[position[0], h / 2, position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Ground selection ring */}
      {isSelected && (
        <mesh
          ref={ringRef}
          position={[0, -h / 2 + 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[Math.max(w, d) * 0.7, Math.max(w, d) * 0.76, 32]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Main body — semi-transparent so agents inside are visible */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={hovered ? '#818cf8' : color}
          emissive={color}
          emissiveIntensity={EMISSIVE_MAP[riskLevel] ?? 0.04}
          roughness={0.35}
          metalness={0.25}
          transparent
          opacity={hovered ? 0.88 : 0.72}
        />
      </mesh>

      {/* Roof trim */}
      <mesh position={[0, h / 2 + 0.2, 0]}>
        <boxGeometry args={[w + 0.8, 0.4, d + 0.8]} />
        <meshStandardMaterial color={isSelected ? '#312e81' : '#0f172a'} roughness={1} />
      </mesh>

      {/* Windows */}
      {Array.from({ length: winRows }, (_, row) =>
        Array.from({ length: winCols }, (_, col) => {
          const wx = (col - (winCols - 1) / 2) * (w / (winCols + 0.5));
          const wy = (row - (winRows - 1) / 2) * (h / (winRows + 1));
          return (
            <mesh key={`${row}-${col}`} position={[wx, wy, d / 2 + 0.06]}>
              <planeGeometry args={[2.2, 1.6]} />
              <meshStandardMaterial
                color="#93c5fd"
                emissive="#3b82f6"
                emissiveIntensity={0.6}
                transparent opacity={0.85}
              />
            </mesh>
          );
        })
      )}

      {/* Selected Sector Flag */}
      {isSelected && (
        <Text
          position={[0, h / 2 + 7.2, 0]}
          fontSize={1.4}
          color="#a5b4fc"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.15}
          outlineColor="#1e1b4b"
          renderOrder={15}
        >
          TARGET SECTOR
        </Text>
      )}

      {/* Building name */}
      <Text
        position={[0, h / 2 + 2.2, 0]}
        fontSize={2.8}
        color={isSelected ? '#c7d2fe' : 'white'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.25}
        outlineColor="#000000"
        renderOrder={10}
      >
        {name}
      </Text>

      {/* Live density label */}
      <Text
        position={[0, h / 2 + 5.2, 0]}
        fontSize={1.8}
        color={labelColor}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.2}
        outlineColor="#000000"
        renderOrder={10}
      >
        {`${agentCount}/${capacity} · ${pct}% · ${riskLevel}`}
      </Text>
    </group>
  );
}
