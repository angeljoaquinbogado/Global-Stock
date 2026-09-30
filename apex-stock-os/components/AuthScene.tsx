"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Coordinate = [number, number];

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Coordinate[][] | Coordinate[][][];
};

type CountryFeature = {
  geometry?: Geometry | null;
};

const HUBS = [
  { lat: -34.6037, lng: -58.3816 },
  { lat: -23.5505, lng: -46.6333 },
  { lat: 40.7128, lng: -74.006 },
  { lat: 19.4326, lng: -99.1332 },
  { lat: 51.5072, lng: -0.1276 },
  { lat: 40.4168, lng: -3.7038 },
  { lat: 6.5244, lng: 3.3792 },
  { lat: 25.2048, lng: 55.2708 },
  { lat: 19.076, lng: 72.8777 },
  { lat: 1.3521, lng: 103.8198 },
  { lat: 35.6762, lng: 139.6503 },
  { lat: -33.8688, lng: 151.2093 }
];

const ARC_PAIRS = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [2, 4],
  [4, 6],
  [4, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [9, 11],
  [3, 9]
] as const;

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createEarthTexture(features: CountryFeature[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#04101a");
  ocean.addColorStop(0.48, "#071925");
  ocean.addColorStop(1, "#02070d");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawRing = (ring: Coordinate[]) => {
    if (ring.length < 2) return;

    ctx.beginPath();
    let previousX: number | null = null;

    ring.forEach(([lng, lat], index) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;

      if (
        index === 0 ||
        previousX === null ||
        Math.abs(x - previousX) > canvas.width * 0.45
      ) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      previousX = x;
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  ctx.fillStyle = "#26372f";
  ctx.strokeStyle = "rgba(201,220,207,.34)";
  ctx.lineWidth = 0.75;

  for (const country of features) {
    const geometry = country.geometry;
    if (!geometry) continue;

    if (geometry.type === "Polygon") {
      const rings = geometry.coordinates as Coordinate[][];
      rings.forEach(drawRing);
    } else {
      const polygons = geometry.coordinates as Coordinate[][][];
      polygons.forEach((rings) => rings.forEach(drawRing));
    }
  }

  const vignette = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.45,
    canvas.height * 0.08,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.65
  );
  vignette.addColorStop(0, "rgba(255,255,255,.02)");
  vignette.addColorStop(1, "rgba(0,0,0,.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

function createStarPositions(count: number, minRadius: number, maxRadius: number) {
  const positions = new Float32Array(count * 3);
  let seed = 90210;

  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, random());

    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}

function StarField() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => createStarPositions(900, 12, 45), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f7f9ff"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.66}
        depthWrite={false}
      />
    </points>
  );
}

function ArcLine({
  from,
  to,
  radius = 1.39
}: {
  from: (typeof HUBS)[number];
  to: (typeof HUBS)[number];
  radius?: number;
}) {
  const geometry = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, radius);
    const end = latLngToVector3(to.lat, to.lng, radius);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(radius + 0.34 + start.distanceTo(end) * 0.07);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(42);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, radius, to]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#d11111"
        transparent
        opacity={0.62}
      />
    </line>
  );
}

function HubPoints() {
  return (
    <group>
      {HUBS.map((hub, index) => {
        const position = latLngToVector3(hub.lat, hub.lng, 1.405);

        return (
          <group key={index} position={position}>
            <mesh>
              <sphereGeometry args={[index === 0 ? 0.034 : 0.022, 10, 10]} />
              <meshBasicMaterial color={index === 0 ? "#ff3535" : "#c90b0b"} />
            </mesh>
            <mesh scale={index === 0 ? 1.8 : 1.45}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial
                color="#ff2424"
                transparent
                opacity={0.18}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Earth() {
  const group = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();

  const features = useMemo(() => {
    const topology = countriesTopology as unknown as {
      objects: { countries: unknown };
    };
    const geo = feature(
      countriesTopology as never,
      topology.objects.countries as never
    ) as unknown as { features: CountryFeature[] };

    return geo.features;
  }, []);

  const texture = useMemo(() => createEarthTexture(features), [features]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (group.current) {
      const intro = THREE.MathUtils.smootherstep(
        Math.min(t / 5.2, 1),
        0,
        1
      );
      const targetRotation = THREE.MathUtils.lerp(-1.8, -0.58, intro);

      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        targetRotation + Math.max(0, t - 5.2) * 0.025 + pointer.x * 0.055,
        3.4,
        delta
      );

      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -0.08 - pointer.y * 0.02,
        3,
        delta
      );
    }

    const intro = THREE.MathUtils.smootherstep(
      Math.min(t / 5.2, 1),
      0,
      1
    );

    const targetZ = THREE.MathUtils.lerp(8.6, 4.5, intro);
    const targetX = THREE.MathUtils.lerp(-0.9, -0.42, intro);

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetZ,
      3.4,
      delta
    );
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      3.2,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      0.08 + pointer.y * 0.04,
      3.2,
      delta
    );
    camera.lookAt(-0.1, 0, 0);
  });

  return (
    <group ref={group} position={[-0.18, 0, 0]} rotation={[-0.08, -1.8, 0]}>
      <mesh>
        <sphereGeometry args={[1.38, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.78}
          metalness={0.02}
        />
      </mesh>

      <mesh scale={1.018}>
        <sphereGeometry args={[1.38, 48, 48]} />
        <meshBasicMaterial
          color="#8F0000"
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {ARC_PAIRS.map(([from, to]) => (
        <ArcLine
          key={`${from}-${to}`}
          from={HUBS[from]}
          to={HUBS[to]}
        />
      ))}

      <HubPoints />
    </group>
  );
}

export function AuthScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        camera={{ position: [-0.9, 0.15, 8.6], fov: 42 }}
        dpr={1}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.04
        }}
      >
        <color attach="background" args={["#010205"]} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[-4, 3, 6]}
          intensity={2.4}
          color="#d8e7ff"
        />
        <directionalLight
          position={[5, -1, 3]}
          intensity={0.9}
          color="#6d0000"
        />

        <StarField />
        <Earth />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,transparent_0%,rgba(0,0,0,.08)_44%,rgba(0,0,0,.75)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.12)_0%,rgba(0,0,0,.02)_48%,rgba(0,0,0,.55)_100%)]" />
    </div>
  );
}
