"use client";

import createGlobe, { type Arc, type Globe, type Marker } from "cobe";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

type Location = [number, number];

type GlobeMarker = {
  id: string;
  label: string;
  location: Location;
  primary?: boolean;
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

const COBE_MARKERS: Marker[] = MARKERS.map((marker) => ({
  id: marker.id,
  location: marker.location,
  // Keep COBE's native marker almost invisible. Its native anchor remains the
  // single source of truth for our custom pin position.
  size: marker.primary ? 0.008 : 0.005,
  color: marker.primary ? [1, 0.12, 0.16] : [0.78, 0.04, 0.07]
}));

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
const MARKER_ELEVATION = 0.05;
const GLOBE_SCALE = 0.98;

function projectVisibility(
  [lat, lon]: Location,
  phi: number,
  theta: number
) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  const radius = GLOBE_RADIUS + MARKER_ELEVATION;

  const px = -cosLat * Math.cos(lonRad) * radius;
  const py = Math.sin(latRad) * radius;
  const pz = cosLat * Math.sin(lonRad) * radius;

  const cx = Math.cos(theta);
  const cy = Math.cos(phi);
  const sx = Math.sin(theta);
  const sy = Math.sin(phi);

  const rx = cy * px + sy * pz;
  const ry = sy * sx * px + cx * py - cy * sx * pz;
  const rz = -sy * cx * px + sx * py + cy * cx * pz;

  return rz >= 0 || rx * rx + ry * ry >= GLOBE_RADIUS * GLOBE_RADIUS;
}

function findAnchor(wrapper: HTMLElement | null, markerId: string) {
  if (!wrapper) return null;

  for (const child of Array.from(wrapper.children)) {
    if (!(child instanceof HTMLElement)) continue;

    if (
      child.style.getPropertyValue("anchor-name").trim() ===
      `--cobe-${markerId}`
    ) {
      return child;
    }
  }

  return null;
}

export function GlobalStockGlobe({
  active = true
}: {
  active?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const rafRef = useRef<number | null>(null);
  const markerRefs = useRef(new Map<string, HTMLDivElement>());
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());

  const sizeRef = useRef(680);
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
      pointerRef.current = { x: event.clientX, y: event.clientY };
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
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
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
    if (!root || !canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    // COBE applies DPR internally. Passing CSS dimensions here avoids the
    // previous double-DPR render target that was wasting GPU time.
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      coarsePointer ? 1 : 1.25
    );
    const samples = coarsePointer ? 3800 : 5600;

    const readSize = () => {
      const rect = root.getBoundingClientRect();
      sizeRef.current = Math.max(
        320,
        Math.round(Math.min(rect.width, rect.height))
      );
    };

    readSize();
    animationStartRef.current = performance.now();

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: sizeRef.current,
      height: sizeRef.current,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.28,
      mapSamples: samples,
      mapBrightness: 6.25,
      mapBaseBrightness: 0,
      baseColor: [0.04, 0.042, 0.048],
      markerColor: [0.82, 0.04, 0.08],
      glowColor: [0.25, 0.012, 0.018],
      arcColor: [0.96, 0.08, 0.12],
      arcWidth: coarsePointer ? 1 : 1.15,
      arcHeight: 0.17,
      markerElevation: MARKER_ELEVATION,
      opacity: 0.95,
      scale: GLOBE_SCALE,
      offset: [0, 0],
      markers: COBE_MARKERS,
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

      if (before !== sizeRef.current) {
        globe.update({
          width: sizeRef.current,
          height: sizeRef.current
        });
      }
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(root);

    const tick = (timestamp: number) => {
      if (!globeRef.current) return;

      const shouldRender =
        activeRef.current &&
        visibleRef.current &&
        document.visibilityState === "visible";

      if (shouldRender && timestamp - lastFrameRef.current >= 15.5) {
        lastFrameRef.current = timestamp;

        if (!pointerRef.current) {
          if (!reducedMotion) {
            phiRef.current += coarsePointer ? 0.000045 : 0.00007;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00004) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= 0.932;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00004) {
            thetaRef.current = Math.max(
              -0.28,
              Math.min(0.28, thetaRef.current + velocityRef.current.theta)
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
          MARKERS[routeIndex + 1]?.id ?? MARKERS[1]?.id;
        const wrapper = canvas.parentElement;
        const cssSize = sizeRef.current;

        for (const marker of MARKERS) {
          const element = markerRefs.current.get(marker.id);
          const labelElement = labelRefs.current.get(marker.id);
          if (!element || !labelElement) continue;

          const anchor = findAnchor(wrapper, marker.id);
          const left = anchor
            ? Number.parseFloat(anchor.style.left)
            : Number.NaN;
          const top = anchor
            ? Number.parseFloat(anchor.style.top)
            : Number.NaN;
          const visible = projectVisibility(
            marker.location,
            phi,
            theta
          );

          if (!visible || !Number.isFinite(left) || !Number.isFinite(top)) {
            element.style.opacity = "0";
            element.style.visibility = "hidden";
            continue;
          }

          const pinX = (left / 100) * cssSize;
          const pinY = (top / 100) * cssSize;
          const activeDestination = marker.id === activeDestinationId;

          element.style.visibility = "visible";
          element.style.opacity =
            marker.primary || activeDestination ? "1" : "0.46";
          element.style.transform =
            `translate3d(${pinX.toFixed(1)}px,${pinY.toFixed(1)}px,0) translate(-50%,-100%)`;

          const shouldShowLabel =
            marker.primary || activeDestination;
          labelElement.style.opacity = shouldShowLabel ? "1" : "0";
          labelElement.style.transform = shouldShowLabel
            ? "translate3d(0,0,0)"
            : "translate3d(-4px,0,0)";
        }
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

      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
        {MARKERS.map((marker) => (
          <div
            key={marker.id}
            ref={(element) => {
              if (element) markerRefs.current.set(marker.id, element);
              else markerRefs.current.delete(marker.id);
            }}
            className={
              "gs-cobe-marker gs-cobe-marker-projected " +
              (marker.primary ? "gs-cobe-marker-primary" : "")
            }
          >
            <span className="gs-cobe-marker-content">
              <span className="gs-cobe-pin-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 36 48"
                  className="gs-cobe-pin-svg"
                  focusable="false"
                >
                  <path
                    className="gs-cobe-pin-shape"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18 1C8.61 1 1 8.61 1 18c0 12.45 17 29 17 29s17-16.55 17-29C35 8.61 27.39 1 18 1Zm0 9.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z"
                  />
                  <path
                    className="gs-cobe-pin-shine"
                    d="M8.1 19.2C8.1 10.9 13.7 5.7 20.7 5.4c4.2-.2 7.4 1.4 9.4 3.7-2.6-1.5-5.3-2.3-8.5-2.1-6.3.4-11.4 4.9-12 12.2-.2 2.7.3 5.2 1.2 7.5-1.8-2.1-2.7-4.5-2.7-7.5Z"
                  />
                </svg>
              </span>

              <span
                ref={(element) => {
                  if (element) labelRefs.current.set(marker.id, element);
                  else labelRefs.current.delete(marker.id);
                }}
                className="gs-cobe-marker-name"
              >
                {marker.label}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
