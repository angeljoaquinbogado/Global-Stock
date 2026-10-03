"use client";

import createGlobe from "cobe";
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
  destinationMarkerId: string;
  from: Location;
  to: Location;
};

type ScreenPoint = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

type CobeGlobeHandle = {
  update: (state: Record<string, unknown>) => void;
  destroy: () => void;
};

const ARGENTINA: Location = [-34.6037, -58.3816];

const markers: GlobeMarker[] = [
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

const routes: GlobeRoute[] = markers
  .filter((marker) => !marker.primary)
  .map((marker) => ({
    id: "argentina-" + marker.id,
    destinationMarkerId: marker.id,
    from: ARGENTINA,
    to: marker.location
  }));

const ROUTE_SLOT_MS = 2650;
const GLOBE_RADIUS = 0.8;
const GLOBE_SCALE = 0.98;
const MARKER_ELEVATION = 0.05;

const cobeMarkers = markers.map((marker) => ({
  id: marker.id,
  location: marker.location,
  size: marker.primary ? 0.055 : 0.038,
  color: marker.primary
    ? ([1, 0.13, 0.17] as [number, number, number])
    : ([0.78, 0.05, 0.08] as [number, number, number])
}));

const cobeArcs = routes.map((route) => ({
  id: route.id,
  from: route.from,
  to: route.to,
  color: [0.92, 0.07, 0.11] as [number, number, number]
}));

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function latLonTo3D([lat, lon]: Location): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);

  return [
    -cosLat * Math.cos(lonRad),
    Math.sin(latRad),
    cosLat * Math.sin(lonRad)
  ];
}

function projectLocation(
  location: Location,
  phi: number,
  theta: number,
  width: number,
  height: number
): ScreenPoint {
  const source = latLonTo3D(location);
  const radius = GLOBE_RADIUS + MARKER_ELEVATION;
  const px = source[0] * radius;
  const py = source[1] * radius;
  const pz = source[2] * radius;

  const cx = Math.cos(theta);
  const sx = Math.sin(theta);
  const cy = Math.cos(phi);
  const sy = Math.sin(phi);

  const rx = cy * px + sy * pz;
  const ry = sy * sx * px + cx * py - cy * sx * pz;
  const rz = -sy * cx * px + sx * py + cy * cx * pz;

  const aspect = width / Math.max(height, 1);
  const normalizedX = ((rx / aspect) * GLOBE_SCALE + 1) / 2;
  const normalizedY = (-ry * GLOBE_SCALE + 1) / 2;
  const screenX = normalizedX * width;
  const screenY = normalizedY * height;

  return {
    x: screenX,
    y: screenY,
    depth: rz,
    visible:
      (rz >= 0 || rx * rx + ry * ry >= GLOBE_RADIUS * GLOBE_RADIUS) &&
      screenX > -24 &&
      screenX < width + 24 &&
      screenY > -24 &&
      screenY < height + 24
  };
}

