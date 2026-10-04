"use client";

import createGlobe, { type Arc, type Globe } from "cobe";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

type Location = [number, number];

type GlobeMarker = {
  id: string;
  label: string;
  location: Location;
  primary?: boolean;
};

type Projection = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
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

const ROUTES: Arc[] = MARKERS.filter((marker) => !marker.primary).map(
  (marker) => ({
    id: "argentina-" + marker.id,
    from: ARGENTINA,
    to: marker.location,
    color: [0.96, 0.08, 0.12]
  })
);

const ROUTE_SLOT_MS = 2800;
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

function drawVectorPin(
  ctx: CanvasRenderingContext2D,
  marker: GlobeMarker,
  projection: Projection,
  activeDestination: boolean
) {
  if (!projection.visible) return;

  const isImportant = marker.primary || activeDestination;
  const depthFactor = Math.max(0, Math.min(1, projection.depth / 0.8));
  const scale = (isImportant ? 1 : 0.82) * (0.9 + depthFactor * 0.12);
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
  ctx.shadowBlur = isImportant ? 14 : 8;

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

  if (!isImportant) return;

  ctx.save();
  ctx.font =
    "700 10px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(marker.label).width;
  const labelWidth = textWidth + 18;
  const labelHeight = 24;
  const preferredX = x + 14;
  const maxX = ctx.canvas.width / (window.devicePixelRatio || 1) - labelWidth - 8;
  const labelX = Math.min(preferredX, Math.max(8, maxX));
  const labelY = y - pinHeight * 0.72 - labelHeight / 2;

  roundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 7);
  ctx.fillStyle = "rgba(8,8,10,.88)";
  ctx.fill();
  ctx.strokeStyle = marker.primary
    ? "rgba(231,27,44,.72)"
    : "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = marker.primary ? "#ff6672" : "#f3f3f5";
  ctx.fillText(marker.label, labelX + 9, labelY + labelHeight / 2 + 0.5);
  ctx.restore();
}

function paintPins(
  canvas: HTMLCanvasElement,
  markers: GlobeMarker[],
  activeDestinationId: string,
  phi: number,
  theta: number,
  width: number,
  height: number,
  dpr: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  for (const marker of markers) {
    const projection = projectLocation(
      marker.location,
      phi,
      theta,
      width,
      height
    );

    drawVectorPin(
      ctx,
      marker,
      projection,
      marker.id === activeDestinationId
    );
  }
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
  const animationStartRef = useRef(0);
  const lastFrameRef = useRef(0);
  const activeRouteRef = useRef(-1);

  useEffect(() => {
    activeRef.current = active;
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
    animationStartRef.current = performance.now();

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
      arcs: ROUTES.length ? [ROUTES[0]] : [],
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

      // The cinematic globe is only animated during the intro. Once the
      // authentication panel is visible, keep the last rendered frame instead
      // of waking the main thread on every display refresh.
      if (!activeRef.current) {
        rafRef.current = null;
        return;
      }

      const shouldRender =
        visibleRef.current &&
        document.visibilityState === "visible";

      if (shouldRender && timestamp - lastFrameRef.current >= 15.5) {
        lastFrameRef.current = timestamp;

        if (!pointerRef.current) {
          if (!reducedMotion) {
            phiRef.current += coarsePointer ? 0.00004 : 0.000065;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00004) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= 0.932;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00004) {
            thetaRef.current = Math.max(
              -0.28,
              Math.min(
                0.28,
                thetaRef.current + velocityRef.current.theta
              )
            );
            velocityRef.current.theta *= 0.918;
          }
        }

        const phi = phiRef.current + dragRef.current.phi;
        const theta = Math.max(
          -0.28,
          Math.min(0.28, thetaRef.current + dragRef.current.theta)
        );

        const routeIndex = reducedMotion
          ? 0
          : Math.floor(
              (timestamp - animationStartRef.current) / ROUTE_SLOT_MS
            ) % ROUTES.length;

        if (routeIndex !== activeRouteRef.current) {
          activeRouteRef.current = routeIndex;

          globeRef.current.update({
            arcs: ROUTES.length ? [ROUTES[routeIndex]] : []
          });
        }

        globeRef.current.update({
          phi,
          theta
        });

        const activeDestinationId =
          MARKERS[routeIndex + 1]?.id ?? MARKERS[1]?.id ?? "";

        const { width, height } = sizeRef.current;

        paintPins(
          pinsCanvas,
          MARKERS,
          activeDestinationId,
          phi,
          theta,
          width,
          height,
          dpr
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