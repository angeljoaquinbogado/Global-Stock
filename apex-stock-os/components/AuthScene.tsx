"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type CrateProps = {
  position: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
  tone?: "dark" | "red";
};

function Crate({ position, scale, speed, phase, tone = "dark" }: CrateProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.rotation.x = Math.sin(t * 0.7) * 0.18;
    ref.current.rotation.y = t * 0.26;
    ref.current.position.y = position[1] + Math.sin(t) * 0.16;
  });

  return (
    <mesh ref={ref} position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial
        color={tone === "red" ? "#650000" : "#111216"}
        roughness={0.28}
        metalness={0.72}
        clearcoat={0.7}
        clearcoatRoughness={0.2}
      />
      <Edges
        threshold={18}
        color={tone === "red" ? "#e00000" : "#5b5e66"}
        opacity={tone === "red" ? 0.8 : 0.36}
        transparent
      />
    </mesh>
  );
}

function OrbitalNode({
  radius,
  y,
  speed,
  phase,
  size
}: {
  radius: number;
  y: number;
  speed: number;
  phase: number;
  size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.position.set(
      Math.cos(t) * radius,
      y + Math.sin(t * 1.6) * 0.25,
      Math.sin(t) * radius - 1.4
    );
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial
        color="#9b0000"
        emissive="#8F0000"
        emissiveIntensity={1.4}
        roughness={0.2}
        metalness={0.75}
      />
    </mesh>
  );
}

function StockCore() {
  const core = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = t * 0.14;
      core.current.rotation.x = Math.sin(t * 0.28) * 0.09;
    }
    if (ring.current) {
      ring.current.rotation.z = -t * 0.22;
      ring.current.rotation.x = Math.PI / 2.65 + Math.sin(t * 0.2) * 0.08;
    }
  });

  return (
    <group position={[3.3, 0.25, -1.8]}>
      <group ref={core}>
        <mesh castShadow>
          <boxGeometry args={[1.75, 1.75, 1.75]} />
          <meshPhysicalMaterial
            color="#141519"
            roughness={0.16}
            metalness={0.92}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
          <Edges color="#8F0000" opacity={0.88} transparent />
        </mesh>

        <mesh scale={1.09}>
          <boxGeometry args={[1.75, 1.75, 1.75]} />
          <meshBasicMaterial
            color="#8F0000"
            wireframe
            transparent
            opacity={0.16}
          />
        </mesh>
      </group>

      <mesh ref={ring}>
        <torusGeometry args={[1.72, 0.018, 16, 160]} />
        <meshStandardMaterial
          color="#d10b0b"
          emissive="#8F0000"
          emissiveIntensity={2.3}
        />
      </mesh>

      {[0, 1, 2, 3, 4, 5].map((index) => (
        <OrbitalNode
          key={index}
          radius={2.25 + (index % 2) * 0.28}
          y={(index - 2.5) * 0.26}
          speed={0.15 + index * 0.018}
          phase={(Math.PI * 2 * index) / 6}
          size={0.055 + (index % 2) * 0.02}
        />
      ))}
    </group>
  );
}

function ConveyorField() {
  const belt = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!belt.current) return;
    belt.current.position.z = ((clock.elapsedTime * 0.22) % 1.6) - 0.8;
  });

  return (
    <group position={[0, -2.45, -2.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial color="#070709" roughness={0.72} metalness={0.25} />
      </mesh>

      <gridHelper
        args={[14, 28, "#270000", "#121214"]}
        position={[0, 0.01, 0]}
      />

      <group ref={belt}>
        {Array.from({ length: 9 }, (_, index) => (
          <mesh
            key={index}
            position={[-5.6 + index * 1.4, 0.03, index % 2 === 0 ? 0.8 : -0.8]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.7, 0.035]} />
            <meshBasicMaterial color="#8F0000" transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WarehouseWorld() {
  const rig = useRef<THREE.Group>(null);

  const crates = useMemo(
    () => [
      { position: [-4.5, 1.65, -3.4] as [number, number, number], scale: 0.58, speed: 0.32, phase: 0.2, tone: "red" as const },
      { position: [-3.7, -1.15, -2.2] as [number, number, number], scale: 0.78, speed: 0.24, phase: 1.6, tone: "dark" as const },
      { position: [-5.1, -0.15, -4.4] as [number, number, number], scale: 0.42, speed: 0.38, phase: 3.1, tone: "red" as const },
      { position: [5.2, 1.65, -4.8] as [number, number, number], scale: 0.48, speed: 0.3, phase: 2.3, tone: "dark" as const },
      { position: [5.35, -1.35, -3.2] as [number, number, number], scale: 0.68, speed: 0.27, phase: 4.2, tone: "red" as const },
      { position: [4.45, -2.0, -5.1] as [number, number, number], scale: 0.36, speed: 0.42, phase: 5.1, tone: "dark" as const }
    ],
    []
  );

  useFrame(({ pointer, camera, clock }) => {
    const targetX = pointer.x * 0.42;
    const targetY = pointer.y * 0.24;

    camera.position.x += (targetX - camera.position.x) * 0.025;
    camera.position.y += (targetY - camera.position.y) * 0.025;
    camera.position.z = 7.7 + Math.sin(clock.elapsedTime * 0.18) * 0.08;
    camera.lookAt(0, -0.05, -1.6);

    if (rig.current) {
      rig.current.rotation.y +=
        (pointer.x * 0.07 - rig.current.rotation.y) * 0.018;
      rig.current.rotation.x +=
        (-pointer.y * 0.035 - rig.current.rotation.x) * 0.018;
    }
  });

  return (
    <group ref={rig}>
      <ambientLight intensity={0.34} />
      <directionalLight
        position={[-4, 6, 4]}
        intensity={2.1}
        color="#f7f8ff"
        castShadow
      />
      <spotLight
        position={[5.8, 4.5, 1.5]}
        angle={0.42}
        penumbra={0.85}
        intensity={95}
        distance={18}
        color="#9b0000"
      />
      <pointLight
        position={[-5, -0.5, 1.5]}
        intensity={26}
        distance={9}
        color="#8F0000"
      />

      <ConveyorField />
      <StockCore />

      {crates.map((crate, index) => (
        <Float
          key={index}
          speed={0.55 + index * 0.04}
          rotationIntensity={0.06}
          floatIntensity={0.12}
        >
          <Crate {...crate} />
        </Float>
      ))}

      <mesh position={[-3.25, 0.2, -4.2]} rotation={[0.12, -0.58, 0]}>
        <torusKnotGeometry args={[0.78, 0.11, 150, 22]} />
        <meshStandardMaterial
          color="#151519"
          roughness={0.18}
          metalness={0.92}
          emissive="#290000"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export function AuthScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 0, 7.7], fov: 43 }}
        dpr={[1, 1.55]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 7.5, 16]} />
        <WarehouseWorld />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(143,0,0,.17),transparent_34%),radial-gradient(circle_at_20%_58%,rgba(143,0,0,.09),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/65" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  );
}
