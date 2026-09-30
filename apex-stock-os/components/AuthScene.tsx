"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Coordinate = [number, number];

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Coordinate[][] | Coordinate[][][];
};

type CountryFeature = {
  geometry?: Geometry | null;
};

type ViewerLocation = {
  lat: number;
  lng: number;
  timeZone: string;
  label: string;
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

const CITY_LIGHTS = [
  ...HUBS,
  { lat: 34.0522, lng: -118.2437 },
  { lat: 41.8781, lng: -87.6298 },
  { lat: 29.7604, lng: -95.3698 },
  { lat: 25.7617, lng: -80.1918 },
  { lat: 45.5019, lng: -73.5674 },
  { lat: 43.6532, lng: -79.3832 },
  { lat: 4.711, lng: -74.0721 },
  { lat: -12.0464, lng: -77.0428 },
  { lat: -33.4489, lng: -70.6693 },
  { lat: -34.9011, lng: -56.1645 },
  { lat: 48.8566, lng: 2.3522 },
  { lat: 52.52, lng: 13.405 },
  { lat: 41.9028, lng: 12.4964 },
  { lat: 52.3676, lng: 4.9041 },
  { lat: 38.7223, lng: -9.1393 },
  { lat: 55.7558, lng: 37.6173 },
  { lat: 30.0444, lng: 31.2357 },
  { lat: -1.2921, lng: 36.8219 },
  { lat: -26.2041, lng: 28.0473 },
  { lat: 24.7136, lng: 46.6753 },
  { lat: 35.6892, lng: 51.389 },
  { lat: 28.6139, lng: 77.209 },
  { lat: 23.8103, lng: 90.4125 },
  { lat: 13.7563, lng: 100.5018 },
  { lat: 22.3193, lng: 114.1694 },
  { lat: 31.2304, lng: 121.4737 },
  { lat: 39.9042, lng: 116.4074 },
  { lat: 37.5665, lng: 126.978 },
  { lat: -6.2088, lng: 106.8456 },
  { lat: -37.8136, lng: 144.9631 }
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

const TIMEZONE_ANCHORS: Record<string, Omit<ViewerLocation, "timeZone">> = {
  "America/Argentina/Buenos_Aires": {
    lat: -34.6037,
    lng: -58.3816,
    label: "Buenos Aires"
  },
  "America/Sao_Paulo": {
    lat: -23.5505,
    lng: -46.6333,
    label: "São Paulo"
  },
  "America/Mexico_City": {
    lat: 19.4326,
    lng: -99.1332,
    label: "Ciudad de México"
  },
  "America/New_York": {
    lat: 40.7128,
    lng: -74.006,
    label: "New York"
  },
  "America/Chicago": {
    lat: 41.8781,
    lng: -87.6298,
    label: "Chicago"
  },
  "America/Denver": {
    lat: 39.7392,
    lng: -104.9903,
    label: "Denver"
  },
  "America/Los_Angeles": {
    lat: 34.0522,
    lng: -118.2437,
    label: "Los Angeles"
  },
  "America/Toronto": {
    lat: 43.6532,
    lng: -79.3832,
    label: "Toronto"
  },
  "America/Bogota": {
    lat: 4.711,
    lng: -74.0721,
    label: "Bogotá"
  },
  "America/Lima": {
    lat: -12.0464,
    lng: -77.0428,
    label: "Lima"
  },
  "America/Santiago": {
    lat: -33.4489,
    lng: -70.6693,
    label: "Santiago"
  },
  "Europe/Madrid": {
    lat: 40.4168,
    lng: -3.7038,
    label: "Madrid"
  },
  "Europe/London": {
    lat: 51.5072,
    lng: -0.1276,
    label: "London"
  },
  "Europe/Paris": {
    lat: 48.8566,
    lng: 2.3522,
    label: "Paris"
  },
  "Europe/Berlin": {
    lat: 52.52,
    lng: 13.405,
    label: "Berlin"
  },
  "Europe/Rome": {
    lat: 41.9028,
    lng: 12.4964,
    label: "Rome"
  },
  "Europe/Lisbon": {
    lat: 38.7223,
    lng: -9.1393,
    label: "Lisbon"
  },
  "Africa/Cairo": {
    lat: 30.0444,
    lng: 31.2357,
    label: "Cairo"
  },
  "Africa/Johannesburg": {
    lat: -26.2041,
    lng: 28.0473,
    label: "Johannesburg"
  },
  "Asia/Dubai": {
    lat: 25.2048,
    lng: 55.2708,
    label: "Dubai"
  },
  "Asia/Kolkata": {
    lat: 22.5726,
    lng: 88.3639,
    label: "Kolkata"
  },
  "Asia/Singapore": {
    lat: 1.3521,
    lng: 103.8198,
    label: "Singapore"
  },
  "Asia/Tokyo": {
    lat: 35.6762,
    lng: 139.6503,
    label: "Tokyo"
  },
  "Asia/Seoul": {
    lat: 37.5665,
    lng: 126.978,
    label: "Seoul"
  },
  "Australia/Sydney": {
    lat: -33.8688,
    lng: 151.2093,
    label: "Sydney"
  }
};

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function resolveViewerLocation(timeZone: string): ViewerLocation {
  const exact = TIMEZONE_ANCHORS[timeZone];
  if (exact) return { ...exact, timeZone };

  const offsetHours = -new Date().getTimezoneOffset() / 60;
  const fallbackLng = THREE.MathUtils.clamp(offsetHours * 15, -175, 175);

  if (timeZone.startsWith("America/")) {
    return {
      lat: 20,
      lng: fallbackLng,
      timeZone,
      label: timeZone.split("/").pop()?.replaceAll("_", " ") ?? "America"
    };
  }

  if (timeZone.startsWith("Europe/")) {
    return {
      lat: 48,
      lng: fallbackLng,
      timeZone,
      label: timeZone.split("/").pop()?.replaceAll("_", " ") ?? "Europe"
    };
  }

  if (timeZone.startsWith("Asia/")) {
    return {
      lat: 25,
      lng: fallbackLng,
      timeZone,
      label: timeZone.split("/").pop()?.replaceAll("_", " ") ?? "Asia"
    };
  }

  if (timeZone.startsWith("Australia/")) {
    return {
      lat: -25,
      lng: fallbackLng,
      timeZone,
      label: timeZone.split("/").pop()?.replaceAll("_", " ") ?? "Australia"
    };
  }

  return {
    lat: 10,
    lng: fallbackLng,
    timeZone,
    label: "Local"
  };
}

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((current - start) / 86400000);
}

function solarDeclination(date: Date) {
  const n = dayOfYear(date);
  return THREE.MathUtils.degToRad(
    23.44 * Math.sin(THREE.MathUtils.degToRad((360 / 365) * (n - 81)))
  );
}

function subsolarPoint(date: Date) {
  const declination = solarDeclination(date);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  return {
    lat: THREE.MathUtils.radToDeg(declination),
    lng: (12 - utcHours) * 15
  };
}

function solarAltitude(date: Date, location: ViewerLocation) {
  const declination = solarDeclination(date);
  const lat = THREE.MathUtils.degToRad(location.lat);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const localSolarHours = utcHours + location.lng / 15;
  const hourAngle = THREE.MathUtils.degToRad(
    (localSolarHours - 12) * 15
  );

  const altitude = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
      Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  );

  return THREE.MathUtils.radToDeg(altitude);
}

