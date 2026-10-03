"use client";

import createGlobe from "cobe";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type Location = [number, number];

type GlobeMarker = {
  id: string;
  label: string;
  location: Location;
  size: number;
  primary?: boolean;
};

type GlobeArc = {
  id: string;
  label: string;
  from: Location;
  to: Location;
  destinationMarkerId: string;
};

type CobeGlobeHandle = {
  update: (state: Record<string, unknown>) => void;
  destroy: () => void;
};

const ARGENTINA: Location = [-34.6037, -58.3816];

const markers: GlobeMarker[] = [
  {
    id: "gs-buenos-aires",
    label: "ARGENTINA",
    location: ARGENTINA,
    size: 0.007,
    primary: true
  },
  {
    id: "gs-sao-paulo",
    label: "BRASIL",
    location: [-23.5505, -46.6333],
    size: 0.005
  },
  {
    id: "gs-mexico",
    label: "MÉXICO",
    location: [19.4326, -99.1332],
    size: 0.005
  },
  {
    id: "gs-new-york",
    label: "ESTADOS UNIDOS",
    location: [40.7128, -74.006],
    size: 0.005
  },
  {
    id: "gs-madrid",
    label: "ESPAÑA",
    location: [40.4168, -3.7038],
    size: 0.005
  },
  {
    id: "gs-london",
    label: "REINO UNIDO",
    location: [51.5074, -0.1278],
    size: 0.005
  },
  {
    id: "gs-berlin",
    label: "ALEMANIA",
    location: [52.52, 13.405],
    size: 0.005
  },
  {
    id: "gs-tokyo",
    label: "JAPÓN",
    location: [35.6762, 139.6503],
    size: 0.005
  },
  {
    id: "gs-sydney",
    label: "AUSTRALIA",
    location: [-33.8688, 151.2093],
    size: 0.005
  }
];

const arcs: GlobeArc[] = [
  {
    id: "gs-ba-brazil",
    label: "ARGENTINA → BRASIL",
    from: ARGENTINA,
    to: [-23.5505, -46.6333],
    destinationMarkerId: "gs-sao-paulo"
  },
  {
    id: "gs-ba-mexico",
    label: "ARGENTINA → MÉXICO",
    from: ARGENTINA,
    to: [19.4326, -99.1332],
    destinationMarkerId: "gs-mexico"
  },
  {
    id: "gs-ba-new-york",
    label: "ARGENTINA → USA",
    from: ARGENTINA,
    to: [40.7128, -74.006],
    destinationMarkerId: "gs-new-york"
  },
  {
    id: "gs-ba-madrid",
    label: "ARGENTINA → ESPAÑA",
    from: ARGENTINA,
    to: [40.4168, -3.7038],
    destinationMarkerId: "gs-madrid"
  },
  {
    id: "gs-ba-london",
    label: "ARGENTINA → UK",
    from: ARGENTINA,
    to: [51.5074, -0.1278],
    destinationMarkerId: "gs-london"
  },
  {
    id: "gs-ba-berlin",
    label: "ARGENTINA → ALEMANIA",
    from: ARGENTINA,
    to: [52.52, 13.405],
    destinationMarkerId: "gs-berlin"
  },
  {
    id: "gs-ba-tokyo",
    label: "ARGENTINA → JAPÓN",
    from: ARGENTINA,
    to: [35.6762, 139.6503],
    destinationMarkerId: "gs-tokyo"
  },
  {
    id: "gs-ba-sydney",
    label: "ARGENTINA → AUSTRALIA",
    from: ARGENTINA,
    to: [-33.8688, 151.2093],
    destinationMarkerId: "gs-sydney"
  }
];

const ROUTE_STAGGER_MS = 300;
const ROUTE_TRAVEL_MS = 1180;
const ROUTE_TAIL_LENGTH = 0.16;
const PIN_REVEAL_OFFSET_MS = ROUTE_TRAVEL_MS - 120;

