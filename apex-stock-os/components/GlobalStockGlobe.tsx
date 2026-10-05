"use client";

import createGlobe, { type Globe } from "cobe";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

type Location = [number, number];

type GlobeMarker = {
  id: string;
  label: string;
  location: Location;
  primary?: boolean;
};

type GlobeRoute = {
  id: string;
  destinationId: string;
  from: Location;
  to: Location;
};

type Projection = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

type LabelLayout = {
  marker: GlobeMarker;
  projection: Projection;
  active: boolean;
  important: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
};

const ARGENTINA: Location = [-34.6037, -58.3816];

const MARKERS: GlobeMarker[] = [
  {
    id: "argentina",
    label: "ARGENTINA",
    location: ARGENTINA,
    primary: true
  },
  {
    id: "brasil",
    label: "BRASIL",
    location: [-23.5505, -46.6333]
  },
  {
    id: "mexico",
    label: "MÉXICO",
    location: [19.4326, -99.1332]
  },
  {
    id: "estados-unidos",
    label: "ESTADOS UNIDOS",
    location: [40.7128, -74.006]
  },
  {
    id: "espana",
    label: "ESPAÑA",
    location: [40.4168, -3.7038]
  },
  {
    id: "reino-unido",
    label: "REINO UNIDO",
    location: [51.5074, -0.1278]
  },
  {
    id: "alemania",
    label: "ALEMANIA",
    location: [52.52, 13.405]
  }
];

const ROUTES: GlobeRoute[] = MARKERS.filter(
  (marker) => !marker.primary
).map((marker) => ({
  id: "argentina-" + marker.id,
  destinationId: marker.id,
  from: ARGENTINA,
  to: marker.location
}));

// Closely mirrors the reference video: pins are already present, then the
// network propagates quickly from one origin, holds, softly fades, and repeats.
const NETWORK_STAGGER_MS = 210;
const NETWORK_DRAW_MS = 680;
const NETWORK_HOLD_MS = 2200;
const NETWORK_FADE_MS = 700;
const NETWORK_BUILD_MS =
  Math.max(0, ROUTES.length - 1) * NETWORK_STAGGER_MS + NETWORK_DRAW_MS;
const NETWORK_CYCLE_MS =
  NETWORK_BUILD_MS + NETWORK_HOLD_MS + NETWORK_FADE_MS;
const GLOBE_RADIUS = 0.8;
const GLOBE_SCALE = 0.98;

function latLonTo3D([lat, lon]: Location): [number, number, number] {
  const latitude = (lat * Math.PI) / 180;
  const longitude = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latitude);

  return [
    -cosLat * Math.cos(longitude),
    Math.sin(latitude),
    cosLat * Math.sin(longitude)
  ];
}

/**
 * Same world -> view rotation COBE uses internally.
 * The anchor is projected from the globe surface itself (radius 0.8), so the
 * point of every custom pin is physically attached to its country.
 */
