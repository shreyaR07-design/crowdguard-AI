import * as THREE from 'three';
import type { Zone } from '../../types';

interface Props {
  zone: Zone;
}

const RISK_COLOR: Record<string, string> = {
  LOW:      '#22c55e',
  MODERATE: '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_OPACITY: Record<string, number> = {
  LOW:      0.06,
  MODERATE: 0.16,
  HIGH:     0.28,
  CRITICAL: 0.44,
};

export function RiskHeatmap({ zone }: Props) {
  const hex   = RISK_COLOR[zone.risk_level]   ?? '#22c55e';
  const alpha = RISK_OPACITY[zone.risk_level] ?? 0.06;
  const color = new THREE.Color(hex);

  return (
    <mesh
      position={[zone.x, 0.04, zone.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {/* 120% of building footprint so it bleeds slightly outside */}
      <planeGeometry args={[zone.width * 1.2, zone.depth * 1.2]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={alpha}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
