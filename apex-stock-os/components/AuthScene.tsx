"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import ThreeGlobe from "three-globe";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type GlobeArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string[];
};

type GlobePoint = {
  lat: number;
  lng: number;
  size: number;
  color: string;
};

const HUBS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "London", lat: 51.5072, lng: -0.1276 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 }
];

function buildArcs(): GlobeArc[] {
  const pairs = [
    [0, 1],
    [0, 2],
    [0, 4],
    [1, 3],
    [2, 4],
    [4, 5],
    [4, 6],
    [4, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [9, 11],
    [2, 10],
    [3, 9]
  ] as const;

  return pairs.map(([from, to]) => ({
    startLat: HUBS[from].lat,
    startLng: HUBS[from].lng,
    endLat: HUBS[to].lat,
    endLng: HUBS[to].lng,
    color: ["rgba(143,0,0,.22)", "rgba(255,38,38,.98)", "rgba(143,0,0,.18)"]
  }));
}

function GlobalGlobe() {
  const globe = useMemo(() => new ThreeGlobe({ waitForGlobeReady: true }), []);
  const globeGroup = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();

  const countries = useMemo(() => {
    const topology = countriesTopology as unknown as {
      objects: { countries: unknown };
    };
    const geo = feature(
      countriesTopology as never,
      topology.objects.countries as never
    ) as unknown as { features: unknown[] };

    return geo.features;
  }, []);

  const arcs = useMemo(buildArcs, []);
  const points = useMemo<GlobePoint[]>(
    () =>
      HUBS.map((hub, index) => ({
        lat: hub.lat,
        lng: hub.lng,
        size: index === 0 ? 0.18 : 0.095,
        color: index === 0 ? "#ff3131" : "#d20a0a"
      })),
    []
  );

  useEffect(() => {
    globe
      .showGlobe(true)
      .showAtmosphere(true)
      .atmosphereColor("#7a0000")
      .atmosphereAltitude(0.18)
      .polygonsData(countries)
      .polygonCapColor(() => "rgba(40,56,43,.95)")
      .polygonSideColor(() => "rgba(17,23,20,.96)")
      .polygonStrokeColor(() => "rgba(185,206,191,.16)")
      .polygonAltitude(() => 0.012)
      .arcsData(arcs)
      .arcColor((arc) => (arc as GlobeArc).color)
      .arcAltitudeAutoScale(0.34)
      .arcStroke(0.42)
      .arcDashLength(0.5)
      .arcDashGap(0.18)
      .arcDashAnimateTime(2600)
      .pointsData(points)
      .pointLat((point) => (point as GlobePoint).lat)
      .pointLng((point) => (point as GlobePoint).lng)
      .pointColor((point) => (point as GlobePoint).color)
      .pointAltitude(0.022)
      .pointRadius((point) => (point as GlobePoint).size)
      .ringsData(points)
      .ringLat((point) => (point as GlobePoint).lat)
      .ringLng((point) => (point as GlobePoint).lng)
      .ringColor(() => (t: number) => `rgba(255,30,30,${Math.max(0, 1 - t)})`)
      .ringMaxRadius(2.1)
      .ringPropagationSpeed(1.3)
      .ringRepeatPeriod(1700);

    const material = globe.globeMaterial() as THREE.MeshPhongMaterial;
    material.color = new THREE.Color("#07141f");
    material.emissive = new THREE.Color("#02070b");
    material.emissiveIntensity = 0.55;
    material.shininess = 18;
    material.specular = new THREE.Color("#29465b");

    globe.rotation.x = -0.08;
    globe.rotation.z = -0.02;
  }, [arcs, countries, globe, points]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (globeGroup.current) {
      const introRotation = Math.min(t / 5.8, 1);
      const base = -1.95 + introRotation * 1.25;
      const idle = Math.max(0, t - 5.8) * 0.035;
      globeGroup.current.rotation.y =
        base + idle + pointer.x * 0.08;
      globeGroup.current.rotation.x =
        -0.08 - pointer.y * 0.035;
    }

    const zoomProgress = THREE.MathUtils.smootherstep(
      Math.min(t / 5.6, 1),
      0,
      1
    );
    const desiredZ = THREE.MathUtils.lerp(10.8, 5.25, zoomProgress);
    const desiredX = THREE.MathUtils.lerp(-1.4, -0.55, zoomProgress) + pointer.x * 0.14;
    const desiredY = THREE.MathUtils.lerp(0.55, 0.12, zoomProgress) + pointer.y * 0.08;

    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredZ, 3.8, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredX, 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredY, 3.2, delta);
    camera.lookAt(-0.18, 0, 0);
  });

  return (
    <group ref={globeGroup} position={[-0.35, 0, 0]}>
      <primitive object={globe} />

      <mesh scale={1.04}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshBasicMaterial
          color="#2a0505"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.8, 0.22, 0]} scale={1.5}>
        <torusGeometry args={[1.08, 0.008, 10, 180]} />
        <meshBasicMaterial
          color="#8F0000"
          transparent
          opacity={0.18}
        />
      </mesh>
    </group>
  );
}

function MovingLight() {
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime * 0.24;
    light.current.position.set(
      Math.cos(t) * 4.8,
      2.2 + Math.sin(t * 0.8) * 0.6,
      3.4 + Math.sin(t) * 1.4
    );
  });

  return (
    <pointLight
      ref={light}
      intensity={26}
      distance={12}
      decay={2}
      color="#9e1414"
    />
  );
}

export function AuthScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        camera={{ position: [-1.4, 0.55, 10.8], fov: 41 }}
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08
        }}
      >
        <color attach="background" args={["#010205"]} />
        <fog attach="fog" args={["#010205", 7.8, 16]} />

        <ambientLight intensity={0.62} />
        <directionalLight
          position={[-4, 4, 6]}
          intensity={3.1}
          color="#d9e8ff"
        />
        <directionalLight
          position={[4, -1.5, 3]}
          intensity={1.4}
          color="#7a0000"
        />
        <MovingLight />

        <Stars
          radius={92}
          depth={48}
          count={2400}
          factor={2.2}
          saturation={0}
          fade
          speed={0.08}
        />

        <GlobalGlobe />

        <Environment preset="city" environmentIntensity={0.16} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_48%,rgba(0,0,0,0)_0%,rgba(0,0,0,.08)_34%,rgba(0,0,0,.74)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.18)_0%,rgba(0,0,0,.06)_45%,rgba(0,0,0,.58)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_50%_50%,transparent_0%,transparent_60%,rgba(0,0,0,.9)_100%)]" />
    </div>
  );
}