function createEarthTextures(features: CountryFeature[]) {
  const width = 1280;
  const height = 640;

  const dayCanvas = document.createElement("canvas");
  dayCanvas.width = width;
  dayCanvas.height = height;
  const dayCtx = dayCanvas.getContext("2d");

  const nightCanvas = document.createElement("canvas");
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nightCtx = nightCanvas.getContext("2d");

  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 640;
  cloudCanvas.height = 320;
  const cloudCtx = cloudCanvas.getContext("2d");

  if (!dayCtx || !nightCtx || !cloudCtx) {
    return {
      day: new THREE.CanvasTexture(dayCanvas),
      night: new THREE.CanvasTexture(nightCanvas),
      clouds: new THREE.CanvasTexture(cloudCanvas)
    };
  }

  const ocean = dayCtx.createLinearGradient(0, 0, width, height);
  ocean.addColorStop(0, "#031323");
  ocean.addColorStop(0.45, "#08283a");
  ocean.addColorStop(1, "#020810");
  dayCtx.fillStyle = ocean;
  dayCtx.fillRect(0, 0, width, height);

  const drawRing = (
    ctx: CanvasRenderingContext2D,
    ring: Coordinate[],
    fill: string,
    stroke: string,
    lineWidth: number
  ) => {
    if (ring.length < 2) return;

    ctx.beginPath();
    let previousX: number | null = null;

    ring.forEach(([lng, lat], index) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;

      if (
        index === 0 ||
        previousX === null ||
        Math.abs(x - previousX) > width * 0.45
      ) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      previousX = x;
    });

    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.fill();
    ctx.stroke();
  };

  for (const country of features) {
    const geometry = country.geometry;
    if (!geometry) continue;

    const paint = (ring: Coordinate[]) =>
      drawRing(
        dayCtx,
        ring,
        "#253b32",
        "rgba(205,225,214,.26)",
        0.65
      );

    if (geometry.type === "Polygon") {
      (geometry.coordinates as Coordinate[][]).forEach(paint);
    } else {
      (geometry.coordinates as Coordinate[][][]).forEach((rings) =>
        rings.forEach(paint)
      );
    }
  }

  const dayGlow = dayCtx.createRadialGradient(
    width * 0.46,
    height * 0.42,
    height * 0.08,
    width * 0.46,
    height * 0.48,
    width * 0.62
  );
  dayGlow.addColorStop(0, "rgba(255,255,255,.06)");
  dayGlow.addColorStop(1, "rgba(0,0,0,.38)");
  dayCtx.fillStyle = dayGlow;
  dayCtx.fillRect(0, 0, width, height);

  nightCtx.fillStyle = "#010205";
  nightCtx.fillRect(0, 0, width, height);

  CITY_LIGHTS.forEach((city, index) => {
    const x = ((city.lng + 180) / 360) * width;
    const y = ((90 - city.lat) / 180) * height;
    const radius = index < HUBS.length ? 9 : 6;
    const glow = nightCtx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      radius
    );
    glow.addColorStop(0, "rgba(255,224,156,.98)");
    glow.addColorStop(0.22, "rgba(255,170,70,.72)");
    glow.addColorStop(1, "rgba(255,120,30,0)");
    nightCtx.fillStyle = glow;
    nightCtx.fillRect(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );
  });

  let seed = 481516;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  cloudCtx.clearRect(0, 0, cloudCanvas.width, cloudCanvas.height);
  for (let i = 0; i < 280; i += 1) {
    const x = random() * cloudCanvas.width;
    const y = random() * cloudCanvas.height;
    const rx = 9 + random() * 34;
    const ry = 3 + random() * 9;
    const opacity = 0.018 + random() * 0.07;
    cloudCtx.fillStyle = `rgba(255,255,255,${opacity})`;
    cloudCtx.beginPath();
    cloudCtx.ellipse(x, y, rx, ry, random() * Math.PI, 0, Math.PI * 2);
    cloudCtx.fill();
  }

  const day = new THREE.CanvasTexture(dayCanvas);
  day.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = 2;
  day.needsUpdate = true;

  const night = new THREE.CanvasTexture(nightCanvas);
  night.colorSpace = THREE.SRGBColorSpace;
  night.anisotropy = 2;
  night.needsUpdate = true;

  const clouds = new THREE.CanvasTexture(cloudCanvas);
  clouds.colorSpace = THREE.SRGBColorSpace;
  clouds.needsUpdate = true;

  return { day, night, clouds };
}

