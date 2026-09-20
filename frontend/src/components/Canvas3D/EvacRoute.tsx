import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { EvacRoute as EvacRouteType } from '../../types';

interface Props {
  route: EvacRouteType;
}

export function EvacRoute({ route }: Props) {
  const beacon1Ref = useRef<THREE.Mesh>(null);
  const beacon2Ref = useRef<THREE.Mesh>(null);
  const beacon3Ref = useRef<THREE.Mesh>(null);

  // Build Three.js points from waypoints; memoised on route change
  const { points, curve } = useMemo(() => {
    const pts = route.waypoints.map(([x, _y, z]) => new THREE.Vector3(x, 0.5, z));
    if (pts.length < 2) return { points: pts, curve: null };
    const crv = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    return { points: pts, curve: crv };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.waypoints.map(w => w.join(',')).join('|')]);

  // Animate 3 beacons travelling along the route at staggered offsets
  useFrame(({ clock }) => {
    if (!curve) return;
    const t = clock.getElapsedTime();
    const refs = [beacon1Ref, beacon2Ref, beacon3Ref];
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const progress = ((t * 0.12 + i / 3) % 1);
      const pos = curve.getPoint(progress);
      ref.current.position.set(pos.x, 1.2, pos.z);
    });
  });

  if (points.length < 2) return null;

  const exitPt = points[points.length - 1];

  return (
    <group>
      {/* Main route line */}
      <Line
        points={points}
        color="#00ff88"
        lineWidth={4}
        dashed
        dashSize={2.5}
        gapSize={1.2}
      />

      {/* Travelling beacons */}
      {[beacon1Ref, beacon2Ref, beacon3Ref].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={2.0}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* Pulsing exit beacon */}
      <mesh position={[exitPt.x, 2.5, exitPt.z]}>
        <sphereGeometry args={[2.2, 10, 10]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Exit glow on ground */}
      <mesh position={[exitPt.x, 0.06, exitPt.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