function projectLocation(
  location: Location,
  phi: number,
  theta: number,
  width: number,
  height: number
): Projection {
  const source = latLonTo3D(location);
  const px = source[0] * GLOBE_RADIUS;
  const py = source[1] * GLOBE_RADIUS;
  const pz = source[2] * GLOBE_RADIUS;

  const cx = Math.cos(theta);
  const cy = Math.cos(phi);
  const sx = Math.sin(theta);
  const sy = Math.sin(phi);

  const rx = cy * px + sy * pz;
  const ry = sy * sx * px + cx * py - cy * sx * pz;
  const rz = -sy * cx * px + sx * py + cy * cx * pz;

  const aspect = width / Math.max(height, 1);
  const nx = ((rx / aspect) * GLOBE_SCALE + 1) / 2;
  const ny = (-ry * GLOBE_SCALE + 1) / 2;

  const x = nx * width;
  const y = ny * height;

  return {
    x,
    y,
    depth: rz,
    // Pins disappear as the country crosses the back hemisphere. This avoids
    // the old "floating through space" effect completely.
    visible:
      rz > 0.01 &&
      x > -28 &&
      x < width + 28 &&
      y > -28 &&
      y < height + 28
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function quadraticPoint(
  from: Projection,
  control: { x: number; y: number },
  to: Projection,
  t: number
) {
  const inv = 1 - t;

  return {
    x: inv * inv * from.x + 2 * inv * t * control.x + t * t * to.x,
    y: inv * inv * from.y + 2 * inv * t * control.y + t * t * to.y
  };
}

function drawAnimatedRoute(
  ctx: CanvasRenderingContext2D,
  from: Projection,
  to: Projection,
  progress: number,
  opacity: number,
  routeIndex: number
) {
  if (!from.visible || !to.visible || progress <= 0 || opacity <= 0) return;

  const eased = easeOutCubic(progress);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.min(22, distance * 0.055) * (routeIndex % 2 === 0 ? 1 : -1);
  const control = {
    x: (from.x + to.x) / 2 - (dy / distance) * bend,
    y: (from.y + to.y) / 2 + (dx / distance) * bend
  };
  const steps = Math.max(10, Math.ceil(34 * eased));

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    for (let step = 1; step <= steps; step += 1) {
      const t = (step / steps) * eased;
      const point = quadraticPoint(from, control, to, t);
      ctx.lineTo(point.x, point.y);
    }
  };

  ctx.save();
  ctx.globalAlpha = opacity;

  trace();
  ctx.strokeStyle = "rgba(143,0,0,.54)";
  ctx.lineWidth = 2.4;
  ctx.shadowColor = "rgba(255,20,38,.22)";
  ctx.shadowBlur = 8;
  ctx.stroke();

  trace();
  ctx.strokeStyle = "rgba(255,43,59,.88)";
  ctx.lineWidth = 1.05;
  ctx.shadowColor = "rgba(255,31,49,.78)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  if (eased < 0.995) {
    const head = quadraticPoint(from, control, to, eased);

    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,105,116,.98)";
    ctx.shadowColor = "rgba(255,32,50,.96)";
    ctx.shadowBlur = 16;
    ctx.fill();
  }

  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  );
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function pinScale(
  projection: Projection,
  important: boolean,
  pulseAmount: number
) {
  const depthFactor = Math.max(0, Math.min(1, projection.depth / 0.8));

  return (
    (important ? 1 : 0.82) *
    (0.9 + depthFactor * 0.12) *
    (1 + pulseAmount * 0.14)
  );
}

function drawVectorPin(
  ctx: CanvasRenderingContext2D,
  marker: GlobeMarker,
  projection: Projection,
  activeDestination: boolean,
  pulseAmount: number
) {
  if (!projection.visible) return;

  const isImportant = marker.primary || activeDestination;
  const scale = pinScale(projection, isImportant, pulseAmount);
  const pinHeight = 32 * scale;
  const pinWidth = 23 * scale;
  const x = projection.x;
  const y = projection.y;

  ctx.save();
  ctx.translate(x, y);

  // Soft glow belongs to the vector pin itself; no PNG/SVG overlay is used.
  ctx.shadowColor = isImportant
    ? "rgba(255,36,53,.62)"
    : "rgba(183,18,31,.34)";
  ctx.shadowBlur = (isImportant ? 14 : 8) + pulseAmount * 10;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    -pinWidth * 0.08,
    -pinHeight * 0.18,
    -pinWidth * 0.5,
    -pinHeight * 0.42,
    -pinWidth * 0.5,
    -pinHeight * 0.66
  );
  ctx.bezierCurveTo(
    -pinWidth * 0.5,
    -pinHeight * 0.9,
    -pinWidth * 0.28,
    -pinHeight,
    0,
    -pinHeight
  );
  ctx.bezierCurveTo(
    pinWidth * 0.28,
    -pinHeight,
    pinWidth * 0.5,
    -pinHeight * 0.9,
    pinWidth * 0.5,
    -pinHeight * 0.66
  );
  ctx.bezierCurveTo(
    pinWidth * 0.5,
    -pinHeight * 0.42,
    pinWidth * 0.08,
    -pinHeight * 0.18,
    0,
    0
  );
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    0,
    -pinHeight,
    0,
    -pinHeight * 0.08
  );
  gradient.addColorStop(0, isImportant ? "#ff3346" : "#c51627");
  gradient.addColorStop(1, isImportant ? "#bf0618" : "#7f0812");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(
    0,
    -pinHeight * 0.68,
    pinWidth * 0.18,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#070708";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    -pinWidth * 0.11,
    -pinHeight * 0.83,
    pinWidth * 0.07,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "rgba(255,255,255,.32)";
  ctx.fill();

  ctx.restore();

}