function routeGeometry(from: ScreenPoint, to: ScreenPoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / distance;
  const ny = dx / distance;
  const bend = Math.min(92, Math.max(28, distance * 0.18));
  const direction = to.x >= from.x ? -1 : 1;

  const cx = (from.x + to.x) / 2 + nx * bend * direction;
  const cy = (from.y + to.y) / 2 + ny * bend * direction - bend * 0.35;

  return {
    path: `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
    cx,
    cy
  };
}

function quadraticPoint(
  from: ScreenPoint,
  to: ScreenPoint,
  cx: number,
  cy: number,
  progress: number
) {
  const t = clamp01(progress);
  const inverse = 1 - t;

  return {
    x:
      inverse * inverse * from.x +
      2 * inverse * t * cx +
      t * t * to.x,
    y:
      inverse * inverse * from.y +
      2 * inverse * t * cy +
      t * t * to.y
  };
}

export function GlobalStockGlobe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobeHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const markerRefs = useRef(new Map<string, HTMLDivElement>());
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const routeRefs = useRef(new Map<string, SVGPathElement>());
  const pulseRef = useRef<SVGCircleElement | null>(null);

  const sizeRef = useRef({ css: 680, pixels: 680 });
  const phiRef = useRef(-1.02);
  const thetaRef = useRef(0.08);
  const dragRef = useRef({ phi: 0, theta: 0 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef({ phi: 0, theta: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const animationStartRef = useRef(0);
  const lastFrameRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

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
          -0.045,
          Math.min(0.045, ((event.clientX - previous.x) / elapsed) * 0.08)
        ),
        theta: Math.max(
          -0.025,
          Math.min(0.025, ((event.clientY - previous.y) / elapsed) * 0.03)
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
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      coarsePointer ? 1.2 : 1.45
    );
    const samples = coarsePointer ? 5600 : 9000;

    const readSize = () => {
      const rect = root.getBoundingClientRect();
      const cssSize = Math.max(
        320,
        Math.round(Math.min(rect.width, rect.height))
      );
      const pixelSize = Math.max(480, Math.round(cssSize * dpr));

      sizeRef.current = { css: cssSize, pixels: pixelSize };
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    };

    readSize();
    animationStartRef.current = performance.now();

    const globe = createGlobe(
      canvas,
      {
        devicePixelRatio: dpr,
        width: sizeRef.current.pixels,
        height: sizeRef.current.pixels,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.32,
        mapSamples: samples,
        mapBrightness: 6.6,
        baseColor: [0.04, 0.042, 0.048],
        markerColor: [0.12, 0.018, 0.022],
        glowColor: [0.28, 0.015, 0.022],
        opacity: 0.95,
        scale: GLOBE_SCALE,
        offset: [0, 0],
        markerElevation: MARKER_ELEVATION,
        markerColor: [0.86, 0.04, 0.08],
        markers: cobeMarkers,
        arcs: cobeArcs,
        arcColor: [0.92, 0.07, 0.11],
        arcWidth: 1.2,
        arcHeight: 0.16
      } as never
    ) as unknown as CobeGlobeHandle;

    globeRef.current = globe;

    const observer = new ResizeObserver(() => {
      readSize();
      globe.update({
        width: sizeRef.current.pixels,
        height: sizeRef.current.pixels
      });
    });

    observer.observe(root);

    const tick = (timestamp: number) => {
      if (!globeRef.current) return;

      if (
        document.visibilityState === "visible" &&
        timestamp - lastFrameRef.current >= 16
      ) {
        lastFrameRef.current = timestamp;

        if (!pointerRef.current) {
          if (!reducedMotion) {
            phiRef.current += coarsePointer ? 0.000055 : 0.000075;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00004) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= 0.935;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00004) {
            thetaRef.current = Math.max(
              -0.28,
              Math.min(0.28, thetaRef.current + velocityRef.current.theta)
            );
            velocityRef.current.theta *= 0.92;
          }
        }

        const phi = phiRef.current + dragRef.current.phi;
        const theta = Math.max(
          -0.28,
          Math.min(0.28, thetaRef.current + dragRef.current.theta)
        );

        globeRef.current.update({
          phi,
          theta,
          width: sizeRef.current.pixels,
          height: sizeRef.current.pixels
        });

        const elapsed = timestamp - animationStartRef.current;
        const activeIndex = reducedMotion
          ? 0
          : Math.floor(elapsed / ROUTE_SLOT_MS) % routes.length;
        const activeRoute = routes[activeIndex];
        const routePhase = reducedMotion
          ? 1
          : (elapsed % ROUTE_SLOT_MS) / ROUTE_SLOT_MS;
        const drawProgress = easeOutCubic(
          Math.min(1, routePhase / 0.68)
        );
        const routeOpacity = reducedMotion
          ? 0.82
          : routePhase < 0.82
            ? 0.86
            : Math.max(0, (1 - routePhase) / 0.18) * 0.86;

        const { css } = sizeRef.current;
        const projected = new Map<string, ScreenPoint>();

        for (const marker of markers) {
          const point = projectLocation(
            marker.location,
            phi,
            theta,
            css,
            css
          );
          projected.set(marker.id, point);

          const element = markerRefs.current.get(marker.id);
          const labelElement = labelRefs.current.get(marker.id);
          if (!element || !labelElement) continue;

          const activeDestination =
            marker.id === activeRoute?.destinationMarkerId;
          const shouldShowLabel =
            marker.primary || activeDestination;

          if (!point.visible) {
            element.style.opacity = "0";
            element.style.visibility = "hidden";
            continue;
          }

          element.style.visibility = "visible";
          element.style.opacity =
            marker.primary || activeDestination ? "1" : "0.48";
          element.style.transform =
            `translate3d(${point.x.toFixed(1)}px,${point.y.toFixed(1)}px,0) translate(-50%,-100%)`;
          labelElement.style.opacity = shouldShowLabel ? "1" : "0";
          labelElement.style.transform = shouldShowLabel
            ? "translate3d(0,0,0)"
            : "translate3d(-4px,0,0)";
        }

        for (const route of routes) {
          const pathElement = routeRefs.current.get(route.id);
          if (!pathElement) continue;

          pathElement.style.opacity = "0";
          pathElement.style.visibility = "hidden";
        }

        const origin = projected.get("argentina");
        const destination = activeRoute
          ? projected.get(activeRoute.destinationMarkerId)
          : null;
        const pathElement = activeRoute
          ? routeRefs.current.get(activeRoute.id)
          : null;
        const pulse = pulseRef.current;

        if (
          origin?.visible &&
          destination?.visible &&
          pathElement &&
          activeRoute
        ) {
          const geometry = routeGeometry(origin, destination);
          pathElement.setAttribute("d", geometry.path);
          pathElement.style.visibility = "visible";
          pathElement.style.opacity = String(routeOpacity);
          pathElement.style.strokeDashoffset = String(1 - drawProgress);

          if (pulse) {
            const pulsePoint = quadraticPoint(
              origin,
              destination,
              geometry.cx,
              geometry.cy,
              drawProgress
            );
            pulse.setAttribute("cx", pulsePoint.x.toFixed(2));
            pulse.setAttribute("cy", pulsePoint.y.toFixed(2));
            pulse.style.opacity = String(
              routeOpacity * (drawProgress > 0.04 ? 1 : 0)
            );
          }
        } else if (pulse) {
          pulse.style.opacity = "0";
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopAnimation();
      observer.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, [stopAnimation]);

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

      <svg
        className="hidden"
        aria-hidden="true"
      >
        <defs>
          <filter id="gs-route-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {routes.map((route) => (
          <path
            key={route.id}
            ref={(element) => {
              if (element) routeRefs.current.set(route.id, element);
              else routeRefs.current.delete(route.id);
            }}
            className="gs-cobe-route-path"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        ))}

        <circle
          ref={pulseRef}
          className="gs-cobe-route-pulse"
          cx="0"
          cy="0"
          r="3.2"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
        {markers.map((marker) => (
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