function createStarPositions(
  count: number,
  minRadius: number,
  maxRadius: number,
  flatten = 1
) {
  const positions = new Float32Array(count * 3);
  let seed = count * 137 + 90210;

  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, random());

    positions[index * 3] =
      radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] =
      radius * Math.cos(phi) * flatten;
    positions[index * 3 + 2] =
      radius * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}

function StarField({ night }: { night: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => createStarPositions(1450, 12, 48),
    []
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.0045;
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
        size={0.052}
        sizeAttenuation
        transparent
        opacity={night ? 0.82 : 0.58}
        depthWrite={false}
      />
    </points>
  );
}

function GalacticBand() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => createStarPositions(720, 16, 40, 0.22),
    []
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.0018;
  });

  return (
    <points
      ref={ref}
      rotation={[0.28, -0.35, -0.24]}
      frustumCulled={false}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7f8da8"
        size={0.095}
        sizeAttenuation
        transparent
        opacity={0.16}
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
  const line = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, radius);
    const end = latLngToVector3(to.lat, to.lng, radius);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(
        radius + 0.28 + start.distanceTo(end) * 0.065
      );

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      curve.getPoints(38)
    );
    const material = new THREE.LineBasicMaterial({
      color: "#b80000",
      transparent: true,
      opacity: 0.34
    });

    return new THREE.Line(geometry, material);
  }, [from, radius, to]);

  return <primitive object={line} />;
}