function boxesOverlap(a: LabelLayout, b: LabelLayout) {
  const gap = 5;

  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function drawMarkerLabels(
  ctx: CanvasRenderingContext2D,
  markers: GlobeMarker[],
  projections: Map<string, Projection>,
  activeDestinationId: string,
  showAllLabels: boolean,
  strongestPulse: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.font =
    "700 10px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textBaseline = "middle";

  const candidates = markers
    .map((marker) => {
      const projection = projections.get(marker.id);
      if (!projection?.visible) return null;

      const active = marker.id === activeDestinationId;
      const important = Boolean(marker.primary || active);
      if (!important && !showAllLabels) return null;

      const pulse = active ? strongestPulse : 0;
      const scale = pinScale(projection, important, pulse);
      const pinHeight = 32 * scale;
      const labelWidth =
        ctx.measureText(marker.label).width + (important ? 18 : 14);
      const labelHeight = important ? 24 : 20;

      return {
        marker,
        projection,
        active,
        important,
        width: labelWidth,
        height: labelHeight,
        x: projection.x,
        y: projection.y - pinHeight * 0.72 - labelHeight / 2
      } satisfies LabelLayout;
    })
    .filter((item): item is LabelLayout => Boolean(item))
    .sort((a, b) => {
      const priorityA = a.marker.primary ? 3 : a.active ? 2 : 1;
      const priorityB = b.marker.primary ? 3 : b.active ? 2 : 1;

      return priorityB - priorityA || a.projection.y - b.projection.y;
    });

  const placed: LabelLayout[] = [];
  const verticalOffsets = [0, -24, 24, -48, 48, -72, 72, -96, 96];

  for (const item of candidates) {
    const prefersLeft = item.projection.x > width * 0.64;
    const sideOrder = prefersLeft ? ["left", "right"] : ["right", "left"];
    let chosen: LabelLayout | null = null;

    for (const side of sideOrder) {
      for (const offsetY of verticalOffsets) {
        const rawX =
          side === "left"
            ? item.projection.x - 14 - item.width
            : item.projection.x + 14;
        const rawY = item.y + offsetY;
        const candidate: LabelLayout = {
          ...item,
          x: Math.max(10, Math.min(width - item.width - 10, rawX)),
          y: Math.max(10, Math.min(height - item.height - 10, rawY))
        };

        if (!placed.some((other) => boxesOverlap(candidate, other))) {
          chosen = candidate;
          break;
        }
      }

      if (chosen) break;
    }

    if (!chosen) {
      chosen = {
        ...item,
        x: Math.max(10, Math.min(width - item.width - 10, item.x + 14)),
        y: Math.max(10, Math.min(height - item.height - 10, item.y))
      };
    }

    placed.push(chosen);
  }

  for (const item of placed) {
    const labelCenterY = item.y + item.height / 2;
    const labelOnLeft = item.x + item.width / 2 < item.projection.x;
    const connectorX = labelOnLeft ? item.x + item.width : item.x;

    if (
      Math.abs(labelCenterY - item.projection.y) > 11 ||
      Math.abs(connectorX - item.projection.x) > 22
    ) {
      ctx.beginPath();
      ctx.moveTo(item.projection.x, item.projection.y - 3);
      ctx.lineTo(connectorX, labelCenterY);
      ctx.strokeStyle = item.important
        ? "rgba(255,72,86,.34)"
        : "rgba(255,255,255,.12)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    roundedRect(
      ctx,
      item.x,
      item.y,
      item.width,
      item.height,
      item.important ? 7 : 6
    );
    ctx.fillStyle = item.important
      ? "rgba(8,8,10,.90)"
      : "rgba(8,8,10,.76)";
    ctx.fill();
    ctx.strokeStyle = item.marker.primary
      ? "rgba(231,27,44,.76)"
      : item.active
        ? "rgba(255,255,255,.18)"
        : "rgba(255,255,255,.09)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = item.marker.primary
      ? "#ff6672"
      : item.active
        ? "#f5f5f7"
        : "rgba(243,243,245,.78)";
    ctx.fillText(
      item.marker.label,
      item.x + (item.important ? 9 : 7),
      item.y + item.height / 2 + 0.5
    );
  }

  ctx.restore();
}

function paintNetworkOverlay(
  canvas: HTMLCanvasElement,
  markers: GlobeMarker[],
  routes: GlobeRoute[],
  networkElapsed: number,
  phi: number,
  theta: number,
  width: number,
  height: number,
  dpr: number,
  showAllLabels: boolean,
  reducedMotion: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const projections = new Map<string, Projection>();
  for (const marker of markers) {
    projections.set(
      marker.id,
      projectLocation(marker.location, phi, theta, width, height)
    );
  }

  const argentinaProjection = projections.get("argentina");
  let activeDestinationId = "";
  let strongestPulse = 0;

  const fadeStart = NETWORK_BUILD_MS + NETWORK_HOLD_MS;
  const networkOpacity = reducedMotion
    ? 1
    : networkElapsed <= fadeStart
      ? 1
      : 1 - clamp01((networkElapsed - fadeStart) / NETWORK_FADE_MS);

  if (argentinaProjection) {
    ctx.save();
    const globeRadius = Math.min(width, height) * 0.49;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, globeRadius, 0, Math.PI * 2);
    ctx.clip();

    routes.forEach((route, index) => {
      const destinationProjection = projections.get(route.destinationId);
      if (!destinationProjection) return;

      const startAt = index * NETWORK_STAGGER_MS;
      const localTime = reducedMotion
        ? NETWORK_DRAW_MS
        : networkElapsed - startAt;
      const progress = reducedMotion
        ? 1
        : clamp01(localTime / NETWORK_DRAW_MS);

      if (localTime >= 0 && progress > 0) {
        drawAnimatedRoute(
          ctx,
          argentinaProjection,
          destinationProjection,
          progress,
          networkOpacity,
          index
        );
      }

      if (!reducedMotion && localTime >= 0) {
        activeDestinationId = route.destinationId;
      }

      const arrivalAt = startAt + NETWORK_DRAW_MS;
      const pulse = reducedMotion
        ? 0
        : clamp01(1 - Math.abs(networkElapsed - arrivalAt) / 240);

      if (pulse > strongestPulse) {
        strongestPulse = pulse;
        activeDestinationId = route.destinationId;
      }
    });

    ctx.restore();
  }

  for (const marker of markers) {
    const projection = projections.get(marker.id);
    if (!projection) continue;

    drawVectorPin(
      ctx,
      marker,
      projection,
      marker.id === activeDestinationId,
      marker.id === activeDestinationId ? strongestPulse : 0
    );
  }

  drawMarkerLabels(
    ctx,
    markers,
    projections,
    activeDestinationId,
    showAllLabels,
    strongestPulse,
    width,
    height
  );
}

