"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function DataField() {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.09, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8F0000",
        transparent: true,
        opacity: 0.5
      }),
    []
  );

  const points = useMemo(
    () =>
      Array.from({ length: 64 }, (_, index) => {
        const angle = index * 2.399963229728653;
        const radius = 2.2 + ((index * 37) % 10) * 0.12;
        return {
          x: Math.cos(angle) * radius,
          y: (((index * 53) % 100) / 100 - 0.5) * 5.6,
          z: Math.sin(angle) * radius - 1.8,
          scale: 0.5 + ((index * 29) % 100) / 150
        };
      }),
    []
  );

  useFrame(({ pointer, clock }) => {
    if (!group.current) return;
    group.current.rotation.y +=
      (pointer.x * 0.18 - group.current.rotation.y) * 0.018;
    group.current.rotation.x +=
      (-pointer.y * 0.12 - group.current.rotation.x) * 0.018;
    group.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.08;
  });

  return (
    <group ref={group}>
      {points.map((point, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={material}
          position={[point.x, point.y, point.z]}
          scale={point.scale}
        />
      ))}

      <Float speed={1.1} rotationIntensity={0.24} floatIntensity={0.3}>
        <mesh position={[0, 0, -1.1]}>
          <icosahedronGeometry args={[1.45, 2]} />
          <meshBasicMaterial
            color="#8F0000"
            wireframe
            transparent
            opacity={0.12}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function AuthScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        camera={{ position: [0, 0, 6.3], fov: 45 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={["#000000", 4.5, 10]} />
        <DataField />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(143,0,0,.13),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
    </div>
  );
}