const markerRevealDelay = new Map<string, number>([
  ["gs-buenos-aires", 0],
  ...arcs.map((arc, index) => [
    arc.destinationMarkerId,
    index * ROUTE_STAGGER_MS + PIN_REVEAL_OFFSET_MS
  ] as const)
]);

function anchorLabelStyle(
  id: string,
  kind: "marker" | "arc"
): CSSProperties {
  const visible =
    kind === "marker"
      ? `--cobe-visible-${id}`
      : `--cobe-visible-arc-${id}`;
  const anchor =
    kind === "marker" ? `--cobe-${id}` : `--cobe-arc-${id}`;

  return {
    position: "absolute",
    bottom: "anchor(top)",
    left: "anchor(center)",
    opacity: `var(${visible}, 0)`,
    positionAnchor: anchor,
    transform: "translate3d(-50%, -7px, 0)",
    transition: "opacity 140ms cubic-bezier(0.23, 1, 0.32, 1)"
  } as CSSProperties;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeInOutCubic(value: number) {
  const t = clamp01(value);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function toCartesian([lat, lon]: Location) {
  const latitude = (lat * Math.PI) / 180;
  const longitude = (lon * Math.PI) / 180;
  const cosLat = Math.cos(latitude);

  return [
    cosLat * Math.cos(longitude),
    Math.sin(latitude),
    cosLat * Math.sin(longitude)
  ] as const;
}

function toLocation([x, y, z]: readonly number[]): Location {
  const latitude = Math.atan2(y, Math.sqrt(x * x + z * z));
  const longitude = Math.atan2(z, x);

  return [
    (latitude * 180) / Math.PI,
    (longitude * 180) / Math.PI
  ];
}

function slerpLocation(from: Location, to: Location, progress: number): Location {
  const a = toCartesian(from);
  const b = toCartesian(to);
  const dot = Math.max(
    -1,
    Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])
  );
  const omega = Math.acos(dot);

  if (omega < 0.00001) return to;

  const sinOmega = Math.sin(omega);
  const t = clamp01(progress);
  const aWeight = Math.sin((1 - t) * omega) / sinOmega;
  const bWeight = Math.sin(t * omega) / sinOmega;

  return toLocation([
    a[0] * aWeight + b[0] * bWeight,
    a[1] * aWeight + b[1] * bWeight,
    a[2] * aWeight + b[2] * bWeight
  ]);
}