export function GlobalStockGlobe({
  active = true
}: {
  active?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinsCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const rafRef = useRef<number | null>(null);

  const sizeRef = useRef({
    width: 680,
    height: 680,
    dpr: 1
  });
  const activeRef = useRef(active);
  const visibleRef = useRef(true);
  const phiRef = useRef(-1.02);
  const thetaRef = useRef(0.08);
  const dragRef = useRef({ phi: 0, theta: 0 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const velocityRef = useRef({ phi: 0, theta: 0 });
  const networkStartRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const wasActive = activeRef.current;
    activeRef.current = active;

    if (wasActive && !active) {
      networkStartRef.current = performance.now();
    }
  }, [active]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!pointerRef.current) return;

    const deltaX = event.clientX - pointerRef.current.x;
    const deltaY = event.clientY - pointerRef.current.y;

    dragRef.current = {
      phi: deltaX / 360,
      theta: Math.max(-0.22, Math.min(0.22, deltaY / 900))
    };

    const now = performance.now();
    const previous = lastPointerRef.current;

    if (previous) {
      const elapsed = Math.max(now - previous.t, 1);

      velocityRef.current = {
        phi: Math.max(
          -0.04,
          Math.min(0.04, ((event.clientX - previous.x) / elapsed) * 0.075)
        ),
        theta: Math.max(
          -0.02,
          Math.min(0.02, ((event.clientY - previous.y) / elapsed) * 0.028)
        )
      };
    }

    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: now
    };
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerRef.current) {
      phiRef.current += dragRef.current.phi;
      thetaRef.current = Math.max(
        -0.28,
        Math.min(0.28, thetaRef.current + dragRef.current.theta)
      );
    }

    pointerRef.current = null;
    dragRef.current = { phi: 0, theta: 0 };
    lastPointerRef.current = null;

    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: performance.now()
      };
      velocityRef.current = { phi: 0, theta: 0 };

      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true
    });
    window.addEventListener("pointerup", handlePointerUp, {
      passive: true
    });
    window.addEventListener("pointercancel", handlePointerUp, {
      passive: true
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const pinsCanvas = pinsCanvasRef.current;

    if (!root || !canvas || !pinsCanvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    // Keep the intro smooth on ordinary laptops and phones. The previous
    // DOM-anchor implementation forced layout reads/writes every frame.
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      coarsePointer ? 1 : 1.18
    );
    const samples = coarsePointer ? 3000 : 4600;

    const readSize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));

      sizeRef.current = {
        width,
        height,
        dpr
      };

      pinsCanvas.width = Math.max(1, Math.round(width * dpr));
      pinsCanvas.height = Math.max(1, Math.round(height * dpr));
    };

    readSize();
    networkStartRef.current = performance.now();

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.26,
      mapSamples: samples,
      mapBrightness: 6.2,
      mapBaseBrightness: 0,
      baseColor: [0.04, 0.042, 0.048],
      markerColor: [0.86, 0.04, 0.08],
      glowColor: [0.25, 0.012, 0.018],
      arcColor: [0.96, 0.08, 0.12],
      arcWidth: coarsePointer ? 0.9 : 1.05,
      arcHeight: 0.15,
      markerElevation: 0,
      opacity: 0.95,
      scale: GLOBE_SCALE,
      offset: [0, 0],
      // No native marker billboards and no DOM anchors. Every pin below is a
      // custom vector rendered on our own canvas from the exact globe transform.
      markers: [],
      arcs: [],
      context: {
        alpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
      }
    });

    globeRef.current = globe;

    const resizeObserver = new ResizeObserver(() => {
      const before = sizeRef.current;
      readSize();
      const after = sizeRef.current;

      if (
        before.width !== after.width ||
        before.height !== after.height
      ) {
        globe.update({
          width: after.width,
          height: after.height
        });
      }
    });

    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
      },
      {
        threshold: 0.01
      }
    );

    intersectionObserver.observe(root);

    const tick = (timestamp: number) => {
      if (!globeRef.current) return;

      const cinematic = activeRef.current;
      const shouldRender =
        visibleRef.current &&
        document.visibilityState === "visible";

      // During the intro we target full refresh-rate motion. Once the auth
      // panel is visible we keep a low-power idle animation instead of freezing
      // COBE on an arbitrary in-flight route frame.
      const frameInterval = cinematic
        ? 15.5
        : coarsePointer
          ? 50
          : 33;

      if (
        shouldRender &&
        timestamp - lastFrameRef.current >= frameInterval
      ) {
        lastFrameRef.current = timestamp;

        if (!pointerRef.current) {
          if (!reducedMotion) {
            phiRef.current += cinematic
              ? coarsePointer
                ? 0.00004
                : 0.000065
              : coarsePointer
                ? 0.00055
                : 0.0008;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00004) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= cinematic ? 0.932 : 0.9;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00004) {
            thetaRef.current = Math.max(
              -0.28,
              Math.min(
                0.28,
                thetaRef.current + velocityRef.current.theta
              )
            );
            velocityRef.current.theta *= cinematic ? 0.918 : 0.89;
          }
        }

        const phi = phiRef.current + dragRef.current.phi;
        const theta = Math.max(
          -0.28,
          Math.min(0.28, thetaRef.current + dragRef.current.theta)
        );

        const networkElapsed = reducedMotion
          ? NETWORK_BUILD_MS
          : (timestamp - networkStartRef.current) % NETWORK_CYCLE_MS;

        globeRef.current.update({
          phi,
          theta
        });

        const { width, height } = sizeRef.current;

        paintNetworkOverlay(
          pinsCanvas,
          MARKERS,
          ROUTES,
          networkElapsed,
          phi,
          theta,
          width,
          height,
          dpr,
          !cinematic,
          reducedMotion
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="gs-cobe-globe-shell relative h-full w-full"
      data-global-stock-globe
    >
      <canvas
        ref={canvasRef}
        className="gs-cobe-globe-canvas relative z-[2] h-full w-full cursor-grab touch-none select-none"
        onPointerDown={handlePointerDown}
        aria-label="Red global de Global Stock"
      />

      <canvas
        ref={pinsCanvasRef}
        className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}