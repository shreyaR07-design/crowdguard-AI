import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Agent } from '../../types';

interface Props {
  agents: Agent[];
}

// Zone colour palette — one distinct colour per zone
const ZONE_COLORS: Record<number, THREE.Color> = {
  1: new THREE.Color('#a78bfa'), // Auditorium  — violet
  2: new THREE.Color('#38bdf8'), // Library     — sky blue
  3: new THREE.Color('#fbbf24'), // Main Hall   — amber
  4: new THREE.Color('#34d399'), // Cafeteria   — emerald
  5: new THREE.Color('#f87171'), // Gymnasium   — rose
};

const SURGE_COLOR   = new THREE.Color('#ff1a00');
const DEFAULT_COLOR = new THREE.Color('#60a5fa');
const MAX_INSTANCES = 1200; // upper limit for instanced mesh

const _dummy  = new THREE.Object3D();
const _colour = new THREE.Color();

export function CrowdAgents({ agents }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Sync positions + colours whenever agent data changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const count = agents.length;

    for (let i = 0; i < count; i++) {
      const a = agents[i];
      _dummy.position.set(a.x, 0.5, a.z);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      _colour.copy(a.state === 'surge' ? SURGE_COLOR : (ZONE_COLORS[a.zone_id] ?? DEFAULT_COLOR));
      mesh.setColorAt(i, _colour);
    }

    // Hide unused instances
    _dummy.scale.setScalar(0);
    _dummy.updateMatrix();
    for (let i = count; i < mesh.count; i++) {
      mesh.setMatrixAt(i, _dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = count; // tell three.js how many to draw
  }, [agents]);

  // Subtle vertical bob animation each frame (cosmetic only)
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || agents.length === 0) return;

    const t = clock.getElapsedTime();
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      _dummy.position.set(a.x, 0.5 + Math.sin(t * 2.5 + i * 0.37) * 0.12, a.z);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_INSTANCES]}
      castShadow
      frustumCulled={false}
    >
      <sphereGeometry args={[0.38, 7, 7]} />
      <meshStandardMaterial vertexColors roughness={0.75} metalness={0.1} />
    </instancedMesh>
  );
}