export function GlobalStockGlobe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobeHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(680);
  const phiRef = useRef(-1.08);
  const thetaRef = useRef(0.08);
  const dragRef = useRef({ phi: 0, theta: 0 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef({ phi: 0, theta: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const lastFrameRef = useRef(0);
  const routeStartRef = useRef(0);
  const routeAnimationDoneRef = useRef(false);

  const cobeMarkers = useMemo(
    () =>
      markers.map((marker) => ({
        id: marker.id,
        location: marker.location,
        size: marker.size
      })),
    []
  );

  const finalArcs = useMemo(
    () =>
      arcs.map((arc) => ({
        id: arc.id,
        from: arc.from,
        to: arc.to
      })),
    []
  );

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
      theta: Math.max(-0.24, Math.min(0.24, deltaY / 920))
    };

    const now = performance.now();
    const previous = lastPointerRef.current;

    if (previous) {
      const elapsed = Math.max(now - previous.t, 1);
      velocityRef.current = {
        phi: Math.max(
          -0.08,
          Math.min(0.08, ((event.clientX - previous.x) / elapsed) * 0.12)
        ),
        theta: Math.max(
          -0.035,
          Math.min(0.035, ((event.clientY - previous.y) / elapsed) * 0.045)
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
        -0.3,
        Math.min(0.3, thetaRef.current + dragRef.current.theta)
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
      coarsePointer ? 1.25 : 1.5
    );
    const samples = coarsePointer ? 6200 : 9800;

    const readSize = () => {
      const rect = root.getBoundingClientRect();
      const cssSize = Math.max(
        320,
        Math.round(Math.min(rect.width, rect.height))
      );
      sizeRef.current = Math.max(480, Math.round(cssSize * dpr));
      canvas.width = sizeRef.current;
      canvas.height = sizeRef.current;
    };

    readSize();

    const initialArcs = reducedMotion ? finalArcs : [];
    routeStartRef.current = performance.now();
    routeAnimationDoneRef.current = reducedMotion;

    const globe = createGlobe(
      canvas,
      {
        devicePixelRatio: dpr,
        width: sizeRef.current,
        height: sizeRef.current,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.35,
        mapSamples: samples,
        mapBrightness: 7.2,
        baseColor: [0.045, 0.047, 0.052],
        markerColor: [0.09, 0.01, 0.015],
        glowColor: [0.3, 0.018, 0.025],
        opacity: 0.94,
        scale: 0.98,
        offset: [0, 0],
        markers: cobeMarkers,
        arcs: initialArcs,
        arcColor: [0.9, 0.025, 0.035],
        arcWidth: 0.56,
        arcHeight: 0.38,
        markerElevation: 0.026
      } as never
    ) as unknown as CobeGlobeHandle;

    globeRef.current = globe;

    const observer = new ResizeObserver(() => {
      readSize();
      globe.update({
        width: sizeRef.current,
        height: sizeRef.current
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
            phiRef.current += coarsePointer ? 0.00115 : 0.00145;
          }

          if (Math.abs(velocityRef.current.phi) > 0.00008) {
            phiRef.current += velocityRef.current.phi;
            velocityRef.current.phi *= 0.94;
          }

          if (Math.abs(velocityRef.current.theta) > 0.00008) {
            thetaRef.current = Math.max(
              -0.3,
              Math.min(0.3, thetaRef.current + velocityRef.current.theta)
            );
            velocityRef.current.theta *= 0.92;
          }
        }

        let frameArcs = finalArcs;

        if (!routeAnimationDoneRef.current) {
          const elapsed = timestamp - routeStartRef.current;
          const animatedArcs: Array<{
            id: string;
            from: Location;
            to: Location;
          }> = [];

          arcs.forEach((arc, index) => {
            const local =
              (elapsed - index * ROUTE_STAGGER_MS) / ROUTE_TRAVEL_MS;

            if (local <= 0) return;

            if (local >= 1) {
              animatedArcs.push({
                id: arc.id,
                from: arc.from,
                to: arc.to
              });
              return;
            }

            const headProgress = easeInOutCubic(local);
            const tailProgress = Math.max(
              0,
              headProgress - ROUTE_TAIL_LENGTH
            );

            animatedArcs.push({
              id: arc.id + "-signal",
              from: slerpLocation(arc.from, arc.to, tailProgress),
              to: slerpLocation(arc.from, arc.to, headProgress)
            });
          });

          frameArcs = animatedArcs;

          const totalDuration =
            (arcs.length - 1) * ROUTE_STAGGER_MS + ROUTE_TRAVEL_MS;

          if (elapsed >= totalDuration) {
            routeAnimationDoneRef.current = true;
            frameArcs = finalArcs;
          }
        }

        globeRef.current.update({
          phi: phiRef.current + dragRef.current.phi,
          theta: Math.max(
            -0.3,
            Math.min(0.3, thetaRef.current + dragRef.current.theta)
          ),
          width: sizeRef.current,
          height: sizeRef.current,
          markers: cobeMarkers,
          arcs: frameArcs
        });
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
  }, [cobeMarkers, finalArcs, stopAnimation]);

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

      <div className="pointer-events-none absolute inset-0 z-[3]">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="gs-cobe-marker"
            style={anchorLabelStyle(marker.id, "marker")}
          >
            <span
              className={
                "gs-cobe-marker-content " +
                (marker.primary ? "gs-cobe-marker-primary" : "")
              }
              style={{
                animationDelay:
                  String(markerRevealDelay.get(marker.id) ?? 0) + "ms"
              }}
            >
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
              <span className="gs-cobe-marker-name">{marker.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