function HubPoints() {
  return (
    <group>
      {HUBS.map((hub, index) => {
        const position = latLngToVector3(
          hub.lat,
          hub.lng,
          1.405
        );

        return (
          <group key={index} position={position}>
            <mesh>
              <sphereGeometry
                args={[index === 0 ? 0.026 : 0.016, 9, 9]}
              />
              <meshBasicMaterial
                color={index === 0 ? "#ff3838" : "#b50909"}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CelestialBody({
  isDay,
  altitude
}: {
  isDay: boolean;
  altitude: number;
}) {
  const normalized = THREE.MathUtils.clamp(
    (altitude + 18) / 90,
    0.12,
    1
  );

  const y = THREE.MathUtils.lerp(-1.4, 3.1, normalized);
  const x = isDay ? 4.6 : -4.4;

  if (isDay) {
    return (
      <group position={[x, y, -5.5]}>
        <pointLight
          intensity={32}
          distance={24}
          color="#ffd99a"
        />
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshBasicMaterial color="#ffd37a" />
        </mesh>
        <mesh scale={1.6}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshBasicMaterial
            color="#ff9f36"
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, Math.max(y, 0.6), -4.8]}>
      <pointLight
        intensity={3.2}
        distance={14}
        color="#9bb8ff"
      />
      <mesh>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial
          color="#c7cedb"
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <mesh scale={1.45}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshBasicMaterial
          color="#a8b8db"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Earth({
  now,
  viewer
}: {
  now: Date;
  viewer: ViewerLocation;
}) {
  const group = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
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

  const textures = useMemo(
    () => createEarthTextures(features),
    [features]
  );

  const sunDirection = useMemo(() => {
    const point = subsolarPoint(now);
    return latLngToVector3(point.lat, point.lng, 1).normalize();
  }, [now]);

  const viewerRotation = useMemo(() => {
    const point = latLngToVector3(viewer.lat, viewer.lng, 1);
    const y = -Math.atan2(point.x, point.z);
    const x = THREE.MathUtils.degToRad(viewer.lat) * 0.22;
    return { x, y };
  }, [viewer.lat, viewer.lng]);

  const earthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: textures.day },
          nightMap: { value: textures.night },
          sunDirection: { value: sunDirection.clone() }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalWorld;

          void main() {
            vUv = uv;
            vNormalWorld = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayMap;
          uniform sampler2D nightMap;
          uniform vec3 sunDirection;
          varying vec2 vUv;
          varying vec3 vNormalWorld;

          void main() {
            vec3 normalW = normalize(vNormalWorld);
            float sunDot = dot(normalW, normalize(sunDirection));
            float daylight = smoothstep(-0.14, 0.22, sunDot);
            float twilight = 1.0 - smoothstep(-0.08, 0.18, abs(sunDot));

            vec3 dayColor = texture2D(dayMap, vUv).rgb;
            vec3 nightColor = texture2D(nightMap, vUv).rgb;
            vec3 color = mix(nightColor * 1.35, dayColor * (0.55 + max(sunDot, 0.0) * 0.75), daylight);
            color += twilight * vec3(0.055, 0.018, 0.012);

            gl_FragColor = vec4(color, 1.0);
          }
        `
      }),
    [sunDirection, textures.day, textures.night]
  );

  useEffect(() => {
    earthMaterial.uniforms.sunDirection.value.copy(sunDirection);
  }, [earthMaterial, sunDirection]);

  useEffect(() => {
    return () => {
      earthMaterial.dispose();
      textures.day.dispose();
      textures.night.dispose();
      textures.clouds.dispose();
    };
  }, [earthMaterial, textures]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (group.current) {
      const intro = THREE.MathUtils.smootherstep(
        Math.min(t / 5.2, 1),
        0,
        1
      );

      const targetRotation = THREE.MathUtils.lerp(
        viewerRotation.y - 1.15,
        viewerRotation.y,
        intro
      );

      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        targetRotation +
          Math.max(0, t - 5.2) * 0.012 +
          pointer.x * 0.045,
        3.1,
        delta
      );

      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        viewerRotation.x - pointer.y * 0.018,
        3,
        delta
      );
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.012;
    }

    const intro = THREE.MathUtils.smootherstep(
      Math.min(t / 5.2, 1),
      0,
      1
    );

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      THREE.MathUtils.lerp(8.7, 4.45, intro),
      3.3,
      delta
    );

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      THREE.MathUtils.lerp(-1.1, -0.32, intro),
      3.1,
      delta
    );

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      0.12 + pointer.y * 0.035,
      3.1,
      delta
    );

    camera.lookAt(-0.08, 0, 0);
  });

  return (
    <group
      ref={group}
      position={[-0.12, 0, 0]}
      rotation={[viewerRotation.x, viewerRotation.y - 1.15, 0]}
    >
      <mesh material={earthMaterial}>
        <sphereGeometry args={[1.38, 72, 72]} />
      </mesh>

      <mesh ref={cloudsRef} scale={1.008}>
        <sphereGeometry args={[1.38, 56, 56]} />
        <meshBasicMaterial
          map={textures.clouds}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.025}>
        <sphereGeometry args={[1.38, 56, 56]} />
        <meshBasicMaterial
          color="#79aee7"
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
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    setTimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );

    const timer = window.setInterval(
      () => setNow(new Date()),
      60_000
    );

    return () => window.clearInterval(timer);
  }, []);

  const viewer = useMemo(
    () => resolveViewerLocation(timeZone),
    [timeZone]
  );

  const altitude = useMemo(
    () => solarAltitude(now, viewer),
    [now, viewer]
  );

  const isDay = altitude > -6;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        camera={{ position: [-1.1, 0.18, 8.7], fov: 42 }}
        dpr={[1, 1.35]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDay ? 1.02 : 0.92
        }}
      >
        <color attach="background" args={["#010207"]} />
        <ambientLight intensity={isDay ? 0.18 : 0.08} />
        <directionalLight
          position={[4, 2.5, 6]}
          intensity={isDay ? 1.3 : 0.22}
          color={isDay ? "#ffe1b4" : "#7f98cc"}
        />
        <directionalLight
          position={[-5, -2, 2]}
          intensity={0.2}
          color="#4d1020"
        />

        <StarField night={!isDay} />
        <GalacticBand />
        <CelestialBody isDay={isDay} altitude={altitude} />
        <Earth now={now} viewer={viewer} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_48%,transparent_0%,rgba(0,0,0,.03)_42%,rgba(0,0,0,.72)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.16)_0%,rgba(0,0,0,.02)_48%,rgba(0,0,0,.48)_100%)]" />
    </div>
  );
}
